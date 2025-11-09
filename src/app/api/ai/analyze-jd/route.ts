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
import { analyzeJDSchema, validateSchema } from "@/lib/validation-schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const validation = validateSchema(analyzeJDSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    const { jdText, cvId, language } = validation.data;

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt("analyze_jd", language as CVLanguage);

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage);
    const userMessage = userMessageTemplates.analyze_jd(jdText);

    // Call OpenAI API
    let analysis;
    try {
      analysis = await callOpenAI(systemPrompt, userMessage);
    } catch (openaiError) {
      const error = handleAPIError(
        openaiError,
        "analyze-jd OpenAI call",
        language as "vi" | "en"
      );
      logError(error);
      return NextResponse.json(
        {
          error: error.userMessage,
        },
        { status: 503 }
      );
    }

    // Lưu JD analysis vào database
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
            } catch (error) {
              console.error("Error setting cookies:", error);
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

    // Verify CV belongs to user
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id")
      .eq("id", cvId)
      .eq("user_id", user.id)
      .single();

    if (cvError || !cv) {
      return NextResponse.json(
        { error: "CV not found or access denied" },
        { status: 404 }
      );
    }

    // Save JD analysis to database
    const { error: saveError } = await supabase.from("jd_analyses").insert({
      cv_id: cvId,
      jd_text: jdText,
      keywords_extracted: analysis.ats_keywords || [],
      analysis_result: analysis,
    });

    if (saveError) {
      console.error("Error saving JD analysis:", saveError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    const appError = handleAPIError(error, "analyze-jd API", "vi");
    logError(appError);

    return NextResponse.json(
      {
        error: appError.userMessage,
      },
      { status: appError.code.startsWith("HTTP_4") ? 400 : 500 }
    );
  }
}
