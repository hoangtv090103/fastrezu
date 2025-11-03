import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { track } from '@vercel/analytics/server'

export async function POST(request: NextRequest) {
  try {
    const { title = '', language = 'vi' } = await request.json()

    // Validate language parameter
    if (!['vi', 'en'].includes(language)) {
      return NextResponse.json({ error: 'Invalid language parameter. Must be "vi" or "en"' }, { status: 400 })
    }

    // Validate title parameter
    if (typeof title !== 'string' || title.length > 100) {
      return NextResponse.json({ error: 'Title must be a string and less than 100 characters' }, { status: 400 })
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
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingProfile) {
      // Create user profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          subscription_tier: 'beta_free'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
      }
    }

    // Generate default title if not provided
    const defaultTitle = language === 'vi' ? 'CV mới' : 'New CV'
    const finalTitle = title.trim() || defaultTitle

    // Create new CV with language
    const { data: cv, error } = await supabase
      .from('cvs')
      .insert({
        user_id: user.id,
        title: finalTitle,
        is_active: true,
        ats_score: 0,
        language: language,
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

    // Track CV creation event
    try {
      await track('CV_Created', {
        user_id: user.id,
        cv_id: cv.id,
        language: language,
      });
    } catch (trackError) {
      // Don't fail the request if tracking fails
      console.error('Failed to track CV creation:', trackError);
    }

    return NextResponse.json({ cvId: cv.id }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
