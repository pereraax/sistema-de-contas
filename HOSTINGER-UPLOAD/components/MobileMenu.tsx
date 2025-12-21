'use client'

import { useState, createContext, useContext, ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  FileText, 
  CreditCard, 
  Calendar, 
  BarChart3,
  Settings,
  Menu,
  X,
  PiggyBank,
  PlayCircle,
  Crown,
  Clock,
  Tag
} from 'lucide-react'
import Logo from './Logo'
import { createClient } from '@/lib/supabase/client'

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

// Context para compartilhar estado do menu
const MenuContext = createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export function useMenuContext() {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenuContext deve ser usado dentro de MenuProvider')
  }
  return context
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <MenuContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MenuContext.Provider>
  )
}

export function MenuButton({ className = '' }: { className?: string }) {
  const { isOpen, setIsOpen } = useMenuContext()
  
  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`p-2 bg-brand-white dark:bg-brand-royal rounded-xl shadow-lg lg:hidden transition-smooth border border-gray-200 dark:border-white/10 ${className}`}
      aria-label="Abrir menu"
    >
      {isOpen ? <X size={20} className="text-brand-midnight dark:text-brand-clean" /> : <Menu size={20} className="text-brand-midnight dark:text-brand-clean" />}
    </button>
  )
}

export default function MobileMenu() {
  const { isOpen, setIsOpen } = useMenuContext()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  
  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
      } catch (error) {
        setIsAuthenticated(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()

    // Monitorar mudanças de autenticação
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Rotas públicas onde o menu não deve aparecer
  const publicRoutes = ['/', '/login', '/cadastro', '/planos', '/termos', '/privacidade', '/suporte']
  const isPublicRoute = pathname && publicRoutes.includes(pathname)
  
  // Não renderizar se estiver verificando, não autenticado em rota pública, ou em rota admin
  if (isChecking || (!isAuthenticated && isPublicRoute) || pathname?.startsWith('/administracaosecr')) {
    return null
  }

  // Se não estiver autenticado e não for rota pública, não mostrar menu
  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      {/* Botão fixo removido - agora todas as páginas usam MenuButton ao lado do título */}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 dark:bg-brand-midnight/50 z-40 lg:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-brand-royal border-r border-gray-200 dark:border-brand-midnight shadow-lg z-40 lg:hidden animate-slide-in-from-left">
            <div className="p-6 pt-20">
              <div className="mb-8">
                <Logo />
              </div>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || 
                    (item.href !== '/home' && pathname?.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth ${
                        isActive
                          ? 'bg-brand-aqua text-brand-midnight shadow-lg'
                          : 'text-gray-700 dark:text-brand-clean hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
                      }`}
                    >
                      <Icon 
                        size={20} 
                        strokeWidth={2} 
                        className={isActive ? 'text-brand-midnight' : item.color}
                      />
                      <span className={`font-medium ${isActive ? 'text-brand-midnight' : 'text-gray-700 dark:text-brand-clean'}`}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
                
                {/* Botão Fazer Upgrade - abaixo de Configurações */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-brand-midnight/30">
                  <Link
                    href="/upgrade"
                    onClick={() => setIsOpen(false)}
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
                  </Link>
                </div>
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
