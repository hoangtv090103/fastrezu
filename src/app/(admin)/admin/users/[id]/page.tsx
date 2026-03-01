import { createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = createServiceClient()

  const { data: profile } = await service
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

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
    .limit(100)

  const usageCounts: Record<string, number> = {}
  usage?.forEach((u) => {
    usageCounts[u.feature] = (usageCounts[u.feature] ?? 0) + 1
  })

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        &larr; Danh sách người dùng
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {profile.full_name ?? profile.email ?? id}
      </h1>

      {/* Profile info */}
      <section className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Thông tin</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-gray-500">Email</dt>
            <dd className="text-sm text-gray-900">{profile.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Gói</dt>
            <dd className="text-sm text-gray-900">{profile.subscription_tier ?? 'free'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Trạng thái</dt>
            <dd className={`text-sm font-medium ${profile.active ? 'text-green-600' : 'text-red-600'}`}>
              {profile.active ? 'Active' : 'Suspended'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Tham gia</dt>
            <dd className="text-sm text-gray-900">
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Groups */}
      <section className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Admin Groups</h2>
        {groups && groups.length > 0 ? (
          <ul className="space-y-2">
            {groups.map((g) => (
              <li key={g.group_id} className="text-sm text-gray-700 font-mono">{g.group_id}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Không có group nào</p>
        )}
      </section>

      {/* AI usage last 30 days */}
      <section className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">AI Usage (30 ngày)</h2>
        {Object.keys(usageCounts).length > 0 ? (
          <div className="divide-y">
            {Object.entries(usageCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([feature, count]) => (
                <div key={feature} className="flex justify-between py-2">
                  <span className="text-sm text-gray-700 font-mono">{feature}</span>
                  <span className="text-sm font-semibold">{count} calls</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
        )}
      </section>
    </div>
  )
}
