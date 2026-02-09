import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import ConfiguracoesView from '@/components/ConfiguracoesView'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'

export const dynamic = 'force-dynamic'

// Perfil carregado no client (ConfiguracoesView) para resposta rápida após login

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: { tab?: string } | null
}) {
  const tabAtivo = searchParams?.tab || 'perfil'

  return (
    <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A] overflow-hidden">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-[#1A1A1A] pt-3 lg:pt-4 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header: no mobile logo ao lado do título (igual à Home) */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Logo só no mobile, mesmo tamanho do ícone de perfil (igual à Home) */}
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
                <Logo />
              </div>
              <MenuButton />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none truncate min-w-0">
                Configurações
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          <ConfiguracoesView tabAtivo={tabAtivo} initialProfileData={null} />
        </div>
      </main>
    </div>
  )
}
