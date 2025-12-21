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
  Tag
} from 'lucide-react'
import Logo from './Logo'

const menuItems = [
  { href: '/home', label: 'Home', icon: Home, color: 'text-blue-600 dark:text-blue-400' },
  { href: '/registros', label: 'Todos os Registros', icon: FileText, color: 'text-green-600 dark:text-green-400' },
  { href: '/dividas', label: 'Dívidas', icon: CreditCard, color: 'text-red-600 dark:text-red-400' },
  { href: '/lembretes', label: 'Lembretes', icon: Clock, color: 'text-orange-600 dark:text-orange-400' },
  { href: '/minhas-metas', label: 'Minhas Metas', icon: PiggyBank, color: 'text-yellow-600 dark:text-yellow-400' },
  { href: '/calendario', label: 'Calendário', icon: Calendar, color: 'text-purple-600 dark:text-purple-400' },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-cyan-600 dark:text-cyan-400' },
  { href: '/categorias', label: 'Categorias', icon: Tag, color: 'text-teal-600 dark:text-teal-400' },
  { href: '/tutoriais', label: 'Tutoriais', icon: PlayCircle, color: 'text-pink-600 dark:text-pink-400' },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, color: 'text-gray-600 dark:text-gray-400' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingHref, setLoadingHref] = useState<string | null>(null)

  // Prefetch agressivo: prefetch todas as rotas ao montar o componente
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.href !== pathname) {
        // Prefetch com delay pequeno para não sobrecarregar
        setTimeout(() => {
          router.prefetch(item.href)
        }, 100)
      }
    })
  }, [router, pathname])

  const handleNavigation = (href: string) => {
    if (pathname === href) return // Já está na página
    
    setLoadingHref(href)
    // Navegar imediatamente (prefetch já foi feito)
    startTransition(() => {
      router.push(href)
    })
    
    // Limpar loading após navegação
    setTimeout(() => {
      setLoadingHref(null)
    }, 100)
  }
  
  // Prefetch adicional ao passar o mouse (backup caso o useEffect não tenha executado)
  const handleMouseEnter = (href: string) => {
    if (href !== pathname) {
      router.prefetch(href)
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-brand-royal border-r border-gray-200 dark:border-brand-midnight shadow-lg z-50 hidden lg:block overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <Logo />
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/home' && pathname?.startsWith(item.href))
            const isLoading = loadingHref === item.href && isPending
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                onMouseEnter={() => handleMouseEnter(item.href)}
                disabled={isLoading || isActive}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth text-left disabled:opacity-100 ${
                  isActive
                    ? 'bg-brand-aqua text-brand-midnight shadow-lg'
                    : 'text-gray-700 dark:text-brand-clean hover:bg-gray-100 dark:hover:bg-brand-midnight/50 disabled:hover:bg-transparent'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={20} strokeWidth={2} className={`animate-spin ${isActive ? 'text-brand-midnight' : 'text-gray-700 dark:text-brand-clean'}`} />
                ) : (
                  <Icon 
                    size={20} 
                    strokeWidth={2} 
                    className={isActive ? 'text-brand-midnight' : item.color}
                  />
                )}
                <span className={`font-medium ${isActive ? 'text-brand-midnight' : 'text-gray-700 dark:text-brand-clean'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
          
          {/* Botão Fazer Upgrade - abaixo de Configurações */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-brand-midnight/30">
            <button
              onClick={() => router.push('/upgrade')}
              onMouseEnter={() => router.prefetch('/upgrade')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth bg-gradient-to-r from-brand-aqua to-blue-500 hover:from-brand-aqua/90 hover:to-blue-400 shadow-lg hover:shadow-xl text-left group"
            >
              <Crown 
                size={20} 
                strokeWidth={2} 
                className="text-white group-hover:scale-110 transition-transform"
              />
              <span className="font-semibold text-white">
                Fazer Upgrade
              </span>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  )
}

