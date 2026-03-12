'use client'

import { useEffect, useState } from 'react'
import { Wifi, Users, UserX } from 'lucide-react'

const POLL_INTERVAL_MS = 1000

type Stats = { online: number; offline: number; total: number } | null

export default function OnlineStatsLive() {
  const [stats, setStats] = useState<Stats>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/online-stats', { credentials: 'include' })
        if (cancelled) return
        if (!res.ok) {
          if (res.status === 401) return
          setError('Erro ao carregar')
          return
        }
        const data = await res.json()
        if (cancelled) return
        setStats({ online: data.online ?? 0, offline: data.offline ?? 0, total: data.total ?? 0 })
        setError(null)
      } catch {
        if (!cancelled) setError('Erro de rede')
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (error && !stats) {
    return (
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg lg:text-xl font-display font-bold text-brand-clean mb-3 lg:mb-4" style={{ fontWeight: 700 }}>
          Usuários ao vivo
        </h2>
        <p className="text-brand-clean/70 text-sm">{error}</p>
      </div>
    )
  }

  const cards = [
    {
      icon: Wifi,
      label: 'Online agora',
      value: stats?.online ?? '—',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
    },
    {
      icon: Users,
      label: 'Total (logados na plataforma)',
      value: stats?.total ?? '—',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
    },
    {
      icon: UserX,
      label: 'Offline',
      value: stats?.offline ?? '—',
      color: 'text-slate-400',
      bgColor: 'bg-slate-800/40',
    },
  ]

  return (
    <div className="mb-6 lg:mb-8">
      <h2 className="text-lg lg:text-xl font-display font-bold text-brand-clean mb-3 lg:mb-4" style={{ fontWeight: 700 }}>
        Usuários ao vivo
      </h2>
      <p className="text-xs text-brand-clean/50 mb-3">
        Atualizado a cada 1 segundo. Online = atividade nos últimos 60 segundos.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-[#252525] rounded-2xl p-6 shadow-lg border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon size={24} className={card.color} strokeWidth={2} />
                </div>
                {index === 0 && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Ao vivo" />
                )}
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
    </div>
  )
}
