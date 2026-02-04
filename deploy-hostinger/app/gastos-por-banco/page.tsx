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
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-[#1A1A1A] pt-6 lg:pt-4 pb-24 sm:pb-28">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-2 lg:hidden">
            <div className="w-40 sm:w-52">
              <Logo />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <MenuButton />
              <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none">
                Gastos por banco
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
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
