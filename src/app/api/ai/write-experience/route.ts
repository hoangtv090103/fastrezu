import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'
import { handleAPIError, logError } from '@/lib/error-handler'
import { writeExperienceSchema, validateSchema } from '@/lib/validation-schemas'
import { createClient } from '@/lib/supabase-server'
import { checkAndRecordAIUsage, rateLimitExceededResponse } from '@/lib/ai-rate-limit'

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
      "write-experience",
      profile?.subscription_tier,
    );
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit.used, rateLimit.limit);
    }

    const body = await request.json();

    // Validate with Zod
    const validation = validateSchema(writeExperienceSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      );
    }
    
    const { jobTitle, company, jdKeywords, experienceLevel, language, mode, currentDescription } = validation.data;

    // Get system prompt based on language and mode
    const promptName = mode === 'shadow' ? 'write_experience_generic' : 'write_experience';
    const systemPrompt = getSystemPrompt(promptName, language as CVLanguage);

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage);
    
    let userMessage;
    if (mode === 'shadow') {
      userMessage = userMessageTemplates.write_experience_generic(
        jobTitle, 
        company || '', 
        currentDescription || '', 
        jdKeywords, 
        experienceLevel || ''
      );
    } else {
      userMessage = userMessageTemplates.write_experience(
        jobTitle, 
        company || '', 
        jdKeywords, 
        experienceLevel || ''
      );
    }

    // Call OpenAI API
    let result;
    try {
      result = await callOpenAI(systemPrompt, userMessage);
    } catch (openaiError) {
      const error = handleAPIError(openaiError, 'write-experience OpenAI call', language as 'vi' | 'en');
      logError(error);
      return NextResponse.json({ 
        error: error.userMessage 
      }, { status: 503 });
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const appError = handleAPIError(error, 'write-experience API', 'vi');
    logError(appError);
    return NextResponse.json({ 
      error: appError.userMessage 
    }, { status: 500 })
  }
}

