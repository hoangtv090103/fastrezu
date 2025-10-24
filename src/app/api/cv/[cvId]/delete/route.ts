import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
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

    const { cvId } = await params

    // Verify CV ownership
    const { data: cv, error: cvError } = await supabase
      .from('cvs')
      .select('user_id')
      .eq('id', cvId)
      .single()

    if (cvError || !cv || cv.user_id !== user.id) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    // Delete CV (cascade will delete related sections and analyses)
    const { error } = await supabase
      .from('cvs')
      .delete()
      .eq('id', cvId)

    if (error) {
      console.error('Error deleting CV:', error)
      return NextResponse.json({ error: 'Failed to delete CV' }, { status: 500 })
    }

    return NextResponse.json({ message: 'CV deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
