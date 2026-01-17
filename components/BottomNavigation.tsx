'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  FileText, 
  Calendar, 
  MoreVertical
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

  // Verificar se está em uma página autenticada
  const isAuthenticatedPage = pathname?.startsWith('/home') || 
                               pathname?.startsWith('/registros') ||
                               pathname?.startsWith('/calendario') ||
                               pathname?.startsWith('/dividas') ||
                               pathname?.startsWith('/lembretes') ||
                               pathname?.startsWith('/minhas-metas') ||
                               pathname?.startsWith('/dashboard') ||
                               pathname?.startsWith('/categorias') ||
                               pathname?.startsWith('/tutoriais') ||
                               pathname?.startsWith('/configuracoes')

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

  return (
    <>
      {/* Bottom Navigation Bar - Apenas Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-brand-royal border-t border-gray-200 dark:border-brand-midnight z-50 lg:hidden shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Principal */}
          <button
            onClick={() => handleNavClick('/home')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
              isActive('/home')
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
            }`}
          >
            <Home 
              size={24} 
              className={isActive('/home') ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'} 
              strokeWidth={isActive('/home') ? 2.5 : 2}
            />
            <span className={`text-xs font-medium ${
              isActive('/home') 
                ? 'text-orange-600 dark:text-orange-400' 
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
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
            }`}
          >
            <FileText 
              size={24} 
              className={isActive('/registros') ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'} 
              strokeWidth={isActive('/registros') ? 2.5 : 2}
            />
            <span className={`text-xs font-medium ${
              isActive('/registros') 
                ? 'text-orange-600 dark:text-orange-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              Transações
            </span>
          </button>

          {/* Botão PLEN (Central) */}
          <button
            onClick={openPlenAssistant}
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#00C2FF] to-[#0099CC] rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95 -mt-6 relative"
            aria-label="Abrir PLEN Assistant"
            data-plen-bottom-button
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {/* Indicador de notificação (se houver) */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-brand-royal"></span>
          </button>

          {/* Calendário */}
          <button
            onClick={() => handleNavClick('/calendario')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
              isActive('/calendario')
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
            }`}
          >
            <Calendar 
              size={24} 
              className={isActive('/calendario') ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'} 
              strokeWidth={isActive('/calendario') ? 2.5 : 2}
            />
            <span className={`text-xs font-medium ${
              isActive('/calendario') 
                ? 'text-orange-600 dark:text-orange-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              Calendário
            </span>
          </button>

          {/* Mais */}
          <button
            onClick={handleMoreClick}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all ${
              pathname?.startsWith('/dividas') || 
              pathname?.startsWith('/lembretes') || 
              pathname?.startsWith('/minhas-metas') || 
              pathname?.startsWith('/dashboard') || 
              pathname?.startsWith('/categorias') || 
              pathname?.startsWith('/tutoriais') || 
              pathname?.startsWith('/configuracoes')
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : 'hover:bg-gray-100 dark:hover:bg-brand-midnight/50'
            }`}
          >
            <MoreVertical 
              size={24} 
              className={
                pathname?.startsWith('/dividas') || 
                pathname?.startsWith('/lembretes') || 
                pathname?.startsWith('/minhas-metas') || 
                pathname?.startsWith('/dashboard') || 
                pathname?.startsWith('/categorias') || 
                pathname?.startsWith('/tutoriais') || 
                pathname?.startsWith('/configuracoes')
                  ? 'text-orange-600 dark:text-orange-400' 
                  : 'text-gray-600 dark:text-gray-400'
              } 
              strokeWidth={
                pathname?.startsWith('/dividas') || 
                pathname?.startsWith('/lembretes') || 
                pathname?.startsWith('/minhas-metas') || 
                pathname?.startsWith('/dashboard') || 
                pathname?.startsWith('/categorias') || 
                pathname?.startsWith('/tutoriais') || 
                pathname?.startsWith('/configuracoes')
                  ? 2.5 
                  : 2
              }
            />
            <span className={`text-xs font-medium ${
              pathname?.startsWith('/dividas') || 
              pathname?.startsWith('/lembretes') || 
              pathname?.startsWith('/minhas-metas') || 
              pathname?.startsWith('/dashboard') || 
              pathname?.startsWith('/categorias') || 
              pathname?.startsWith('/tutoriais') || 
              pathname?.startsWith('/configuracoes')
                ? 'text-orange-600 dark:text-orange-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              Mais
            </span>
          </button>
        </div>
      </nav>

      {/* Espaçamento no final da página para não ficar coberto pelo bottom nav */}
      <div className="h-20 lg:hidden" />
    </>
  )
}

