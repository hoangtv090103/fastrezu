import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import {
  getSystemPrompt,
  getUserMessageTemplate,
  CVLanguage,
} from "@/lib/prompts";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { handleAPIError, logError } from "@/lib/error-handler";
import { tailorResumeSchema, validateSchema } from "@/lib/validation-schemas";
import { checkAndRecordAIUsage, rateLimitExceededResponse } from "@/lib/ai-rate-limit";

// Allow longer processing time for heavy AI model
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateSchema(tailorResumeSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }

    const { jobId, language } = validation.data;

    // Create Supabase client and authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // ignore in Server Components
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      "tailor-resume",
      profile?.subscription_tier,
    );
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.used, rateLimit.limit);
    }

    // Fetch job data (verify ownership via user_id)
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, company_name, raw_jd_text")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    if (!job.raw_jd_text) {
      return NextResponse.json(
        {
          error:
            language === "vi"
              ? "Vị trí tuyển dụng này chưa có nội dung JD. Vui lòng thêm mô tả công việc trước."
              : "This job has no JD content yet. Please add a job description first.",
        },
        { status: 400 }
      );
    }

    // Fetch job analysis (may not exist yet — optional)
    const { data: jobAnalysis } = await supabase
      .from("job_analyses")
      .select("keywords_required, gap_analysis, match_score")
      .eq("job_id", jobId)
      .maybeSingle();

    // Fetch all master_profiles sections for this user
    const { data: masterProfileRows, error: profileError } = await supabase
      .from("master_profiles")
      .select("section_type, content")
      .eq("user_id", user.id);

    if (profileError) {
      return NextResponse.json(
        {
          error:
            language === "vi"
              ? "Không thể tải dữ liệu hồ sơ. Vui lòng thử lại."
              : "Failed to load profile data. Please try again.",
        },
        { status: 500 }
      );
    }

    if (!masterProfileRows || masterProfileRows.length === 0) {
      return NextResponse.json(
        {
          error:
            language === "vi"
              ? "The Vault của bạn chưa có dữ liệu. Vui lòng điền hồ sơ sự nghiệp trước khi may đo CV."
              : "Your Vault has no data yet. Please fill in your career profile before tailoring.",
        },
        { status: 400 }
      );
    }

    // Convert rows to a section map for easier consumption by AI
    const masterProfile: Record<string, unknown> = {};
    for (const row of masterProfileRows) {
      masterProfile[row.section_type] = row.content;
    }

    // Build prompt data
    const jobData = {
      title: job.title,
      company: job.company_name,
      raw_jd_text: job.raw_jd_text,
    };

    const systemPrompt = getSystemPrompt("tailor_resume", language as CVLanguage);
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage);
    const userMessage = userMessageTemplates.tailor_resume(
      masterProfile,
      jobData,
      jobAnalysis ?? null
    );

    // Call OpenAI with heavy tier (GPT-4o quality)
    let tailoredCV: Record<string, unknown>;
    try {
      tailoredCV = await callOpenAI(systemPrompt, userMessage, { tier: "heavy" });
    } catch (openaiError) {
      const error = handleAPIError(
        openaiError,
        "tailor-resume OpenAI call",
        language as "vi" | "en"
      );
      logError(error);
      return NextResponse.json({ error: error.userMessage }, { status: 503 });
    }

    // Save tailored CV to resumes table (upsert by job_id)
    const { data: savedResume, error: saveError } = await supabase
      .from("resumes")
      .upsert(
        {
          job_id: jobId,
          content_snapshot: tailoredCV,
        },
        { onConflict: "job_id" }
      )
      .select("id")
      .single();

    if (saveError) {
      // Log but don't fail — return the tailored CV regardless
      console.error("Error saving tailored resume:", saveError);
    }

    return NextResponse.json(
      {
        ...tailoredCV,
        resume_id: savedResume?.id ?? null,
        job_id: jobId,
      },
      { status: 200 }
    );
  } catch (error) {
    const appError = handleAPIError(error, "tailor-resume API", "vi");
    logError(appError);

    return NextResponse.json(
      { error: appError.userMessage },
      { status: appError.code.startsWith("HTTP_4") ? 400 : 500 }
    );
  }
}
