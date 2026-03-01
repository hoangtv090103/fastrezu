import { createServiceClient } from '@/lib/supabase-server'

const TIERS = ['free', 'sprint_pass', 'pro_pass', 'beta_free'] as const

export default async function AdminDashboardPage() {
  const service = createServiceClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day30ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // User counts by tier
  const { data: profiles } = await service
    .from('user_profiles')
    .select('subscription_tier, active')

  const byTier: Record<string, number> = {}
  let suspendedCount = 0
  profiles?.forEach((p) => {
    // Suspended users get their own bucket; excluded from tier counts
    if (!p.active) { suspendedCount++; return }
    const t = p.subscription_tier ?? 'free'
    byTier[t] = (byTier[t] ?? 0) + 1
  })

  // AI calls today
  const { count: callsToday } = await service
    .from('ai_usage_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Top features (last 30 days)
  const { data: featureLogs } = await service
    .from('ai_usage_logs')
    .select('feature')
    .gte('created_at', day30ago)

  const featureCounts: Record<string, number> = {}
  featureLogs?.forEach((row) => {
    featureCounts[row.feature] = (featureCounts[row.feature] ?? 0) + 1
  })
  const topFeatures = Object.entries(featureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Tier breakdown */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Người dùng theo gói
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TIERS.map((tier) => (
            <div key={tier} className="bg-white rounded-lg p-4 shadow-sm border">
              <p className="text-xs text-gray-500 uppercase">{tier.replace('_', ' ')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{byTier[tier] ?? 0}</p>
            </div>
          ))}
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
            <p className="text-xs text-red-500 uppercase">Suspended</p>
            <p className="text-3xl font-bold text-red-700 mt-1">{suspendedCount}</p>
          </div>
        </div>
      </section>

      {/* AI calls today */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          AI Calls
        </h2>
        <div className="bg-white rounded-lg p-4 shadow-sm border inline-block">
          <p className="text-4xl font-bold text-blue-600">{callsToday ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">hôm nay</p>
        </div>
      </section>

      {/* Top features */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Top features (30 ngày)
        </h2>
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {topFeatures.map(([feature, count]) => (
            <div key={feature} className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-700 font-mono">{feature}</span>
              <span className="text-sm font-semibold text-gray-900">{count} calls</span>
            </div>
          ))}
          {topFeatures.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">Chưa có dữ liệu</p>
          )}
        </div>
      </section>
    </div>
  )
}
