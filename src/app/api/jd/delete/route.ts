import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest) {
  try {
    const { jdId } = await request.json()

    if (!jdId) {
      return NextResponse.json({ error: 'JD ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JD analysis belongs to user's CV
    const { data: jdAnalysis, error: jdError } = await supabase
      .from('jd_analyses')
      .select(`
        id,
        cv_id,
        cvs!inner(user_id)
      `)
      .eq('id', jdId)
      .eq('cvs.user_id', user.id)
      .single()

    if (jdError || !jdAnalysis) {
      return NextResponse.json({ error: 'JD analysis not found or access denied' }, { status: 404 })
    }

    // Delete JD analysis
    const { error: deleteError } = await supabase
      .from('jd_analyses')
      .delete()
      .eq('id', jdId)

    if (deleteError) {
      console.error('Error deleting JD analysis:', deleteError)
      return NextResponse.json({ error: 'Failed to delete JD analysis' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('JD Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
