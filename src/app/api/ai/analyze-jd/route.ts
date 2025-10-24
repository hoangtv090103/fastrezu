import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { jdText, cvId, language = 'vi' } = await request.json()

    if (!jdText || typeof jdText !== 'string') {
      return NextResponse.json({ error: 'Job description text is required' }, { status: 400 })
    }

    if (!cvId || typeof cvId !== 'string') {
      return NextResponse.json({ error: 'CV ID is required' }, { status: 400 })
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
    const analysis = await callOpenAI(systemPrompt, userMessage);

    // Lưu JD analysis vào database
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify CV belongs to user
    const { data: cv, error: cvError } = await supabase
      .from('cvs')
      .select('id')
      .eq('id', cvId)
      .eq('user_id', user.id)
      .single()

    if (cvError || !cv) {
      return NextResponse.json({ error: 'CV not found or access denied' }, { status: 404 })
    }

    // Save JD analysis to database
    const { data: jdAnalysis, error: saveError } = await supabase
      .from('jd_analyses')
      .insert({
        cv_id: cvId,
        jd_text: jdText,
        keywords_extracted: analysis.ats_keywords || [],
        analysis_result: analysis
      } as any)
      .select()
      .single()

    if (saveError) {
      console.error('Error saving JD analysis:', saveError)
      // Don't fail the request, just log the error
    } else {
      console.log('JD analysis saved to database:', (jdAnalysis as any).id)
    }

    return NextResponse.json(analysis, { status: 200 })
  } catch (error) {
    console.error('JD Analysis API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
