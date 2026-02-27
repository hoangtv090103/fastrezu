import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { callOpenAI } from "@/lib/openai";

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
      const parsed = z.string().uuid().safeParse(body.jobId);
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
      const parsed = z.string().url().safeParse(body.url);
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

    // ── Crawl with Jina.ai Reader ─────────────────────────────────────────
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    let crawledText: string;

    try {
      const crawlResponse = await fetch(jinaUrl, {
        headers: {
          Accept: "text/plain",
          "X-Return-Format": "text",
          ...(process.env.JINA_API_KEY
            ? { Authorization: `Bearer ${process.env.JINA_API_KEY}` }
            : {}),
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!crawlResponse.ok) {
        if ([401, 403].includes(crawlResponse.status)) {
          return NextResponse.json(
            {
              error:
                "Trang web này không cho phép lấy nội dung tự động. Vui lòng copy-paste JD thủ công.",
            },
            { status: 422 }
          );
        }
        return NextResponse.json(
          {
            error: `Không thể truy cập URL (lỗi ${crawlResponse.status}). Vui lòng kiểm tra lại.`,
          },
          { status: 422 }
        );
      }

      crawledText = await crawlResponse.text();
    } catch (err) {
      if (err instanceof Error && err.name === "TimeoutError") {
        return NextResponse.json(
          {
            error:
              "Quá thời gian chờ (30s). Vui lòng thử lại hoặc copy-paste JD thủ công.",
          },
          { status: 408 }
        );
      }
      return NextResponse.json(
        { error: "Không thể kết nối để lấy nội dung JD." },
        { status: 503 }
      );
    }

    if (!crawledText || crawledText.trim().length < 50) {
      return NextResponse.json(
        { error: "Trang không có nội dung hợp lệ" },
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
