import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'ai_usage', 'read')

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') ?? '7'), 30)
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: logs } = await service
      .from('ai_usage_logs')
      .select('user_id, feature, created_at')
      .gte('created_at', since.toISOString())

    const userIds = [...new Set(logs?.map((l) => l.user_id) ?? [])]

    const { data: profiles } = userIds.length > 0
      ? await service
          .from('user_profiles')
          .select('id, email, subscription_tier')
          .in('id', userIds)
      : { data: [] }

    const profileMap: Record<string, { email: string | null; subscription_tier: string | null }> = {}
    profiles?.forEach((p) => { profileMap[p.id] = { email: p.email, subscription_tier: p.subscription_tier } })

    // Aggregate: user_id × feature → count
    const agg: Record<string, Record<string, number>> = {}
    logs?.forEach((l) => {
      if (!agg[l.user_id]) agg[l.user_id] = {}
      agg[l.user_id][l.feature] = (agg[l.user_id][l.feature] ?? 0) + 1
    })

    const rows = Object.entries(agg).map(([userId, features]) => ({
      user_id: userId,
      email: profileMap[userId]?.email ?? null,
      subscription_tier: profileMap[userId]?.subscription_tier ?? 'free',
      features,
      total: Object.values(features).reduce((a, b) => a + b, 0),
    })).sort((a, b) => b.total - a.total)

    return NextResponse.json({ rows, days })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
