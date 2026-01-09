import Sidebar from '@/components/Sidebar'
import { MenuButton } from '@/components/MobileMenu'
import DashboardHorizontalWrapper from '@/components/DashboardHorizontalWrapper'
import QuickActionCard from '@/components/QuickActionCard'
import SupportPanel from '@/components/SupportPanel'
import NotificationBell from '@/components/NotificationBell'
import UserProfileMenu from '@/components/UserProfileMenu'
import BannerInformacoes from '@/components/BannerInformacoes'
import AvisosAdmin from '@/components/AvisosAdmin'
import AvisoEmailNaoConfirmado from '@/components/AvisoEmailNaoConfirmado'
import EmailConfirmadoSucessoWrapper from '@/components/EmailConfirmadoSucessoWrapper'
import Logo from '@/components/Logo'
import FiltroRapidoDataWrapper, { FiltroDataProvider } from '@/components/FiltroRapidoDataWrapper'
import ReceitasDespesasDonut from '@/components/ReceitasDespesasDonut'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// Middleware já verifica autenticação, não precisa verificar novamente aqui

export default async function HomePage() {
  return (
    <FiltroDataProvider>
      <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight">
        <Sidebar />
        <main className="lg:ml-64 p-3 sm:p-4 lg:p-8 dark:bg-brand-midnight pt-6 lg:pt-4 pb-24 sm:pb-28">
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
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-midnight dark:text-brand-clean leading-none">
                Home
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <NotificationBell />
              <UserProfileMenu />
            </div>
          </div>

          {/* Avisos Administrativos (Popup) */}
          <AvisosAdmin />

          {/* Aviso de Email Não Confirmado */}
          <AvisoEmailNaoConfirmado />

          {/* Popup de sucesso quando email é confirmado */}
          <EmailConfirmadoSucessoWrapper />

          {/* Dashboard Horizontal - ATUALIZA AUTOMATICAMENTE A CADA 10 SEGUNDOS */}
          <DashboardHorizontalWrapper />

          {/* Gráfico de Donut - Receitas x Despesas */}
          <div className="mb-6">
            <ReceitasDespesasDonut />
          </div>

          {/* Conteúdo Principal - Cards de Ação Rápida */}
          <div className="flex flex-col lg:flex-row gap-6">
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
  )
}

