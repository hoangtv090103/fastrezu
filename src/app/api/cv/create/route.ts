import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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

    return NextResponse.json({ cvId: cv.id }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
