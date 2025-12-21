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
// Otimizar: cache de 60 segundos para melhor performance
export const revalidate = 60

// Middleware já verifica autenticação, não precisa verificar novamente aqui

export default async function HomePage() {
  return (
    <FiltroDataProvider>
      <div className="min-h-screen bg-brand-clean dark:bg-brand-midnight">
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

          {/* Banner e Dicas - Lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-0">
            {/* Coluna Esquerda - Banner */}
            <div className="lg:col-span-2">
              <BannerInformacoes />
            </div>

            {/* Coluna Direita - Suporte e Dicas */}
            <div className="lg:col-span-1">
              <SupportPanel />
            </div>
          </div>

          {/* Conteúdo Principal - SEMPRE VISÍVEL, mas desabilitado se email não confirmado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ marginTop: '-220px' }}>
            {/* Coluna Esquerda - Ações Rápidas */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Coluna Direita - Vazia (já tem o SupportPanel acima) */}
            <div className="lg:col-span-1">
            </div>
          </div>
        </div>
      </main>
    </div>
    </FiltroDataProvider>
  )
}

