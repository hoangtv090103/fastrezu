import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import { z } from "zod";
import { getAIClient, getAIModel, injectDateContext } from "@/lib/openai";
import { checkAndRecordAIUsage, rateLimitExceededResponse } from "@/lib/ai-rate-limit";

export const maxDuration = 60;


// ── Types ────────────────────────────────────────────────────────────────────

export interface SectionScore {
  score: number;
  feedback: string;
}

export interface CVEvaluationResult {
  overall_score: number;
  ats_score: number;
  design_score: number | null; // null when no images (DOCX)
  sections: {
    contact: SectionScore;
    summary: SectionScore;
    experience: SectionScore;
    skills: SectionScore;
    education: SectionScore;
  };
  strengths: string[];
  improvements: string[];
  ats_tips: string[];
}

const SectionScoreSchema = z.object({
  score: z.number(),
  feedback: z.string(),
});

const CVEvaluationResultSchema = z.object({
  overall_score: z.number(),
  ats_score: z.number(),
  design_score: z.number().nullable(),
  sections: z.object({
    contact: SectionScoreSchema,
    summary: SectionScoreSchema,
    experience: SectionScoreSchema,
    skills: SectionScoreSchema,
    education: SectionScoreSchema,
  }),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  ats_tips: z.array(z.string()),
});


// ── System Prompts (bilingual) ────────────────────────────────────────────────

