import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'groups', 'read')

    const { data: groups } = await service
      .from('groups')
      .select('id, name, display_name, description, category, is_system, created_at')
      .order('display_name')

    // Get member counts
    const { data: memberCounts } = await service
      .from('user_groups')
      .select('group_id')

    const counts: Record<string, number> = {}
    memberCounts?.forEach((r) => {
      counts[r.group_id] = (counts[r.group_id] ?? 0) + 1
    })

    const result = (groups ?? []).map((g) => ({ ...g, member_count: counts[g.id] ?? 0 }))
    return NextResponse.json({ groups: result })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'groups', 'create')

    const body = await request.json() as { name: string; display_name: string; description?: string }
    const { name, display_name, description } = body

    if (!name || !display_name) {
      return NextResponse.json({ error: 'name and display_name are required' }, { status: 400 })
    }

    const { data, error } = await service
      .from('groups')
      .insert({ name, display_name, description: description ?? null })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Group name already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ group: data }, { status: 201 })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
