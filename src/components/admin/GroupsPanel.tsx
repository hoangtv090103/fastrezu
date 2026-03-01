'use client'

import { useState } from 'react'

type Group = {
  id: string
  name: string
  display_name: string
  description: string | null
  is_system: boolean
}

type PermRow = {
  can_read: boolean
  can_write: boolean
  can_create: boolean
  can_delete: boolean
}

type Props = {
  initialGroups: Group[]
  initialPermsByGroup: Record<string, Record<string, PermRow>>
  resources: string[]
}

const ACTIONS: Array<keyof PermRow> = ['can_read', 'can_write', 'can_create', 'can_delete']
const ACTION_LABELS: Record<string, string> = {
  can_read: 'R', can_write: 'W', can_create: 'C', can_delete: 'D',
}

export default function GroupsPanel({ initialGroups, initialPermsByGroup, resources }: Props) {
  const [groups] = useState(initialGroups)
  const [permsByGroup, setPermsByGroup] = useState(initialPermsByGroup)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const getPerms = (groupId: string, resource: string): PermRow => (
    permsByGroup[groupId]?.[resource] ?? {
      can_read: false, can_write: false, can_create: false, can_delete: false,
    }
  )

  const togglePerm = (groupId: string, resource: string, action: keyof PermRow) => {
    setPermsByGroup((prev) => {
      const groupPerms = { ...(prev[groupId] ?? {}) }
      const current = groupPerms[resource] ?? { can_read: false, can_write: false, can_create: false, can_delete: false }
      groupPerms[resource] = { ...current, [action]: !current[action] }
      return { ...prev, [groupId]: groupPerms }
    })
  }

  const savePerms = async (groupId: string) => {
    setSaving(groupId)
    const rows = resources.map((resource) => ({
      resource,
      ...getPerms(groupId, resource),
    }))
    await fetch(`/api/admin/groups/${groupId}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    setSaving(null)
  }

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Xóa group này?')) return
    const res = await fetch(`/api/admin/groups/${groupId}`, { method: 'DELETE' })
    if (res.ok) {
      window.location.reload()
    } else {
      const data = await res.json() as { error?: string }
      alert(data.error ?? 'Không thể xóa group')
    }
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.id} className="bg-white rounded-lg shadow-sm border">
          {/* Group header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setExpanded(expanded === group.id ? null : group.id)}
                className="text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                {group.display_name}
              </button>
              <span className="text-xs text-gray-400 font-mono">{group.name}</span>
              {group.is_system && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">System</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setExpanded(expanded === group.id ? null : group.id)}
                className="text-xs text-blue-600 hover:underline"
              >
                {expanded === group.id ? 'Thu gọn' : 'Phân quyền'}
              </button>
              {!group.is_system && (
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Permission matrix */}
          {expanded === group.id && (
            <div className="border-t px-4 py-4">
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-gray-500 font-medium py-2 w-32">Resource</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="text-center text-xs text-gray-500 font-medium py-2 w-12">
                        {ACTION_LABELS[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resources.map((resource) => {
                    const perms = getPerms(group.id, resource)
                    return (
                      <tr key={resource}>
                        <td className="py-2 text-xs text-gray-700 font-mono">{resource}</td>
                        {ACTIONS.map((action) => (
                          <td key={action} className="py-2 text-center">
                            <input
                              type="checkbox"
                              checked={perms[action]}
                              onChange={() => togglePerm(group.id, resource, action)}
                              className="rounded"
                            />
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <button
                onClick={() => savePerms(group.id)}
                disabled={saving === group.id}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving === group.id ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
