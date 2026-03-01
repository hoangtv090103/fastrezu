import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export type AdminResource = 'users' | 'ai_usage' | 'rate_limits' | 'metrics' | 'groups'
export type AdminAction = 'read' | 'write' | 'create' | 'delete'
type AdminPermissionColumn = 'can_read' | 'can_write' | 'can_create' | 'can_delete'

/**
 * Resolves all group IDs a user belongs to, including implied (inherited) groups.
 * e.g. if user is in 'administrator' which implies 'support', both IDs are returned.
 */
async function resolveUserGroupIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  // Direct memberships
  const { data: memberships } = await supabase
    .from('user_groups')
    .select('group_id')
    .eq('user_id', userId)

  if (!memberships || memberships.length === 0) return []

  const directIds = memberships.map((m) => m.group_id)

  // Implied groups (iterative BFS, max 3 rounds handles depth=2 chain)
  const allIds = new Set(directIds)
  let frontier = [...directIds]

  for (let round = 0; round < 3; round++) {
    if (frontier.length === 0) break
    const { data: implied } = await supabase
      .from('group_implied')
      .select('to_group_id')
      .in('from_group_id', frontier)

    if (!implied || implied.length === 0) break
    const newIds = implied
      .map((i) => i.to_group_id)
      .filter((id) => !allIds.has(id))
    newIds.forEach((id) => allIds.add(id))
    frontier = newIds
  }

  return Array.from(allIds)
}

/**
 * Checks if the user has the required permission on the given resource.
 * Throws a Response with status 403 if not permitted.
 * Pass a service role supabase client to bypass RLS when reading permissions.
 */
export async function requirePermission(
  supabase: SupabaseClient<Database>,
  userId: string,
  resource: AdminResource,
  action: AdminAction,
): Promise<void> {
  const groupIds = await resolveUserGroupIds(supabase, userId)

  if (groupIds.length === 0) {
    throw new Response(
      JSON.stringify({ error: 'Access denied: no admin groups assigned' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // action is a closed union (AdminAction), so all possible column names are valid
  // columns on group_permissions. Cast to the precise union for column-level type safety.
  const actionColumn = `can_${action}` as AdminPermissionColumn

  const { data: permissions } = await supabase
    .from('group_permissions')
    .select(actionColumn)
    .eq('resource', resource)
    .in('group_id', groupIds)
    .eq(actionColumn, true)
    .limit(1)

  if (!permissions || permissions.length === 0) {
    throw new Response(
      JSON.stringify({ error: `Access denied: missing ${resource}:${action} permission` }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }
}

/**
 * Returns true if user has any admin group (for layout-level gateway checks).
 */
export async function hasAnyAdminGroup(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from('user_groups')
    .select('group_id', { count: 'exact', head: true })
    .eq('user_id', userId)
  return (count ?? 0) > 0
}
