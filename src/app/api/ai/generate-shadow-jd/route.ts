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
import { generateShadowJDSchema, validateSchema } from "@/lib/validation-schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const validation = validateSchema(generateShadowJDSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    const { jobTitle, level, cvId, language } = validation.data;

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt("generate_shadow_jd", language as CVLanguage);

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage);
    const userMessage = userMessageTemplates.generate_shadow_jd(jobTitle, level);

    // Call OpenAI API
    let shadowJD;
    try {
      shadowJD = await callOpenAI(systemPrompt, userMessage);
    } catch (openaiError) {
      const error = handleAPIError(
        openaiError,
        "generate-shadow-jd OpenAI call",
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

    // Save Shadow JD analysis to database
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

    // Save Shadow JD analysis to database with mode='shadow'
    const { error: saveError } = await supabase.from("jd_analyses").insert({
      cv_id: cvId,
      jd_text: `Shadow JD for ${jobTitle} (${level})`, // Placeholder text
      keywords_extracted: shadowJD.ats_keywords || [],
      analysis_result: shadowJD,
      mode: 'shadow', // Mark as Shadow JD
      shadow_job_title: jobTitle,
      shadow_level: level,
    });

    if (saveError) {
      console.error("Error saving Shadow JD analysis:", saveError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(shadowJD, { status: 200 });
  } catch (error) {
    const appError = handleAPIError(error, "generate-shadow-jd API", language as "vi" | "en");
    logError(appError);

    return NextResponse.json(
      {
        error: appError.userMessage,
      },
      { status: appError.code.startsWith("HTTP_4") ? 400 : 500 }
    );
  }
}
