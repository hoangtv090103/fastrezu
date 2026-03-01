import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'groups', 'read')

    const { data } = await service
      .from('group_permissions')
      .select('resource, can_read, can_write, can_create, can_delete')
      .eq('group_id', id)

    return NextResponse.json({ permissions: data ?? [] })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'groups', 'write')

    const body = await request.json() as {
      rows: Array<{
        resource: string
        can_read: boolean
        can_write: boolean
        can_create: boolean
        can_delete: boolean
      }>
    }

    for (const row of body.rows) {
      const { error } = await service
        .from('group_permissions')
        .upsert({
          group_id: id,
          resource: row.resource,
          can_read: row.can_read,
          can_write: row.can_write,
          can_create: row.can_create,
          can_delete: row.can_delete,
        })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
