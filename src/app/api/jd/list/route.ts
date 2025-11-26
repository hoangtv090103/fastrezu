import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { jdListQuerySchema, validateSchema } from '@/lib/validation-schemas'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cvId = searchParams.get('cvId')

    // Validate query parameters
    const validation = validateSchema(jdListQuerySchema, { cvId });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError },
        { status: 400 }
      );
    }

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

    // Get JD analyses for this CV
    // Optimized: Exclude analysis_result (heavy JSON)
    const { data: jdAnalyses, error: jdError } = await supabase
      .from('jd_analyses')
      .select('id, jd_text, keywords_extracted, created_at, mode, shadow_job_title, shadow_level')
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
      // analysis: analysis.analysis_result, // Excluded for performance
      createdAt: analysis.created_at,
      mode: analysis.mode,
      preview: analysis.jd_text ? (analysis.jd_text.substring(0, 200) + (analysis.jd_text.length > 200 ? '...' : '')) : (analysis.mode === 'shadow' ? 'Shadow JD' : '')
    }))

    return NextResponse.json({ jdAnalyses: formattedAnalyses }, { status: 200 })
  } catch (error) {
    console.error('JD List API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
