'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

type User = {
  id: string
  email: string | null
  full_name: string | null
  subscription_tier: string | null
  active: boolean
  created_at: string | null
}

type Group = {
  id: string
  name: string
  display_name: string
}

type Props = {
  initialUsers: User[]
  groups: Group[]
}

const TIERS = ['free', 'sprint_pass', 'pro_pass', 'beta_free']

export default function UsersTable({ initialUsers, groups }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)

  // groups is available for future use (e.g. group assignment UI)
  void groups

  const fetchUsers = useCallback(async (s: string, t: string, st: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (s) params.set('search', s)
    if (t) params.set('tier', t)
    if (st) params.set('status', st)
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
    }
    setLoading(false)
  }, [])

  const handleSearch = (value: string) => {
    setSearch(value)
    fetchUsers(value, tierFilter, statusFilter)
  }

  const handleTierFilter = (value: string) => {
    setTierFilter(value)
    fetchUsers(search, value, statusFilter)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    fetchUsers(search, tierFilter, value)
  }

  const patchUser = async (userId: string, patch: Record<string, unknown>) => {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    await fetchUsers(search, tierFilter, statusFilter)
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Tim email hoac ten..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm flex-1 max-w-xs"
        />
        <select
          value={tierFilter}
          onChange={(e) => handleTierFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tat ca goi</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tat ca trang thai</option>
          <option value="active">Hoat dong</option>
          <option value="suspended">Bi khoa</option>
        </select>
      </div>

      {/* Table */}
      {loading && <p className="text-sm text-gray-500 mb-2">Dang tai...</p>}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ten</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Goi</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Trang thai</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Hanh dong</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={`${u.id}-${u.subscription_tier}`} className={u.active ? '' : 'bg-red-50'}>
                <td className="px-4 py-3 text-gray-900">{u.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{u.full_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.subscription_tier ?? 'free'}
                    onChange={(e) => patchUser(u.id, { subscription_tier: e.target.value })}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {u.active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => patchUser(u.id, { active: !u.active })}
                    className={`text-xs px-2 py-1 rounded border ${
                      u.active
                        ? 'border-red-300 text-red-600 hover:bg-red-50'
                        : 'border-green-300 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {u.active ? 'Khoa' : 'Mo khoa'}
                  </button>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Chi tiet
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Khong co du lieu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
