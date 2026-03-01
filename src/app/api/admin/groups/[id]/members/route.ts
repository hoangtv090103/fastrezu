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

    const { data: members } = await service
      .from('user_groups')
      .select('user_id, granted_at, granted_by')
      .eq('group_id', id)

    // Get emails from user_profiles
    const userIds = members?.map((m) => m.user_id) ?? []
    const { data: profiles } = userIds.length > 0
      ? await service.from('user_profiles').select('id, email, full_name').in('id', userIds)
      : { data: [] }

    const profileMap: Record<string, { email: string | null; full_name: string | null }> = {}
    profiles?.forEach((p) => { profileMap[p.id] = { email: p.email, full_name: p.full_name } })

    const result = (members ?? []).map((m) => ({
      ...m,
      email: profileMap[m.user_id]?.email ?? null,
      full_name: profileMap[m.user_id]?.full_name ?? null,
    }))

    return NextResponse.json({ members: result })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'groups', 'write')

    const { user_id } = await request.json() as { user_id: string }
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const { error } = await service
      .from('user_groups')
      .upsert({ user_id, group_id: id, granted_by: user.id })
    if (error) throw error

    return NextResponse.json({ success: true }, { status: 201 })
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
    await requirePermission(service, user.id, 'groups', 'write')

    const { user_id } = await request.json() as { user_id: string }
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const { error } = await service
      .from('user_groups')
      .delete()
      .eq('group_id', id)
      .eq('user_id', user_id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
