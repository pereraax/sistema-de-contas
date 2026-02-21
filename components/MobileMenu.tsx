'use client'

import { useState, createContext, useContext, ReactNode, useEffect, useRef } from 'react'
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
  Tag,
  Landmark,
  Gift
} from 'lucide-react'
import Logo from './Logo'
import { createClient } from '@/lib/supabase/client'

// Mesmos itens do Sidebar desktop para manter consistência
const menuItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/registros', label: 'Todos os Registros', icon: FileText },
  { href: '/gastos-por-banco', label: 'Gastos por banco', icon: Landmark },
  { href: '/dividas', label: 'Dívidas', icon: CreditCard },
  { href: '/lembretes', label: 'Lembretes', icon: Clock },
  { href: '/minhas-metas', label: 'Minhas Metas', icon: PiggyBank },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/categorias', label: 'Categorias', icon: Tag },
  { href: '/ganhe-indicando', label: 'Ganhe indicando', icon: Gift },
  { href: '/tutoriais', label: 'Tutoriais', icon: PlayCircle },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
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
  // MenuButton removido no mobile - agora usa apenas o bottom navigation
  return null
}

export default function MobileMenu() {
  const { isOpen, setIsOpen } = useMenuContext()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const sidebarRef = useRef<HTMLElement>(null)
  const touchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Fechar sidebar só com swipe horizontal para a esquerda (não fechar ao rolar para cima/baixo)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const deltaX = touchStart.current.x - endX
    const deltaY = touchStart.current.y - endY
    // Só fecha se o gesto for claramente horizontal (esquerda) e não rolagem vertical
    const isSwipeLeft = deltaX > 50 && Math.abs(deltaX) > Math.abs(deltaY)
    if (isSwipeLeft) setIsOpen(false)
  }

  // Travar scroll do body quando o menu está aberto (evita que o fundo role e “puxe” o sidebar no mobile)
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    const prevPosition = document.body.style.position
    const prevWidth = document.body.style.width
    const prevTop = document.body.style.top
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = '0'
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.width = prevWidth
      document.body.style.top = prevTop
    }
  }, [isOpen])

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
            className="fixed inset-0 bg-black/50 dark:bg-brand-midnight/50 z-[45] lg:hidden animate-fade-in touch-none"
            onClick={() => setIsOpen(false)}
            style={{ touchAction: 'none' }}
            aria-hidden
          />
          <aside
            ref={sidebarRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="fixed left-0 top-0 w-64 bg-white dark:bg-[#1A1A1A] border-r border-gray-200 dark:border-white/10 shadow-lg z-50 lg:hidden animate-slide-in-from-left flex flex-col"
            style={{
              height: '100dvh',
              height: '100vh',
              touchAction: 'pan-y',
            }}
          >
            {/* Área rolável: padding-bottom grande para deslizar até mostrar "Fazer Upgrade" acima da barra inferior */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-6 pb-[calc(11rem+env(safe-area-inset-bottom,0px))]"
              style={{
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                overscrollBehavior: 'contain',
              }}
            >
              {/* Logo menor, menos espaço em cima e embaixo (igual ao desktop) */}
              <div className="mb-5 flex items-center justify-center shrink-0 max-h-12 [&_a]:!block [&_img]:!h-10 [&_img]:!w-auto [&_img]:!object-contain">
                <Logo />
              </div>
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || 
                    (item.href !== '/home' && pathname?.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-brand-aqua text-white dark:bg-[#252525] dark:text-white shadow-md'
                          : 'text-brand-aqua dark:text-white hover:bg-brand-aqua/10 dark:hover:bg-white/10'
                      }`}
                    >
                      <Icon 
                        size={20} 
                        strokeWidth={2} 
                        className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}
                      />
                      <span className="font-medium truncate">
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
                
                {/* Botão Fazer Upgrade - mesmo estilo do desktop */}
                <div className="pt-6 border-t border-gray-200 dark:border-white/10">
                  <Link
                    href="/upgrade"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-left group bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400"
                  >
                    <Crown 
                      size={20} 
                      strokeWidth={2} 
                      className="text-amber-900 flex-shrink-0 group-hover:scale-110 transition-transform"
                    />
                    <span className="font-semibold text-amber-900 truncate">
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
