import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'
import { handleAPIError, logError, ERROR_MESSAGES } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, company, jdKeywords, experienceLevel, language = 'vi' } = await request.json()

    if (!jobTitle || !jdKeywords || !Array.isArray(jdKeywords)) {
      return NextResponse.json({ 
        error: ERROR_MESSAGES[language as 'vi' | 'en'].validation_error 
      }, { status: 400 })
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ 
        error: ERROR_MESSAGES.vi.validation_error 
      }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('write_experience', language as CVLanguage)

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage)
    const userMessage = userMessageTemplates.write_experience(jobTitle, company, jdKeywords, experienceLevel)

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

