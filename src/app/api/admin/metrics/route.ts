import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'metrics', 'read')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const day30ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // User counts by tier
    const TIERS = ['free', 'sprint_pass', 'pro_pass', 'beta_free']
    const byTier: Record<string, number> = {}

    await Promise.all(
      TIERS.map(async (t) => {
        let query = service
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('active', true)

        if (t === 'free') {
          query = query.or('subscription_tier.eq.free,subscription_tier.is.null')
        } else {
          query = query.eq('subscription_tier', t)
        }

        const { count } = await query
        byTier[t] = count ?? 0
      })
    )

    const { count: suspendedCount } = await service
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('active', false)

    // AI calls today
    const { count: callsToday } = await service
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Top features last 30 days (limit payload size to prevent RAM issues)
    const { data: featureLogs } = await service
      .from('ai_usage_logs')
      .select('feature')
      .gte('created_at', day30ago)
      .limit(5000)

    const featureCounts: Record<string, number> = {}
    featureLogs?.forEach((row) => {
      featureCounts[row.feature] = (featureCounts[row.feature] ?? 0) + 1
    })
    const topFeatures = Object.entries(featureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([feature, count]) => ({ feature, count }))

    return NextResponse.json({
      byTier,
      suspendedCount: suspendedCount ?? 0,
      callsToday: callsToday ?? 0,
      topFeatures,
    })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
