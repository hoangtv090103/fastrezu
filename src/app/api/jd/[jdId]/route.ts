import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { validateSchema } from '@/lib/validation-schemas'

const jdDetailSchema = z.string().uuid()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jdId: string }> }
) {
  try {
    const { jdId } = await params
    
    // Validate ID
    const validation = validateSchema(jdDetailSchema, jdId)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid JD ID" },
        { status: 400 }
      )
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

    // Fetch JD analysis with full details
    // We also need to verify ownership via the CV relation, but for simplicity/speed 
    // we can just check if the JD belongs to a CV that belongs to the user.
    // Or simpler: fetch JD and check CV's user_id.
    
    const { data: jdAnalysis, error } = await supabase
      .from('jd_analyses')
      .select(`
        *,
        cv:cvs!inner(user_id)
      `)
      .eq('id', jdId)
      .single()

    if (error) {
      console.error('Error fetching JD:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
    if (!jdAnalysis) {
      return NextResponse.json({ error: 'JD not found' }, { status: 404 })
    }

    // Verify ownership
    const cvData = jdAnalysis.cv as { user_id: string } | undefined;
    if (!cvData || cvData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return formatted response
    return NextResponse.json({
      jdAnalysis: {
        id: jdAnalysis.id,
        jdText: jdAnalysis.jd_text,
        keywords: jdAnalysis.keywords_extracted,
        analysis: jdAnalysis.analysis_result,
        createdAt: jdAnalysis.created_at,
        mode: jdAnalysis.mode,
        shadowJobTitle: jdAnalysis.shadow_job_title,
        shadowLevel: jdAnalysis.shadow_level
      }
    })

  } catch (error) {
    console.error('JD Detail API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
