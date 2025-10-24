import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cvId = searchParams.get('cvId')

    if (!cvId) {
      return NextResponse.json({ error: 'CV ID is required' }, { status: 400 })
    }

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

    // Get JD analyses for this CV
    const { data: jdAnalyses, error: jdError } = await supabase
      .from('jd_analyses')
      .select('id, jd_text, keywords_extracted, analysis_result, created_at')
      .eq('cv_id', cvId)
      .order('created_at', { ascending: false })

    if (jdError) {
      console.error('Error fetching JD analyses:', jdError)
      return NextResponse.json({ error: 'Failed to fetch JD analyses' }, { status: 500 })
    }

    // Format response
    const formattedAnalyses = jdAnalyses.map(analysis => ({
      id: analysis.id,
      jdText: analysis.jd_text,
      keywords: analysis.keywords_extracted,
      analysis: analysis.analysis_result,
      createdAt: analysis.created_at,
      preview: analysis.jd_text.substring(0, 200) + (analysis.jd_text.length > 200 ? '...' : '')
    }))

    return NextResponse.json({ jdAnalyses: formattedAnalyses }, { status: 200 })
  } catch (error) {
    console.error('JD List API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
