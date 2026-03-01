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
    await requirePermission(service, user.id, 'users', 'read')

    const { data: profile } = await service
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    const { data: groups } = await service
      .from('user_groups')
      .select('group_id, granted_at, granted_by')
      .eq('user_id', id)

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: usage } = await service
      .from('ai_usage_logs')
      .select('feature, created_at')
      .eq('user_id', id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    return NextResponse.json({ profile, groups: groups ?? [], usage: usage ?? [] })
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
    await requirePermission(service, user.id, 'users', 'write')

    const body = await request.json() as {
      subscription_tier?: string
      active?: boolean
      add_group?: string
      remove_group?: string
    }
    const { subscription_tier, active, add_group, remove_group } = body

    // Update profile
    if (subscription_tier !== undefined || active !== undefined) {
      const update: Record<string, unknown> = {}
      if (subscription_tier !== undefined) update.subscription_tier = subscription_tier
      if (active !== undefined) {
        update.active = active
        update.deleted_at = active ? null : new Date().toISOString()
        update.deleted_by = active ? null : user.id
      }
      const { error } = await service.from('user_profiles').update(update).eq('id', id)
      if (error) throw error
    }

    // Add group
    if (add_group) {
      const { error: addGroupError } = await service
        .from('user_groups')
        .upsert({ user_id: id, group_id: add_group, granted_by: user.id })
      if (addGroupError) throw addGroupError
    }

    // Remove group
    if (remove_group) {
      const { error: removeGroupError } = await service
        .from('user_groups')
        .delete()
        .eq('user_id', id)
        .eq('group_id', remove_group)
      if (removeGroupError) throw removeGroupError
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
