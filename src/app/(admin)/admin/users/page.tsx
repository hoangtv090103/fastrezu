import { createServiceClient } from '@/lib/supabase-server'
import UsersTable from '@/components/admin/UsersTable'

export default async function AdminUsersPage() {
  const service = createServiceClient()

  const { data: users } = await service
    .from('user_profiles')
    .select('id, email, full_name, subscription_tier, active, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: groups } = await service
    .from('groups')
    .select('id, name, display_name')
    .order('display_name')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Người dùng</h1>
      <UsersTable initialUsers={users ?? []} groups={groups ?? []} />
    </div>
  )
}
