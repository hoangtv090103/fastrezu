import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/openai";
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts';
import { AppError, handleAPIError, logError, ERROR_MESSAGES } from '@/lib/error-handler';
import { improveBulletSchema, validateSchema } from '@/lib/validation-schemas';
import { createClient } from "@/lib/supabase-server";
import { checkAndRecordAIUsage, rateLimitExceededResponse } from "@/lib/ai-rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Auth guard
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
      "improve-bullet",
      profile?.subscription_tier,
    );
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.used, rateLimit.limit);
    }

    const body = await request.json();

    // Validate request body with Zod
    const validation = validateSchema(improveBulletSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    const { bulletPoint, context: _context, jdKeywords: _jdKeywords, language, mode } = validation.data;

    // Get system prompt based on language and mode
    const promptType = mode === 'shadow' ? 'improve_bullet_generic' : 'improve_bullet';
    const systemPrompt = getSystemPrompt(promptType, language as CVLanguage);

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage);
    const userMessage = mode === 'shadow' 
      ? userMessageTemplates.improve_bullet_generic(bulletPoint, _context || {}, _jdKeywords || [])
      : userMessageTemplates.improve_bullet(bulletPoint, _context || {}, _jdKeywords || []);

    // Call AI API
    let result;
    try {
      result = await callOpenAI(systemPrompt, userMessage);
    } catch (openaiError) {
      const error = handleAPIError(openaiError, 'improve-bullet OpenAI call', language as 'vi' | 'en');
      logError(error);
      return NextResponse.json({ 
        error: error.userMessage 
      }, { status: 503 });
    }

    if (!result.improvedBullet) {
      const error = new AppError(
        'AI did not generate improved bullet point',
        'AI_GENERATION_FAILED',
        ERROR_MESSAGES[language as 'vi' | 'en'].ai_generation_failed,
        true
      );
      logError(error);
      return NextResponse.json({ error: error.userMessage }, { status: 500 });
    }

    return NextResponse.json(
      { improvedBullet: result.improvedBullet },
      { status: 200 }
    );
  } catch (error) {
    const appError = handleAPIError(error, 'improve-bullet API', 'vi');
    logError(appError);
    return NextResponse.json(
      { error: appError.userMessage },
      { status: 500 }
    );
  }
}
