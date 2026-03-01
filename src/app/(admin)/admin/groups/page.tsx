import { createServiceClient } from '@/lib/supabase-server'
import GroupsPanel from '@/components/admin/GroupsPanel'

const RESOURCES = ['users', 'ai_usage', 'rate_limits', 'metrics', 'groups'] as const

export default async function AdminGroupsPage() {
  const service = createServiceClient()

  const { data: groups } = await service
    .from('groups')
    .select('id, name, display_name, description, category, is_system')
    .order('display_name')

  // Fetch all permissions at once
  const { data: allPerms } = await service
    .from('group_permissions')
    .select('group_id, resource, can_read, can_write, can_create, can_delete')

  // Build permissions map: groupId → resource → permission row
  const permsByGroup: Record<string, Record<string, {
    can_read: boolean; can_write: boolean; can_create: boolean; can_delete: boolean
  }>> = {}

  allPerms?.forEach((p) => {
    if (!permsByGroup[p.group_id]) permsByGroup[p.group_id] = {}
    permsByGroup[p.group_id][p.resource] = {
      can_read: p.can_read,
      can_write: p.can_write,
      can_create: p.can_create,
      can_delete: p.can_delete,
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Phân quyền</h1>
      <GroupsPanel
        initialGroups={groups ?? []}
        initialPermsByGroup={permsByGroup}
        resources={[...RESOURCES]}
      />
    </div>
  )
}
