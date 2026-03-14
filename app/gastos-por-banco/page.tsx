import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import GastosPorBancoContent from '@/components/GastosPorBancoContent'

export const dynamic = 'force-dynamic'

export default function GastosPorBancoPage() {
  return (
    <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A]">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-[#1A1A1A] pt-3 sm:pt-4 lg:pt-4 pb-24 sm:pb-28">
        <div className="max-w-4xl mx-auto">
          {/* Header: no mobile logo à esquerda do título; headbar compacta */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <MenuButton />
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
                <Logo />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none truncate min-w-0">
                Gastos por banco
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>
          <GastosPorBancoContent />
        </div>
      </main>
    </div>
  )
}
