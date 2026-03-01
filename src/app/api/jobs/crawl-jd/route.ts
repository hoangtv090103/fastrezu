import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { callOpenAI } from "@/lib/openai";

// Allow up to 60s for this route (Vercel default is 10-15s which is too short for crawling)
export const maxDuration = 60;

// ── SSRF guard ────────────────────────────────────────────────────────────
function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!["http:", "https:"].includes(url.protocol)) return true;
    const h = url.hostname;
    return /^(localhost$|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|0\.0\.0\.0$)/i.test(
      h
    );
  } catch {
    return true;
  }
}

// ── Strip HTML tags to plain text (fallback when Jina unavailable) ────────
function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, "\n")
    .trim();
}

// ── Stage 1: Try Jina.ai Reader (enhanced crawl, 20s timeout) ─────────────
async function fetchViaJina(url: string): Promise<string | null> {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, {
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "text",
        ...(process.env.JINA_API_KEY
          ? { Authorization: `Bearer ${process.env.JINA_API_KEY}` }
          : {}),
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text && text.trim().length >= 50 ? text : null;
  } catch {
    return null;
  }
}

// ── Stage 2: Direct HTML fetch + strip (10s timeout) ─────────────────────
async function fetchDirect(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FastRezuBot/1.0; +https://fastrezu.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi,en;q=0.5",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return null;
    const html = await res.text();
    const text = htmlToText(html);
    return text.length >= 50 ? text : null;
  } catch {
    return null;
  }
}

// ── AI prompt to extract only the JD portion ─────────────────────────────
const EXTRACT_PROMPT = `Bạn là công cụ trích xuất nội dung tuyển dụng chuyên nghiệp.

Nhiệm vụ: Từ nội dung trang web được cung cấp, hãy trích xuất CHỈ phần Mô tả Công việc (Job Description).

Loại bỏ: navigation bar, header, footer, sidebar, quảng cáo, cookie notice, social sharing buttons, breadcrumb, metadata trang.
Giữ lại: tên vị trí, mô tả công ty (nếu ngắn), trách nhiệm/nhiệm vụ, yêu cầu kỹ năng, yêu cầu kinh nghiệm, quyền lợi, thông tin ứng tuyển.

Trả về JSON duy nhất (không giải thích thêm):
{ "jd_text": "<nội dung JD đã trích xuất, giữ nguyên cấu trúc và xuống dòng>" }

Nếu không phát hiện nội dung tuyển dụng rõ ràng, vẫn trả về nội dung chính của trang sau khi bỏ nav/footer.`;

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Determine mode: jobId (existing job → crawl + save) or url (pre-save → crawl only)
    let targetUrl: string;
    let jobId: string | undefined;

    if (body.jobId) {
      // Mode A: Existing job — fetch URL from DB, crawl, then save raw_jd_text
      const parsed = z.uuid().safeParse(body.jobId);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
      }
      jobId = parsed.data;

      const { data: job } = await supabase
        .from("jobs")
        .select("job_url")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();

      if (!job?.job_url) {
        return NextResponse.json(
          { error: "Job này chưa có URL để lấy JD" },
          { status: 400 }
        );
      }
      targetUrl = job.job_url;
    } else if (body.url) {
      // Mode B: Direct URL (used in AddJobModal before job is saved)
      const parsed = z.url().safeParse(body.url);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "URL không hợp lệ. Vui lòng kiểm tra lại." },
          { status: 400 }
        );
      }
      targetUrl = parsed.data;
    } else {
      return NextResponse.json(
        { error: "Cần cung cấp jobId hoặc url" },
        { status: 400 }
      );
    }

    // SSRF protection
    if (isPrivateUrl(targetUrl)) {
      return NextResponse.json(
        { error: "URL không hợp lệ hoặc không được phép truy cập" },
        { status: 400 }
      );
    }

    // ── Two-stage crawl: Jina.ai first, direct fetch as fallback ─────────
    let crawledText: string | null = null;

    // Stage 1: Jina.ai (better content extraction, may be slower)
    crawledText = await fetchViaJina(targetUrl);

    // Stage 2: Direct fetch fallback if Jina failed or timed out
    if (!crawledText) {
      crawledText = await fetchDirect(targetUrl);
    }

    if (!crawledText) {
      return NextResponse.json(
        {
          error:
            "Không thể lấy nội dung từ URL này. Trang có thể chặn truy cập tự động — vui lòng copy-paste JD thủ công.",
        },
        { status: 422 }
      );
    }

    // ── AI extract: keep only JD content ─────────────────────────────────
    // Trim to ~12k chars to avoid token overflow
    const trimmedContent = crawledText.slice(0, 12000);
    let jdText: string;

    try {
      const result = await callOpenAI(EXTRACT_PROMPT, trimmedContent, {
        tier: "light",
        responseFormat: "json_object",
      });
      const extracted = (result as { jd_text?: string }).jd_text;
      jdText =
        extracted && extracted.trim().length > 20
          ? extracted
          : trimmedContent.slice(0, 8000);
    } catch {
      // AI failed — fall back to raw crawled text
      jdText = trimmedContent.slice(0, 8000);
    }

    if (jdText.trim().length < 20) {
      return NextResponse.json(
        { error: "Không tìm thấy nội dung JD trong trang này" },
        { status: 422 }
      );
    }

    // ── Save to DB if Mode A (jobId provided) ────────────────────────────
    if (jobId) {
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ raw_jd_text: jdText })
        .eq("id", jobId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[crawl-jd] DB update error:", updateError);
        // Still return the text even if save failed
      }
    }

    return NextResponse.json({ raw_jd_text: jdText }, { status: 200 });
  } catch (error) {
    console.error("[crawl-jd] Unexpected error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
