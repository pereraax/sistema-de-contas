'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import { 
  Home, 
  FileText, 
  CreditCard, 
  Calendar, 
  BarChart3,
  Settings,
  Loader2,
  PiggyBank,
  PlayCircle,
  Crown,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Logo from './Logo'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

const menuItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/registros', label: 'Todos os Registros', icon: FileText },
  { href: '/dividas', label: 'Dívidas', icon: CreditCard },
  { href: '/lembretes', label: 'Lembretes', icon: Clock },
  { href: '/minhas-metas', label: 'Minhas Metas', icon: PiggyBank },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/categorias', label: 'Categorias', icon: Tag },
  { href: '/tutoriais', label: 'Tutoriais', icon: PlayCircle },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingHref, setLoadingHref] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(SIDEBAR_COLLAPSED_KEY) : null
    setCollapsed(stored === 'true')
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  // Prefetch agressivo
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.href !== pathname) {
        setTimeout(() => router.prefetch(item.href), 100)
      }
    })
  }, [router, pathname])

  const handleNavigation = (href: string) => {
    if (pathname === href) return
    setLoadingHref(href)
    startTransition(() => router.push(href))
    setTimeout(() => setLoadingHref(null), 100)
  }

  const handleMouseEnter = (href: string) => {
    if (href !== pathname) router.prefetch(href)
  }

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-brand-royal border-r border-gray-200 dark:border-brand-midnight/50 shadow-lg z-50 hidden lg:flex flex-col overflow-y-auto transition-all duration-300 ${
          collapsed ? 'w-20 sidebar-collapsed' : 'w-64'
        }`}
      >
        <div className={`flex flex-col flex-1 ${collapsed ? 'px-3 py-4' : 'p-6'}`}>
          <div className={`mb-6 flex items-center justify-center ${collapsed ? 'mb-4' : ''}`}>
            <Logo />
          </div>

          <nav className="space-y-1.5 flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/home' && pathname?.startsWith(item.href))
              const isLoading = loadingHref === item.href && isPending

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  onMouseEnter={() => handleMouseEnter(item.href)}
                  disabled={isLoading || isActive}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-left disabled:opacity-100 ${
                    collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-brand-aqua text-white shadow-md'
                      : collapsed
                        ? 'text-brand-aqua dark:text-white hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                        : 'text-brand-aqua dark:text-brand-aqua/90 hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/20'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={20} strokeWidth={2} className={`animate-spin flex-shrink-0 ${isActive ? 'text-white' : collapsed ? 'text-brand-aqua dark:text-white' : 'text-brand-aqua'}`} />
                  ) : (
                    <Icon size={20} strokeWidth={2} className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                  )}
                  {!collapsed && (
                    <span className={`font-medium truncate ${isActive ? 'text-white' : 'text-gray-700 dark:text-brand-clean'}`}>
                      {item.label}
                    </span>
                  )}
                </button>
              )
            })}

            <div className={`pt-6 border-t border-gray-200 dark:border-brand-midnight/30 ${collapsed ? 'px-0' : ''}`}>
              <button
                onClick={() => router.push('/upgrade')}
                onMouseEnter={() => router.prefetch('/upgrade')}
                title={collapsed ? 'Fazer Upgrade' : undefined}
                className={`w-full flex items-center rounded-xl transition-all duration-200 bg-gradient-to-r from-brand-aqua to-primary-500 hover:from-brand-aqua/90 hover:to-primary-400 shadow-md hover:shadow-lg text-left group ${
                  collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                }`}
              >
                <Crown size={20} strokeWidth={2} className="text-white flex-shrink-0 group-hover:scale-110 transition-transform" />
                {!collapsed && <span className="font-semibold text-white truncate">Fazer Upgrade</span>}
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Botão recolher/expandir: na borda direita da sidebar, meio vertical, por cima do main */}
      <div
        className={`fixed top-1/2 -translate-y-1/2 -translate-x-1/2 z-[60] hidden lg:flex items-center justify-center transition-[left] duration-300 ${
          collapsed ? 'left-[5rem]' : 'left-[16rem]'
        }`}
      >
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="w-11 h-11 rounded-full bg-white dark:bg-brand-royal border-2 border-gray-200 dark:border-brand-aqua/30 shadow-lg hover:shadow-xl hover:border-brand-aqua/50 dark:hover:border-brand-aqua/50 flex items-center justify-center text-brand-aqua hover:bg-brand-aqua/10 dark:hover:bg-brand-aqua/15 transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight size={20} strokeWidth={2.5} className="text-brand-aqua" />
          ) : (
            <ChevronLeft size={20} strokeWidth={2.5} className="text-brand-aqua" />
          )}
        </button>
      </div>
    </>
  )
}
