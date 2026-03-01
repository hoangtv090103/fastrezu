import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'groups', 'write')

    const body = await request.json() as { display_name?: string; description?: string }
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.display_name !== undefined) update.display_name = body.display_name
    if (body.description !== undefined) update.description = body.description

    const { error } = await service.from('groups').update(update).eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'groups', 'delete')

    // Protect system groups
    const { data: group } = await service.from('groups').select('is_system').eq('id', id).single()
    if (group?.is_system) {
      return NextResponse.json({ error: 'Cannot delete system groups' }, { status: 403 })
    }

    const { error } = await service.from('groups').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
