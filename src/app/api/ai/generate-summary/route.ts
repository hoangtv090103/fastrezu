import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'
import { AppError, handleAPIError, logError, ERROR_MESSAGES } from '@/lib/error-handler'
import { logAIOperation } from '@/lib/logger'
import { createClient } from '@/lib/supabase-server'
import { checkAndRecordAIUsage, rateLimitExceededResponse } from '@/lib/ai-rate-limit'
import { validateSchema, generateSummarySchema } from '@/lib/validation-schemas'

export async function POST(request: NextRequest) {
  try {
    // Get user for tracking
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const rateLimit = await checkAndRecordAIUsage(
      supabase,
      user.id,
      "generate-summary",
      profile?.subscription_tier,
    );
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.used, rateLimit.limit);
    }
    
    const body = await request.json();
    
    // Validate request body with Zod
    const validation = validateSchema(generateSummarySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }

    const { personalInfo, experience, jdKeywords, language, cvId } = validation.data;

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('generate_summary', language as CVLanguage)

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage)
    const userMessage = userMessageTemplates.generate_summary(
      personalInfo, 
      (experience || []) as Record<string, unknown>[], 
      jdKeywords || []
    )

    // Call AI API with tracking
    const result = await logAIOperation(
      'generate_summary',
      async () => {
        try {
          return await callOpenAI(systemPrompt, userMessage);
        } catch (openaiError) {
          const error = handleAPIError(openaiError, 'generate-summary OpenAI call', language as 'vi' | 'en');
          logError(error);
          throw error;
        }
      },
      {
        userId: user?.id,
        cvId: cvId,
        language: language,
        featureName: 'generate_summary',
      }
    );

    if (!result.summary) {
      const error = new AppError(
        'AI did not generate a summary',
        'AI_GENERATION_FAILED',
        ERROR_MESSAGES[language as 'vi' | 'en'].ai_generation_failed,
        true
      );
      logError(error);
      return NextResponse.json({ error: error.userMessage }, { status: 500 });
    }

    return NextResponse.json({ summary: result.summary }, { status: 200 })
  } catch (error) {
    const appError = handleAPIError(error, 'generate-summary API', 'vi');
    logError(appError);
    return NextResponse.json({ 
      error: appError.userMessage 
    }, { status: 500 })
  }
}
