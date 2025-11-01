import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'
import { AppError, handleAPIError, logError, ERROR_MESSAGES } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    const { personalInfo, experience, jdKeywords, language = 'vi' } = await request.json()

    // Validate personalInfo exists
    if (!personalInfo) {
      return NextResponse.json({ 
        error: language === 'vi' 
          ? 'Thông tin cá nhân không được để trống. Vui lòng điền phần thông tin cá nhân trước.'
          : 'Personal information is required. Please fill in the personal information section first.'
      }, { status: 400 })
    }

    // Validate full_name exists
    if (!personalInfo.full_name || typeof personalInfo.full_name !== 'string' || personalInfo.full_name.trim() === '') {
      return NextResponse.json({ 
        error: language === 'vi' 
          ? 'Họ và tên không được để trống. Vui lòng điền họ và tên trong phần thông tin cá nhân.'
          : 'Full name is required. Please fill in your full name in the personal information section.'
      }, { status: 400 })
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ 
        error: ERROR_MESSAGES.vi.validation_error 
      }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('generate_summary', language as CVLanguage)

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage)
    const userMessage = userMessageTemplates.generate_summary(personalInfo, experience, jdKeywords)

    // Call AI API
    let result;
    try {
      result = await callOpenAI(systemPrompt, userMessage);
    } catch (openaiError) {
      const error = handleAPIError(openaiError, 'generate-summary OpenAI call', language as 'vi' | 'en');
      logError(error);
      return NextResponse.json({ 
        error: error.userMessage 
      }, { status: 503 });
    }

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
