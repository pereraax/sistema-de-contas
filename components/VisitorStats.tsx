'use client'

import { useState, useEffect } from 'react'
import { Users, Eye, TrendingUp, Activity } from 'lucide-react'

interface VisitorStats {
  total: number
  online: number
  hoje: number
  semana: number
  mes: number
}

export default function VisitorStats() {
  const [stats, setStats] = useState<VisitorStats>({
    total: 0,
    online: 0,
    hoje: 0,
    semana: 0,
    mes: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/visitors/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Buscar imediatamente
    fetchStats()

    // Atualizar a cada 2 segundos
    const interval = setInterval(() => {
      fetchStats()
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      icon: Users,
      label: 'Total de Visitantes',
      value: stats.total,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Activity,
      label: 'Visitantes Online',
      value: stats.online,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      icon: Eye,
      label: 'Visitantes Hoje',
      value: stats.hoje,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: TrendingUp,
      label: 'Visitantes Este Mês',
      value: stats.mes,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
  ]

  if (loading) {
    return (
      <div className="bg-brand-royal rounded-2xl p-6 shadow-lg border border-white/10">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-aqua"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-brand-royal rounded-2xl p-6 shadow-lg border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-display font-bold text-brand-clean mb-1" style={{ fontWeight: 700 }}>
            Estatísticas de Tráfego em Tempo Real
          </h2>
          <p className="text-sm text-brand-clean/70">
            Monitoramento de visitantes da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-clean/60">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Atualizando a cada 2s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-brand-midnight/50 rounded-xl p-4 lg:p-5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon size={20} className={card.iconColor} strokeWidth={2} />
                </div>
              </div>
              <p className="text-xs lg:text-sm text-brand-clean/70 mb-2 font-bold" style={{ fontWeight: 700 }}>
                {card.label}
              </p>
              <p className={`text-2xl lg:text-3xl font-display font-bold ${card.color}`} style={{ fontWeight: 700 }}>
                {card.value.toLocaleString('pt-BR')}
              </p>
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between p-3 bg-brand-midnight/50 rounded-xl">
          <span className="text-sm font-semibold text-brand-clean/80" style={{ fontWeight: 600 }}>
            Visitantes esta semana:
          </span>
          <span className="text-xl font-bold text-brand-clean" style={{ fontWeight: 700 }}>
            {stats.semana.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  )
}











