import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import DashboardView from '@/components/DashboardView'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import Logo from '@/components/Logo'
import { obterRegistros, obterEstatisticas } from '@/lib/actions'
import { Suspense } from 'react'

// Otimizar: cache de 30 segundos (dados mudam mais frequentemente)
export const revalidate = 30

// Middleware já verifica autenticação

async function DashboardContent() {
  const [registrosResult, statsResult] = await Promise.all([
    obterRegistros(),
    obterEstatisticas()
  ])
  
  // Filtrar apenas entradas e saídas, excluindo dívidas
  // Dívidas têm seção própria e só assinantes têm acesso
  const registrosFiltrados = (registrosResult.data || []).filter(
    (reg) => reg.tipo === 'entrada' || reg.tipo === 'saida'
  )
  
  return (
    <DashboardView
      registros={registrosFiltrados}
      estatisticas={statsResult}
    />
  )
}

export default async function DashboardPage() {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-midnight">
      <Sidebar />
      <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-brand-midnight pt-6 lg:pt-4">
        <div className="max-w-7xl mx-auto">
          {/* Logotipo centralizado acima do header */}
          <div className="flex justify-center mb-2 lg:hidden">
            <div className="w-40 sm:w-52">
              <Logo />
            </div>
          </div>

          {/* Header com notificações */}
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <MenuButton />
              <h1 className="text-base sm:text-lg font-display font-bold text-brand-midnight dark:text-brand-clean leading-none whitespace-nowrap">
                Dashboard / Relatórios
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          <Suspense fallback={<div className="text-center py-12 text-gray-600 dark:text-brand-clean/60">Carregando...</div>}>
            <DashboardContent />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

