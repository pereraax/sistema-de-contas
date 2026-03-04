'use client'

import dynamic from 'next/dynamic'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'

const NotificationBell = dynamic(() => import('@/components/NotificationBell'), { ssr: false })

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminLayoutWrapper>
      <NotificationBell />
      {children}
    </AdminLayoutWrapper>
  )
}

