'use client'

import { Avatar } from '@/components/crm/ui/Avatar'
import { Badge } from '@/components/crm/ui/Badge'
import { Input } from '@/components/crm/ui/Input'
import { Search, MessageCircle } from 'lucide-react'
import type { ContactStatus } from '@/lib/crm/constants'

export interface ConversationItem {
  contact_id: string
  contact_telefone: string
  contact_nome: string | null
  contact_email: string | null
  contact_status: ContactStatus
  contact_ultima_interacao: string
  contact_avatar_url?: string | null
  contact_last_seen_at?: string | null
  contact_is_online?: boolean | null
  contact_typing_until?: string | null
  conversation_id: string
  conversation_status: string
  ultima_mensagem: string | null
  ultima_interacao: string
  unread?: number
  unread_count?: number
}

interface ConversationListProps {
  items: ConversationItem[]
  selectedContactId: string | null
  onSelect: (contactId: string) => void
  filterStatus: ContactStatus | ''
  onFilterStatusChange: (status: ContactStatus | '') => void
  search: string
  onSearchChange: (value: string) => void
}

const STATUS_OPTIONS: { value: ContactStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'novo_lead', label: 'Novo lead' },
  { value: 'aguardando_email', label: 'Aguardando e-mail' },
  { value: 'aguardando_codigo', label: 'Aguardando código' },
  { value: 'usuario_ativo', label: 'Usuário ativo' },
  { value: 'cliente_pago', label: 'Cliente pago' },
  { value: 'inativo', label: 'Inativo' },
]

export function ConversationList({
  items,
  selectedContactId,
  onSelect,
  filterStatus,
  onFilterStatusChange,
  search,
  onSearchChange,
}: ConversationListProps) {
  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const formatLastSeen = (s: string) => {
    const d = new Date(s)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return 'agora'
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)} min`
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  const unreadCount = (item: ConversationItem) => item.unread ?? item.unread_count ?? 0
  const isTyping = (item: ConversationItem) => {
    const until = item.contact_typing_until
    return until ? new Date(until) > new Date() : false
  }

  const filtered = items.filter((item) => {
    const matchSearch =
      !search.trim() ||
      (item.contact_nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.contact_telefone || '').includes(search) ||
      (item.contact_email || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || item.contact_status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-900/50">
      <div className="p-2 border-b border-white/10 space-y-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 py-2 text-sm rounded-xl"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange((e.target.value || '') as ContactStatus | '')}
          className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-sm">
            <MessageCircle size={40} className="mx-auto mb-2 opacity-50" />
            Nenhuma conversa
          </div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.contact_id}
              onClick={() => onSelect(item.contact_id)}
              className={`w-full flex items-center gap-3 p-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${
                selectedContactId === item.contact_id ? 'bg-[#25D366]/10' : ''
              }`}
            >
              <Avatar
                src={item.contact_avatar_url}
                name={item.contact_nome || item.contact_telefone}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white truncate text-[15px]">
                    {item.contact_nome || item.contact_telefone || 'Sem nome'}
                  </span>
                  <span className="text-sm text-zinc-500 shrink-0">{formatTime(item.ultima_interacao)}</span>
                </div>
                <p className="text-sm text-zinc-500 truncate mt-0.5">
                  {isTyping(item)
                    ? 'Digitando...'
                    : typeof item.ultima_mensagem === 'string' && item.ultima_mensagem !== '[object Object]'
                      ? item.ultima_mensagem
                      : '—'}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.contact_is_online && (
                    <span className="text-[10px] text-emerald-400">Online</span>
                  )}
                  {!item.contact_is_online && item.contact_last_seen_at && !isTyping(item) && (
                    <span className="text-[10px] text-zinc-500">Visto por último {formatLastSeen(item.contact_last_seen_at)}</span>
                  )}
                  <Badge variant={item.contact_status} className="text-xs">
                    {item.contact_status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              {unreadCount(item) > 0 ? (
                <span className="w-6 h-6 rounded-full bg-[#25D366] text-white text-sm flex items-center justify-center font-bold shrink-0">
                  {unreadCount(item)}
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
