import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateCVSchema, validateSchema } from '@/lib/validation-schemas'

export async function PUT(
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
    const body = await request.json()

    // Validate request body with Zod
    const validation = validateSchema(updateCVSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.firstError, details: validation.errors },
        { status: 400 }
      )
    }

    // Verify CV ownership
    const { data: cv, error: cvError } = await supabase
      .from('cvs')
      .select('user_id')
      .eq('id', cvId)
      .single()

    if (cvError || !cv || cv.user_id !== user.id) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }

    // Update CV
    const updateData: { title?: string; ats_score?: number; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }
    
    if (validation.data.title !== undefined) {
      updateData.title = validation.data.title
    }
    
    if (validation.data.ats_score !== undefined) {
      updateData.ats_score = validation.data.ats_score
    }
    
    const { data: updatedCv, error } = await supabase
      .from('cvs')
      .update(updateData)
      .eq('id', cvId)
      .select()
      .single()

    if (error) {
      console.error('Error updating CV:', error)
      return NextResponse.json({ error: 'Failed to update CV' }, { status: 500 })
    }

    return NextResponse.json({ cv: updatedCv }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
