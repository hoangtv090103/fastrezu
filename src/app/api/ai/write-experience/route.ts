import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const { jobTitle, company, jdKeywords, experienceLevel, language = 'vi' } = await request.json()

    if (!jobTitle || !jdKeywords || !Array.isArray(jdKeywords)) {
      return NextResponse.json({ error: 'Job title and JD keywords are required' }, { status: 400 })
    }

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language parameter. Must be "vi" or "en"' }, { status: 400 })
    }

    // Get system prompt based on language
    const systemPrompt = getSystemPrompt('write_experience', language as CVLanguage)

    // Get user message template based on language
    const userMessageTemplates = getUserMessageTemplate(language as CVLanguage)
    const userMessage = userMessageTemplates.write_experience(jobTitle, company, jdKeywords, experienceLevel)

    // Gọi OpenAI API
    const result = await callOpenAI(systemPrompt, userMessage);

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Write Experience API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

