import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import DashboardHorizontalWrapper from '@/components/DashboardHorizontalWrapper'
import QuickActionCard from '@/components/QuickActionCard'
import SupportPanel from '@/components/SupportPanel'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import FiltroRapidoDataWrapper, { FiltroDataProvider } from '@/components/FiltroRapidoDataWrapper'
import HomeLayoutNovo from '@/components/HomeLayoutNovo'
import AppOnboardingGate from '@/components/AppOnboardingGate'
import { obterHomeEstatisticas, obterPerfilUsuario } from '@/lib/actions'
import { Suspense } from 'react'
import dynamicImport from 'next/dynamic'

// Lazy load componentes pesados ou menos críticos para carregamento inicial
const ReceitasDespesasDonut = dynamicImport(() => import('@/components/ReceitasDespesasDonut'), {
  ssr: false,
  loading: () => (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-brand-royal dark:to-brand-midnight rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-white/10 animate-pulse">
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  ),
})

const BannerInformacoes = dynamicImport(() => import('@/components/BannerInformacoes'), {
  ssr: false,
  loading: () => null,
})

const AvisosAdmin = dynamicImport(() => import('@/components/AvisosAdmin'), {
  ssr: false,
  loading: () => null,
})

const AvisoEmailNaoConfirmado = dynamicImport(() => import('@/components/AvisoEmailNaoConfirmado'), {
  ssr: false,
  loading: () => null,
})

const EmailConfirmadoSucessoWrapper = dynamicImport(() => import('@/components/EmailConfirmadoSucessoWrapper'), {
  ssr: false,
  loading: () => null,
})

export const dynamic = 'force-dynamic'

// Período do mês atual (mesmo critério do FiltroDataProvider) para pré-carregar stats no servidor
function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { inicio: start.toISOString(), fim: end.toISOString() }
}

// Middleware já verifica autenticação, não precisa verificar novamente aqui

export default async function HomePage() {
  let initialStats: Awaited<ReturnType<typeof obterHomeEstatisticas>> = { error: null, stats: null, saldoTotal: 0, saldoMesAnterior: 0 }
  let initialUserProfile: Awaited<ReturnType<typeof obterPerfilUsuario>> = null

  try {
    const { inicio, fim } = getCurrentMonthRange()
    const [stats, profile] = await Promise.all([
      obterHomeEstatisticas(inicio, fim),
      obterPerfilUsuario(),
    ])
    initialStats = stats
    initialUserProfile = profile
  } catch {
    // Evita tela branca (500): usa valores padrão e deixa o layout renderizar
  }

  return (
    <AppOnboardingGate>
    <FiltroDataProvider>
      <div className="min-h-screen bg-brand-clean dark:bg-[#1A1A1A]">
        <Sidebar />
        <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-[#1A1A1A] pt-3 lg:pt-4 pb-24 sm:pb-28">
          <div className="max-w-7xl mx-auto">
          {/* Avisos Administrativos (Popup) */}
          <AvisosAdmin />

          {/* Aviso de Email Não Confirmado */}
          <AvisoEmailNaoConfirmado />

          {/* Popup de sucesso quando email é confirmado */}
          <EmailConfirmadoSucessoWrapper />

          {/* Novo Layout da Home - dados e perfil já vêm do servidor para evitar delay */}
          <HomeLayoutNovo initialStats={initialStats} initialUserProfile={initialUserProfile} />

          {/* Conteúdo Principal - Cards de Ação Rápida */}
          <div className="flex flex-col lg:flex-row gap-6 lg:mt-4">
            {/* Coluna Esquerda - Ações Rápidas */}
            <div className="flex-1 lg:w-2/3 space-y-6 sm:space-y-8 md:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
                <QuickActionCard
                  title="NOVO REGISTRO"
                  description="Registre qualquer entrada, saída ou dívida de forma rápida e organizada."
                  buttonText="REGISTRAR"
                  iconName="FileText"
                  type="registro"
                />
                <QuickActionCard
                  title="SALÁRIO OU DINDIN"
                  description="Registre seu salário ou qualquer entrada de dinheiro de forma simples."
                  buttonText="REGISTRAR"
                  iconName="DollarSign"
                  type="salario"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
                <QuickActionCard
                  title="EMPRÉSTIMO"
                  description="Registre todos os empréstimos feitos para pessoas, com documentos e informações completas."
                  buttonText="REGISTRAR EMPRÉSTIMO"
                  iconName="Hand"
                  type="emprestimo"
                />
                <QuickActionCard
                  title="DÍVIDA"
                  description="Registre suas dívidas com data de vencimento e método de pagamento."
                  buttonText="REGISTRAR DÍVIDA"
                  iconName="CreditCard"
                  type="divida"
                />
              </div>
            </div>

            {/* Coluna Direita - SupportPanel (Desktop) - APENAS UMA VEZ NO DESKTOP - NUNCA DUPLICAR */}
            <div className="hidden lg:block lg:w-1/3">
              <SupportPanel key="support-desktop-only" />
            </div>
          </div>

          {/* Banner - Abaixo dos cards de registro com espaçamento adequado */}
          <div className="mt-8 mb-6">
            <BannerInformacoes />
          </div>

          {/* SupportPanel no Mobile - Abaixo do banner - APENAS NO MOBILE - NUNCA NO DESKTOP */}
          <div className="lg:hidden">
            <SupportPanel key="support-mobile-only" />
          </div>
        </div>
      </main>
    </div>
    </FiltroDataProvider>
    </AppOnboardingGate>
  )
}

