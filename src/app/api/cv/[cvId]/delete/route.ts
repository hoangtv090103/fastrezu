import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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
