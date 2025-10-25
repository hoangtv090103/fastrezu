import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/openai'
import { getSystemPrompt, getUserMessageTemplate, CVLanguage } from '@/lib/prompts'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
    let analysis;
    try {
      analysis = await callOpenAI(systemPrompt, userMessage);
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json({ 
        error: 'Lỗi kết nối đến dịch vụ AI. Vui lòng thử lại sau.' 
      }, { status: 502 });
    }

    // Lưu JD analysis vào database
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )
    
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
    const { error: saveError } = await supabase
      .from('jd_analyses')
      .insert({
        cv_id: cvId,
        jd_text: jdText,
        keywords_extracted: analysis.ats_keywords || [],
        analysis_result: analysis
      })

    if (saveError) {
      console.error('Error saving JD analysis:', saveError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json(analysis, { status: 200 })
  } catch (error) {
    console.error('JD Analysis API error:', error)
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        error: 'Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Có lỗi xảy ra trên server. Vui lòng thử lại sau.' 
    }, { status: 500 });
  }
}
