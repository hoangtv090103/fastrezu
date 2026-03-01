'use client'

import { useTranslation } from '@/hooks/useTranslation'

export default function AccountSuspendedPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-gray-800">{t('admin.accountSuspended.title')}</h1>
        <p className="mt-4 text-gray-600">{t('admin.accountSuspended.message')}</p>
        <a href="mailto:support@fastrezu.com" className="mt-6 inline-block text-blue-600 hover:underline">
          {t('admin.accountSuspended.contactSupport')}
        </a>
      </div>
    </div>
  )
}
