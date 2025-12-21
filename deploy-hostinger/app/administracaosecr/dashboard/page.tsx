import { obterEstatisticasUsuarios } from '@/lib/admin-auth'
import { Users, CreditCard, UserCheck, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import VisitorStats from '@/components/VisitorStats'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  let stats: { data: any; error: null } | { data: null; error: string } | null = null
  let isLoading = true

  try {
    stats = await obterEstatisticasUsuarios()
    isLoading = false
  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error)
    stats = { data: null, error: error?.message || 'Erro desconhecido' }
    isLoading = false
  }

  const cards = [
    {
      icon: Users,
      label: 'Total de Usuários',
      value: stats?.data?.total_usuarios || 0,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
    },
    {
      icon: CreditCard,
      label: 'Usuários Assinantes',
      value: stats?.data?.usuarios_assinantes || 0,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
    },
    {
      icon: UserCheck,
      label: 'Usuários Teste',
      value: stats?.data?.usuarios_teste || 0,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
    },
    {
      icon: TrendingUp,
      label: 'Taxa de Conversão',
      value: stats?.data?.total_usuarios 
        ? ((stats.data.usuarios_assinantes / stats.data.total_usuarios) * 100).toFixed(1) + '%'
        : '0%',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
    },
  ]

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto text-center py-10">
        <Loader2 className="animate-spin text-brand-aqua mx-auto mb-4" size={48} />
        <p className="text-brand-clean/70">Carregando dashboard...</p>
      </div>
    )
  }

  if (!stats || stats.error) {
    return (
      <div className="max-w-7xl mx-auto text-center py-10 bg-red-900/20 border border-red-500/50 rounded-xl p-6">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <h1 className="text-3xl font-display font-bold text-red-100 mb-2">
          Erro ao carregar Dashboard
        </h1>
        <p className="text-red-200/70 mb-4">
          {stats?.error || 'Erro ao obter estatísticas'}
        </p>
        <p className="text-red-200/70 text-sm">
          Verifique a configuração do Supabase e as políticas RLS.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-brand-clean mb-1 lg:mb-2" style={{ fontWeight: 700 }}>
          Dashboard Administrativo
        </h1>
        <p className="text-sm lg:text-base font-semibold text-brand-clean/70" style={{ fontWeight: 600 }}>
          Visão geral da plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-brand-royal rounded-2xl p-6 shadow-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon size={24} className={card.color} strokeWidth={2} />
                </div>
              </div>
              <p className="text-xs lg:text-sm text-brand-clean/70 mb-1 font-bold" style={{ fontWeight: 700 }}>
                {card.label}
              </p>
              <p className={`text-2xl lg:text-3xl font-display font-bold ${card.color}`} style={{ fontWeight: 700 }}>
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Estatísticas de Tráfego */}
      <div className="mb-6 lg:mb-8">
        <VisitorStats />
      </div>

      <div className="bg-brand-royal rounded-2xl p-4 lg:p-6 shadow-lg border border-white/10">
        <h2 className="text-lg lg:text-xl font-display font-bold text-brand-clean mb-3 lg:mb-4" style={{ fontWeight: 700 }}>
          Resumo
        </h2>
        <div className="space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between p-3 lg:p-4 bg-brand-midnight/50 rounded-xl">
            <span className="text-sm lg:text-base font-semibold text-brand-clean/80" style={{ fontWeight: 600 }}>Total de usuários cadastrados</span>
            <span className="text-xl lg:text-2xl font-bold text-brand-clean" style={{ fontWeight: 700 }}>
              {stats?.data?.total_usuarios || 0}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 lg:p-4 bg-brand-midnight/50 rounded-xl">
            <span className="text-sm lg:text-base font-semibold text-brand-clean/80" style={{ fontWeight: 600 }}>Usuários com plano ativo</span>
            <span className="text-xl lg:text-2xl font-bold text-green-400" style={{ fontWeight: 700 }}>
              {stats?.data?.usuarios_assinantes || 0}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 lg:p-4 bg-brand-midnight/50 rounded-xl">
            <span className="text-sm lg:text-base font-semibold text-brand-clean/80" style={{ fontWeight: 600 }}>Usuários em teste</span>
            <span className="text-xl lg:text-2xl font-bold text-orange-400" style={{ fontWeight: 700 }}>
              {stats?.data?.usuarios_teste || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
