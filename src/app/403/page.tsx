'use client'

import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

export default function ForbiddenPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">{t('admin.forbidden.title')}</h1>
        <p className="mt-4 text-xl text-gray-600">{t('admin.forbidden.message')}</p>
        <Link href="/dashboard" className="mt-6 inline-block text-blue-600 hover:underline">
          {t('admin.forbidden.backToDashboard')}
        </Link>
      </div>
    </div>
  )
}
