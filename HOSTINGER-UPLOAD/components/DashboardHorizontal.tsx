import { obterEstatisticas } from '@/lib/actions'
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react'

export default async function DashboardHorizontal() {
  try {
    const stats = await obterEstatisticas()

    // Se houver erro, usar valores padrão (zero) ao invés de esconder
    const totalEntradas = stats.error ? 0 : (stats.totalEntradas || 0)
    const totalSaidas = stats.error ? 0 : (stats.totalSaidas || 0)
    const totalDividasPendentes = stats.error ? 0 : (stats.totalDividasPendentes || 0)

    const saldo = totalEntradas - totalSaidas

    const cards = [
      {
        icon: TrendingUp,
        label: 'Total Recebido',
        value: totalEntradas,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        darkIconColor: 'text-green-400'
      },
      {
        icon: TrendingDown,
        label: 'Total Gasto',
        value: totalSaidas,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        darkIconColor: 'text-red-400'
      },
      {
        icon: DollarSign,
        label: 'Saldo Atual',
        value: saldo,
        color: saldo >= 0 ? 'text-green-600' : 'text-red-600',
        bgColor: saldo >= 0 ? 'bg-green-50' : 'bg-red-50',
        iconColor: saldo >= 0 ? 'text-green-600' : 'text-red-600',
        darkIconColor: saldo >= 0 ? 'text-green-400' : 'text-red-400'
      },
      {
        icon: CreditCard,
        label: 'Dívidas Pendentes',
        value: totalDividasPendentes,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        darkIconColor: 'text-orange-400'
      }
    ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className={`bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-brand-clean dark:border-white/10 ${card.bgColor} dark:bg-opacity-20 animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${card.bgColor} dark:bg-opacity-30 dark:bg-gray-800/60`}>
                  <Icon 
                    size={20} 
                    className={`sm:w-6 sm:h-6 ${card.iconColor} ${
                      card.darkIconColor === 'text-green-400' ? 'dark:text-green-400' :
                      card.darkIconColor === 'text-red-400' ? 'dark:text-red-400' :
                      card.darkIconColor === 'text-orange-400' ? 'dark:text-orange-400' :
                      'dark:text-gray-200'
                    }`} 
                    strokeWidth={2.5} 
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-brand-midnight dark:text-brand-clean mb-1 font-bold">
                {card.label}
              </p>
              <p className={`text-xl sm:text-2xl font-display ${card.color} ${
                card.darkIconColor === 'text-green-400' ? 'dark:text-green-400' :
                card.darkIconColor === 'text-red-400' ? 'dark:text-red-400' :
                card.darkIconColor === 'text-orange-400' ? 'dark:text-orange-400' :
                'dark:text-gray-100'
              }`} style={{ fontWeight: 900 }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(card.value)}
              </p>
            </div>
          )
        })}
      </div>
    )
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
    // Em caso de erro, mostrar dashboard com valores zero
    const cards = [
      { icon: TrendingUp, label: 'Total Recebido', value: 0, color: 'text-green-600', bgColor: 'bg-green-50', iconColor: 'text-green-600', darkIconColor: 'text-green-400' },
      { icon: TrendingDown, label: 'Total Gasto', value: 0, color: 'text-red-600', bgColor: 'bg-red-50', iconColor: 'text-red-600', darkIconColor: 'text-red-400' },
      { icon: DollarSign, label: 'Saldo Atual', value: 0, color: 'text-green-600', bgColor: 'bg-green-50', iconColor: 'text-green-600', darkIconColor: 'text-green-400' },
      { icon: CreditCard, label: 'Dívidas Pendentes', value: 0, color: 'text-orange-600', bgColor: 'bg-orange-50', iconColor: 'text-orange-600', darkIconColor: 'text-orange-400' }
    ]
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className={`bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-brand-clean dark:border-white/10 ${card.bgColor} dark:bg-opacity-20 animate-fade-in`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${card.bgColor} dark:bg-opacity-30 dark:bg-gray-800/60`}>
                  <Icon 
                    size={20} 
                    className={`sm:w-6 sm:h-6 ${card.iconColor} ${
                      card.darkIconColor === 'text-green-400' ? 'dark:text-green-400' :
                      card.darkIconColor === 'text-red-400' ? 'dark:text-red-400' :
                      card.darkIconColor === 'text-orange-400' ? 'dark:text-orange-400' :
                      'dark:text-gray-200'
                    }`} 
                    strokeWidth={2.5} 
                  />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-brand-midnight dark:text-brand-clean mb-1 font-bold">
                {card.label}
              </p>
              <p className={`text-xl sm:text-2xl font-display ${card.color} ${
                card.darkIconColor === 'text-green-400' ? 'dark:text-green-400' :
                card.darkIconColor === 'text-red-400' ? 'dark:text-red-400' :
                card.darkIconColor === 'text-orange-400' ? 'dark:text-orange-400' :
                'dark:text-gray-100'
              }`} style={{ fontWeight: 900 }}>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(card.value)}
              </p>
            </div>
          )
        })}
      </div>
    )
  }
}
