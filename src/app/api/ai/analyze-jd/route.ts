import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const { jdText, language = 'vi' } = await request.json()

    if (!jdText || typeof jdText !== 'string') {
      return NextResponse.json({ error: 'Job description text is required' }, { status: 400 })
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language parameter. Must be "vi" or "en"' }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('analyze_jd', language as CVLanguage)

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage)
    const userMessage = userMessageTemplates.analyze_jd(jdText)

    // Gọi OpenAI API
    console.log('Calling OpenAI API with prompt length:', systemPrompt.length);
    const analysis = await callOpenAI(systemPrompt, userMessage);
    console.log('OpenAI API response:', analysis);

    return NextResponse.json(analysis, { status: 200 })
  } catch (error) {
    console.error('JD Analysis API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
