'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

export default function AdminSidebar() {
  const { t } = useTranslation()

  const NAV_ITEMS = [
    { href: '/admin',             label: t('admin.nav.dashboard') },
    { href: '/admin/users',       label: t('admin.nav.users') },
    { href: '/admin/groups',      label: t('admin.nav.groups') },
    { href: '/admin/ai-usage',    label: t('admin.nav.aiUsage') },
    { href: '/admin/rate-limits', label: t('admin.nav.rateLimits') },
  ]

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {t('admin.panelTitle')}
        </span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-700">
        <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300">
          {t('admin.backToMain')}
        </Link>
      </div>
    </aside>
  )
}
