'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  FileText, 
  Calendar, 
  Menu,
  Sparkles
} from 'lucide-react'
import { useMenuContext } from './MobileMenu'

// Função para abrir o PLEN Assistant
const openPlenAssistant = () => {
  // Disparar evento customizado para abrir o PLEN
  window.dispatchEvent(new CustomEvent('open-plen-assistant'))
}


export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen: isMobileMenuOpen, setIsOpen: setMobileMenuOpen } = useMenuContext()

  // Verificar se está em uma página autenticada (barra inferior visível em mobile; em desktop fica oculta por lg:hidden)
  const isAuthenticatedPage = pathname?.startsWith('/home') || 
                               pathname?.startsWith('/registros') ||
                               pathname?.startsWith('/calendario') ||
                               pathname?.startsWith('/dividas') ||
                               pathname?.startsWith('/lembretes') ||
                               pathname?.startsWith('/minhas-metas') ||
                               pathname?.startsWith('/dashboard') ||
                               pathname?.startsWith('/categorias') ||
                               pathname?.startsWith('/ganhe-indicando') ||
                               pathname?.startsWith('/tutoriais') ||
                               pathname?.startsWith('/configuracoes') ||
                               pathname?.startsWith('/gastos-por-banco') ||
                               pathname?.startsWith('/upgrade') ||
                               pathname?.startsWith('/checkout') ||
                               pathname?.startsWith('/pagamento')

  if (!isAuthenticatedPage) {
    return null
  }

  const handleNavClick = (href: string) => {
    router.push(href)
  }

  const handleMoreClick = () => {
    setMobileMenuOpen(!isMobileMenuOpen)
  }

  const isActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home'
    }
    return pathname?.startsWith(href)
  }

  const showBarOnDesktop = pathname?.startsWith('/gastos-por-banco')

  return (
    <>
      {/* Bottom Navigation Bar - Mobile sempre; no desktop só na página Gastos por banco */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-brand-royal border-t border-gray-200 dark:border-brand-midnight z-50 shadow-lg pb-[env(safe-area-inset-bottom)] ${showBarOnDesktop ? '' : 'lg:hidden'}`}>
        <div className="grid grid-cols-5 items-end justify-items-center w-full max-w-[100vw] px-0 py-2 gap-0">
          {/* Principal */}
          <button
            onClick={() => handleNavClick('/home')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
              isActive('/home')
                ? 'bg-brand-aqua dark:bg-[#252525]'
                : 'hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
            }`}
          >
            <Home 
              size={24} 
              className={isActive('/home') ? 'text-white' : 'text-gray-600 dark:text-gray-400'} 
              strokeWidth={isActive('/home') ? 2.5 : 2}
            />
            <span className={`text-xs font-medium ${
              isActive('/home') 
                ? 'text-white' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              Principal
            </span>
          </button>

          {/* Transações */}
          <button
            onClick={() => handleNavClick('/registros')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
              isActive('/registros')
                ? 'bg-brand-aqua dark:bg-[#252525]'
                : 'hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
            }`}
          >
            <FileText 
              size={24} 
              className={isActive('/registros') ? 'text-white' : 'text-gray-600 dark:text-gray-400'} 
              strokeWidth={isActive('/registros') ? 2.5 : 2}
            />
            <span className={`text-xs font-medium ${
              isActive('/registros') 
                ? 'text-white' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              Transações
            </span>
          </button>

          {/* Botão PLEN (Central) - coluna 3 = centro exato; sobe um pouco acima da barra */}
          <button
            onClick={openPlenAssistant}
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#2c5aa0] to-[#163a5f] rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95 overflow-hidden animate-plen-glow justify-self-center -translate-y-2"
            aria-label="Abrir PLEN Assistant"
            data-plen-bottom-button
          >
            {/* Efeito de brilho sobreposto - shimmer */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'plenShine 3s ease-in-out infinite',
              }}
            ></div>
            
            {/* Ícone com rotação suave */}
            <div className="relative z-10">
              <Sparkles 
                size={24} 
                strokeWidth={2.5} 
                className="text-white"
                style={{ 
                  animation: 'plenRotate 8s linear infinite',
                  filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
                }}
              />
            </div>
            {/* Indicador de notificação (se houver) */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-brand-royal z-20"></span>
          </button>

          {/* Calendário */}
          <button
            onClick={() => handleNavClick('/calendario')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
              isActive('/calendario')
                ? 'bg-brand-aqua/10 dark:bg-[#4a90d9]/25'
                : 'hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
            }`}
          >
            <Calendar 
              size={24} 
              className={isActive('/calendario') ? 'text-brand-aqua dark:text-[#7ec8f7]' : 'text-gray-600 dark:text-gray-400'} 
              strokeWidth={isActive('/calendario') ? 2.5 : 2}
            />
            <span className={`text-xs font-medium ${
              isActive('/calendario') 
                ? 'text-brand-aqua dark:text-[#7ec8f7]' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              Calendário
            </span>
          </button>

          {/* Mais */}
          {(() => {
            const isMoreActive = pathname?.startsWith('/dividas') || 
              pathname?.startsWith('/lembretes') || 
              pathname?.startsWith('/minhas-metas') || 
              pathname?.startsWith('/dashboard') || 
              pathname?.startsWith('/categorias') || 
              pathname?.startsWith('/tutoriais') || 
              pathname?.startsWith('/configuracoes') ||
              pathname?.startsWith('/gastos-por-banco') ||
              pathname?.startsWith('/upgrade') ||
              pathname?.startsWith('/checkout') ||
              pathname?.startsWith('/pagamento')
            return (
              <button
                onClick={handleMoreClick}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isMoreActive
                    ? 'bg-brand-aqua dark:bg-[#252525]'
                    : 'hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
                }`}
              >
                <Menu 
                  size={24} 
                  className={isMoreActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'} 
                  strokeWidth={isMoreActive ? 2.5 : 2}
                />
                <span className={`text-xs font-medium ${isMoreActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  Mais
                </span>
              </button>
            )
          })()}
        </div>
      </nav>

      {/* Espaçamento no final da página para não ficar coberto pelo bottom nav (em desktop só quando a barra está visível) */}
      <div className={`h-20 ${pathname?.startsWith('/gastos-por-banco') ? '' : 'lg:hidden'}`} />
    </>
  )
}

