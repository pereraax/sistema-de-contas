import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import GerenciarCategoriasView from '@/components/GerenciarCategoriasView'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function CategoriasPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-midnight">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 md:p-8 bg-gray-50 dark:bg-brand-midnight pt-6 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          {/* Logotipo centralizado acima do header */}
          <div className="flex justify-center mb-2 lg:hidden">
            <div className="w-40 sm:w-52">
              <Logo />
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <MenuButton />
              <h1 className="text-base sm:text-lg font-display font-bold text-gray-900 dark:text-brand-clean leading-none whitespace-nowrap">
                Gerenciar Categorias
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          <GerenciarCategoriasView />
        </div>
      </main>
    </div>
  )
}







