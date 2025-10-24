import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
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
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create new CV
    const { data: cv, error } = await supabase
      .from('cvs')
      .insert({
        user_id: user.id,
        title: 'CV mới',
        is_active: true,
        ats_score: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating CV:', error)
      return NextResponse.json({ error: 'Failed to create CV' }, { status: 500 })
    }

    // Create default CV sections
    const defaultSections = [
      { section_type: 'personal_info', data: {}, order_index: 0 },
      { section_type: 'summary', data: {}, order_index: 1 },
      { section_type: 'experience', data: [], order_index: 2 },
      { section_type: 'education', data: [], order_index: 3 },
      { section_type: 'projects', data: [], order_index: 4 },
      { section_type: 'skills', data: [], order_index: 5 },
      { section_type: 'certifications', data: [], order_index: 6 },
    ]

    const sectionsToInsert = defaultSections.map(section => ({
      cv_id: cv.id,
      ...section
    }))

    const { error: sectionsError } = await supabase
      .from('cv_sections')
      .insert(sectionsToInsert)

    if (sectionsError) {
      console.error('Error creating CV sections:', sectionsError)
      // Don't fail the request, sections can be created later
    }

    return NextResponse.json({ cvId: cv.id }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
