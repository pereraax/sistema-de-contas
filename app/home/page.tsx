import Sidebar from '@/components/Sidebar'
import QuickActionCard from '@/components/QuickActionCard'
import SupportPanel from '@/components/SupportPanel'
import FiltroRapidoDataWrapper, { FiltroDataProvider } from '@/components/FiltroRapidoDataWrapper'
import HomeLayoutNovo from '@/components/HomeLayoutNovo'
import AppOnboardingGate from '@/components/AppOnboardingGate'
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

const WelcomeOwnerPopupWrapper = dynamicImport(() => import('@/components/WelcomeOwnerPopupWrapper'), {
  ssr: false,
  loading: () => null,
})

export const dynamic = 'force-dynamic'

/**
 * Página Home: sem dados no servidor para evitar 500 (cookies/Supabase em alguns ambientes).
 * HomeLayoutNovo e perfis são carregados no cliente.
 */
export default function HomePage() {
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

          {/* Popup de boas-vindas + definir nome do dono (primeiro usuário da conta) */}
          <WelcomeOwnerPopupWrapper />

          {/* Layout da Home - dados carregados no cliente para evitar 500 no servidor */}
          <HomeLayoutNovo />

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

