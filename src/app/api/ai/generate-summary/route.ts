import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const { personalInfo, experience, jdKeywords, language = 'vi' } = await request.json()

    if (!personalInfo?.full_name) {
      return NextResponse.json({ error: 'Personal information is required' }, { status: 400 })
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language parameter. Must be "vi" or "en"' }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('generate_summary', language as CVLanguage)

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage)
    const userMessage = userMessageTemplates.generate_summary(personalInfo, experience, jdKeywords)

    // Call AI API
    const result = await callOpenAI(systemPrompt, userMessage);

    if (!result.summary) {
      throw new Error('AI did not generate a summary');
    }

    return NextResponse.json({ summary: result.summary }, { status: 200 })
  } catch (error) {
    console.error('Generate Summary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
