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
  conversation_id: string
  conversation_status: string
  ultima_mensagem: string | null
  ultima_interacao: string
  unread?: number
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
    <div className="flex flex-col h-full bg-zinc-900/50 border-r border-white/10">
      <div className="p-3 border-b border-white/10 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
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
      <div className="flex-1 overflow-y-auto">
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
              <Avatar name={item.contact_nome || item.contact_telefone} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white truncate">
                    {item.contact_nome || item.contact_telefone || 'Sem nome'}
                  </span>
                  <span className="text-xs text-zinc-500 shrink-0">{formatTime(item.ultima_interacao)}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {typeof item.ultima_mensagem === 'string' && item.ultima_mensagem !== '[object Object]'
                    ? item.ultima_mensagem
                    : '—'}
                </p>
                <Badge variant={item.contact_status} className="mt-1">
                  {item.contact_status.replace(/_/g, ' ')}
                </Badge>
              </div>
              {item.unread ? (
                <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-xs flex items-center justify-center font-bold">
                  {item.unread}
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