const EVALUATE_CV_PROMPT: Record<"vi" | "en", string> = {
  vi: `Bạn là chuyên gia tuyển dụng cấp cao và chuyên gia ATS (Hệ thống Theo dõi Ứng viên) với hơn 15 năm kinh nghiệm đánh giá CV trên mọi ngành nghề.

Nhiệm vụ: Phân tích CV được cung cấp — cả về mặt trực quan (qua hình ảnh trang khi có) lẫn nội dung văn bản (qua text trích xuất) — rồi trả về JSON đánh giá có cấu trúc.

## Tiêu chí Chấm điểm

### Điểm ATS (0–100)
Đánh giá khả năng vượt qua Hệ thống Theo dõi Ứng viên tự động:
- Mật độ và sự liên quan của từ khóa
- Tiêu đề section chuẩn (Liên lạc, Tóm tắt, Kinh nghiệm, Học vấn, Kỹ năng)
- Định dạng sạch, dễ phân tích (không bảng, text box, cột gây lỗi parser)
- Thành tích có định lượng (số liệu, %, $, đ)
- Định dạng ngày tháng nhất quán

### Điểm Thiết kế (0–100) — chỉ khi có hình ảnh
Đánh giá chất lượng trình bày và khả năng đọc:
- Hệ thống phân cấp trực quan và lựa chọn font chữ
- Khoảng trắng và mật độ nội dung
- Căn lề và khoảng cách nhất quán
- Sử dụng màu sắc (bảng màu chuyên nghiệp hay gây mất tập trung)
- Phân tách section và khả năng quét nhanh
- Độ dài (nên 1–2 trang với hầu hết vị trí)

### Điểm Tổng thể (0–100)
Trung bình có trọng số: ATS (50%) + Thiết kế (30%, hoặc 0 nếu không có hình ảnh) + Chiều sâu nội dung (20%)

### Điểm từng Section (0–100 mỗi section)
- **contact**: Đầy đủ thông tin liên lạc (tên, email, SĐT, LinkedIn, địa chỉ)
- **summary**: Chất lượng và sự súc tích của phần tóm tắt/mục tiêu nghề nghiệp
- **experience**: Chất lượng bullet points, động từ hành động, định lượng, liên quan
- **skills**: Sự đa dạng, cụ thể, tổ chức kỹ năng kỹ thuật và mềm
- **education**: Đầy đủ, liên quan, chứng chỉ được liệt kê

## Định dạng Đầu ra

Trả về ONLY JSON hợp lệ theo schema chính xác này — không markdown, không giải thích:

{
  "overall_score": <số nguyên 0-100>,
  "ats_score": <số nguyên 0-100>,
  "design_score": <số nguyên 0-100 hoặc null>,
  "sections": {
    "contact":    { "score": <0-100>, "feedback": "<1-2 câu phản hồi có thể hành động được>" },
    "summary":    { "score": <0-100>, "feedback": "<1-2 câu phản hồi có thể hành động được>" },
    "experience": { "score": <0-100>, "feedback": "<1-2 câu phản hồi có thể hành động được>" },
    "skills":     { "score": <0-100>, "feedback": "<1-2 câu phản hồi có thể hành động được>" },
    "education":  { "score": <0-100>, "feedback": "<1-2 câu phản hồi có thể hành động được>" }
  },
  "strengths": ["<chuỗi>", "<chuỗi>", "<chuỗi>"],
  "improvements": ["<chuỗi>", "<chuỗi>", "<chuỗi>"],
  "ats_tips": ["<chuỗi>", "<chuỗi>", "<chuỗi>"]
}

Hướng dẫn:
- strengths: 2–4 điểm mạnh cụ thể
- improvements: 3–5 cải thiện cụ thể, có thể hành động (bao gồm cảnh báo về font, màu, bố cục nếu hình ảnh cho thấy vấn đề)
- ats_tips: 3–4 mẹo tối ưu ATS cụ thể
- Tất cả văn bản phản hồi bằng **tiếng Việt**
- Hãy trung thực — CV điểm 60 phải cảm giác như 60, không phải 80`,

  en: `You are a senior recruiter and ATS (Applicant Tracking System) specialist with 15+ years of experience evaluating CVs across all industries.

Your task: Analyse the provided CV — both visually (via page images when available) and textually (via extracted text) — then return a structured JSON evaluation.

## Scoring Criteria

### ATS Score (0–100)
Evaluate how well the CV will pass Applicant Tracking Systems:
- Keyword density and relevance
- Standard section headings (Contact, Summary, Experience, Education, Skills)
- Clean parsing-friendly formatting (no tables, text boxes, or columns that confuse parsers)
- Quantified achievements (numbers, %, $)
- Proper date formatting

### Design Score (0–100) — only if images are provided
Evaluate visual quality and readability:
- Visual hierarchy and typography choices
- White space usage and density
- Consistent alignment and margins
- Color usage (professional palette vs. distracting)
- Section separation and scannability
- Length (should be 1–2 pages for most roles)

### Overall Score (0–100)
Weighted average: ATS (50%) + Design (30%, or 0 if no images) + Content depth (20%)

### Section Scores (0–100 each)
- **contact**: Completeness of contact info (name, email, phone, LinkedIn, location)
- **summary**: Quality and conciseness of the professional summary/objective
- **experience**: Bullet quality, action verbs, quantification, relevance
- **skills**: Breadth, specificity, organisation of technical and soft skills
- **education**: Completeness, relevance, certifications listed

## Output Format

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "overall_score": <integer 0-100>,
  "ats_score": <integer 0-100>,
  "design_score": <integer 0-100 or null>,
  "sections": {
    "contact":    { "score": <0-100>, "feedback": "<1-2 sentence actionable feedback>" },
    "summary":    { "score": <0-100>, "feedback": "<1-2 sentence actionable feedback>" },
    "experience": { "score": <0-100>, "feedback": "<1-2 sentence actionable feedback>" },
    "skills":     { "score": <0-100>, "feedback": "<1-2 sentence actionable feedback>" },
    "education":  { "score": <0-100>, "feedback": "<1-2 sentence actionable feedback>" }
  },
  "strengths": ["<string>", "<string>", "<string>"],
  "improvements": ["<string>", "<string>", "<string>"],
  "ats_tips": ["<string>", "<string>", "<string>"]
}

Guidelines:
- strengths: 2–4 specific things done well
- improvements: 3–5 specific, actionable improvements (include font/colour/layout warnings if images show problems)
- ats_tips: 3–4 concrete ATS optimisation tips
- All feedback text in **English**
- Be honest — a CV scoring 60 should feel like 60, not 80`,
};

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Rate limiting: check per-user daily AI usage quota
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const rateLimit = await checkAndRecordAIUsage(
      supabase,
      user.id,
      "evaluate-cv",
      profile?.subscription_tier,
    );
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.used, rateLimit.limit);
    }

    const body = await request.json();
    const {
      pageImages,
      extractedText,
      fileType,
      locale = "vi",
    } = body as {
      pageImages: string[];
      extractedText: string;
      fileType: "pdf" | "docx";
      locale?: "vi" | "en";
    };

    if (!extractedText && (!pageImages || pageImages.length === 0)) {
      return NextResponse.json(
        { error: "At least one of pageImages or extractedText is required" },
        { status: 400 },
      );
    }

    // Select the system prompt matching the UI locale
    const systemPrompt = EVALUATE_CV_PROMPT[locale] ?? EVALUATE_CV_PROMPT.vi;

    // Use the heavy-tier OpenAI client (gpt-4o for vision support)
    const client = getAIClient("heavy");
    const model = getAIModel("heavy");

    // Build multimodal user message content
    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [];

    // Always include the extracted text for content analysis
    userContent.push({
      type: "text",
      text: extractedText
        ? `CV Text Content:\n\n${extractedText}`
        : "No text could be extracted — evaluate from images only.",
    });

    // Include up to 3 page images (cap to avoid huge payloads)
    if (fileType === "pdf" && pageImages && pageImages.length > 0) {
      const pagesToAnalyse = pageImages.slice(0, 3);
      pagesToAnalyse.forEach((img, idx) => {
        userContent.push({
          type: "text",
          text: `Page ${idx + 1} of ${pageImages.length}:`,
        });
        userContent.push({
          type: "image_url",
          image_url: { url: img, detail: "high" },
        });
      });
    }

    const response = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: injectDateContext(systemPrompt) },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      },
      { timeout: 50000 }
    );

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("Empty response from AI");
    }

    const evaluation = CVEvaluationResultSchema.parse(JSON.parse(rawContent)) as CVEvaluationResult;

    // For DOCX (no images), force design_score to null
    if (fileType === "docx") {
      evaluation.design_score = null;
    }

    return NextResponse.json(evaluation, { status: 200 });
  } catch (err) {
    console.error("[evaluate-cv] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
