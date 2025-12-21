'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminProtected from '@/components/admin/AdminProtected'

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Se for login ou rota raiz do admin, renderizar sem sidebar
  if (pathname === '/administracaosecr/login' || pathname === '/administracaosecr') {
    return <>{children}</>
  }

  // Para outras rotas, usar proteção e sidebar
  return (
    <AdminProtected>
      <div className="min-h-screen bg-brand-midnight">
        {/* Botão de menu mobile */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-brand-royal border border-white/10 rounded-lg text-brand-clean hover:bg-white/10 transition-smooth"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={sidebarOpen ? 'lg:block' : 'hidden lg:block'}>
          <AdminSidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </main>
      </div>
    </AdminProtected>
  )
}


