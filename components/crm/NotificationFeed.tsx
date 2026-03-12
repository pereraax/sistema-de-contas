'use client'

import { Avatar } from '@/components/crm/ui/Avatar'
import { Badge } from '@/components/crm/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Input } from '@/components/crm/ui/Input'
import { Search } from 'lucide-react'
import type { ContactStatus } from '@/lib/crm/constants'

export interface ActivityItem {
  id: string
  contact_id: string
  contact_nome: string
  contact_telefone?: string
  contact_status: ContactStatus
  acao: string
  evento: string
  detalhes?: Record<string, unknown>
  timestamp: string
}

interface NotificationFeedProps {
  activities: ActivityItem[]
  period: string
  onPeriodChange: (period: string) => void
  search: string
  onSearchChange: (value: string) => void
  loading?: boolean
}

const PERIODS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7dias', label: 'Últimos 7 dias' },
  { value: 'todos', label: 'Todos' },
]

export function NotificationFeed({
  activities,
  period,
  onPeriodChange,
  search,
  onSearchChange,
  loading = false,
}: NotificationFeedProps) {
  const formatDate = (s: string) => {
    const d = new Date(s)
    const now = new Date()
    const today = now.toDateString() === d.toDateString()
    if (today) return `Hoje às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (yesterday.toDateString() === d.toDateString()) {
      return `Ontem às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p.value
                  ? 'bg-[#25D366]/20 text-[#25D366]'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Atividades</h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Carregando...</div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">Nenhuma atividade no período.</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <Avatar name={a.contact_nome} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">
                      <span className="text-zinc-300">{a.contact_nome}</span>
                      {' '}{a.acao}
                    </p>
                    {a.contact_telefone && (
                      <p className="text-xs text-zinc-500 mt-0.5">{a.contact_telefone}</p>
                    )}
                    <p className="text-xs text-zinc-500 mt-1">{formatDate(a.timestamp)}</p>
                  </div>
                  <Badge variant={a.contact_status}>
                    {a.contact_status.replace(/_/g, ' ')}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
