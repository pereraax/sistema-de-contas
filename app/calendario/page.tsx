import nextDynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import PlanoGuard from '@/components/PlanoGuard'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { obterRegistros, obterUsuarios } from '@/lib/actions'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Carregar só no cliente para evitar chunk órfão no servidor (8948.js / 1682.js)
const CalendarioView = nextDynamic(() => import('@/components/CalendarioView'), { ssr: false, loading: () => <div className="text-center py-12 text-brand-midnight/60">Carregando calendário...</div> })

async function CalendarioContent() {
  let registros: any[] = []
  let usuarios: any[] = []
  try {
    const [registrosResult, usuariosResult] = await Promise.all([
      obterRegistros(),
      obterUsuarios()
    ])
    registros = registrosResult?.data ?? []
    usuarios = usuariosResult?.data ?? []
  } catch (e) {
    console.error('[CalendarioContent] Erro ao carregar dados:', e)
  }
  return <CalendarioView registros={registros} usuarios={usuarios} />
}

export default async function CalendarioPage() {
  return (
    <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A]">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-brand-midnight pt-3 sm:pt-4 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2 sm:gap-4 py-1 lg:py-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg lg:hidden [&_a]:!p-0 [&_a]:!w-full [&_a]:!h-full [&_img]:!w-full [&_img]:!h-full [&_img]:!object-contain">
                <Logo />
              </div>
              <MenuButton />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none truncate min-w-0">
                Calendário
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          <PlanoGuard feature="Calendário Financeiro" planoNecessario="basico">
            <Suspense fallback={<div className="text-center py-12 text-brand-midnight/60 dark:text-brand-clean/60">Carregando...</div>}>
              <CalendarioContent />
            </Suspense>
          </PlanoGuard>
        </div>
      </main>
    </div>
  )
}
