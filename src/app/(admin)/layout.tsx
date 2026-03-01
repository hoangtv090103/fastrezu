import { createClient, createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { hasAnyAdminGroup } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check account active status
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('active')
    .eq('id', user.id)
    .single()

  // Treat missing profile the same as suspended — fail safe
  if (!profile || !profile.active) redirect('/account-suspended')

  // Check admin group membership via service client (bypasses RLS)
  const serviceClient = createServiceClient()
  const isAdmin = await hasAnyAdminGroup(serviceClient, user.id)
  if (!isAdmin) redirect('/403')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
