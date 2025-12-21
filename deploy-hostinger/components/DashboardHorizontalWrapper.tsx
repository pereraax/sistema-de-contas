'use client'

import { useState, useEffect } from 'react'
import { obterEstatisticas } from '@/lib/actions'
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react'
import { useFiltroData } from './FiltroRapidoDataWrapper'
import FiltroRapidoData from './FiltroRapidoData'

export default function DashboardHorizontalWrapper() {
  const { dataInicio, dataFim } = useFiltroData()
  const [stats, setStats] = useState<{
    totalEntradas: number
    totalSaidas: number
    totalDividasPendentes: number
    saldo: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const carregarEstatisticas = async () => {
    try {
      // Debug temporário - remover depois
      if (dataInicio || dataFim) {
        console.log('🔍 Filtro ativo:', { dataInicio, dataFim })
      }
      
      const result = await obterEstatisticas(dataInicio, dataFim)
      
      if (result.error) {
        // Em caso de erro, usar valores zero
        setStats({
          totalEntradas: 0,
          totalSaidas: 0,
          totalDividasPendentes: 0,
          saldo: 0
        })
      } else {
        const totalEntradas = result.totalEntradas || 0
        const totalSaidas = result.totalSaidas || 0
        const totalDividasPendentes = result.totalDividasPendentes || 0
        const saldo = totalEntradas - totalSaidas
        
        setStats({
          totalEntradas,
          totalSaidas,
          totalDividasPendentes,
          saldo
        })
      }
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      setStats({
        totalEntradas: 0,
        totalSaidas: 0,
        totalDividasPendentes: 0,
        saldo: 0
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    // Carregar imediatamente
    carregarEstatisticas()

    // Atualizar a cada 10 segundos
    const interval = setInterval(() => {
      carregarEstatisticas()
    }, 10000) // 10 segundos

    return () => clearInterval(interval)
  }, [dataInicio, dataFim]) // Recarregar quando os filtros de data mudarem

  // Valores padrão enquanto carrega
  const totalEntradas = stats?.totalEntradas ?? 0
  const totalSaidas = stats?.totalSaidas ?? 0
  const totalDividasPendentes = stats?.totalDividasPendentes ?? 0
  const saldo = stats?.saldo ?? 0

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className={`bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-brand-clean dark:border-white/10 ${card.bgColor} dark:bg-opacity-20 animate-fade-in transition-all duration-300 relative ${
              loading ? 'opacity-50' : 'opacity-100'
            }`}
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
              {/* Filtro rápido de data no canto superior direito - em todos os cards */}
              <div className="absolute top-3 right-3">
                <FiltroRapidoData />
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
            } transition-all duration-300`} style={{ fontWeight: 900 }}>
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



