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
    <div className="min-h-screen bg-gray-50 dark:bg-[#1A1A1A]">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 md:p-8 bg-gray-50 dark:bg-brand-midnight pt-3 sm:pt-4 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          {/* Header: no mobile logo à esquerda do título; headbar compacta */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
                <Logo />
              </div>
              <MenuButton />
              <h1 className="text-base sm:text-lg font-display font-bold text-gray-900 dark:text-brand-clean leading-none truncate min-w-0">
                Gerenciar Categorias
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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







