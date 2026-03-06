'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  Send,
  Search,
  User,
  Clock,
  CheckCircle,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Activity,
  Filter,
  Loader2,
} from 'lucide-react'

type ContactStatus =
  | 'novo_lead'
  | 'aguardando_email'
  | 'aguardando_codigo'
  | 'usuario_ativo'
  | 'cliente_pago'
  | 'inativo'

interface InboxItem {
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
}

interface CrmMessage {
  id: string
  contact_id: string
  tipo: 'entrada' | 'saida'
  mensagem: string
  timestamp: string
  origem: string
}

interface ContactDetail {
  id: string
  telefone: string
  nome: string | null
  email: string | null
  status: ContactStatus
  data_primeiro_contato: string
  ultima_interacao: string
  observacoes: string | null
}

const STATUS_LABELS: Record<ContactStatus, string> = {
  novo_lead: 'Novo lead',
  aguardando_email: 'Aguardando e-mail',
  aguardando_codigo: 'Aguardando código',
  usuario_ativo: 'Usuário ativo',
  cliente_pago: 'Cliente pago',
  inativo: 'Inativo',
}

export default function CrmInboxPage() {
  const [conversations, setConversations] = useState<InboxItem[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [messages, setMessages] = useState<CrmMessage[]>([])
  const [contactDetail, setContactDetail] = useState<ContactDetail | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ContactStatus | ''>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailPanel, setShowDetailPanel] = useState(true)
  const [closingId, setClosingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadInbox = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetch(`/api/admin/crm/inbox?${params}`)
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations ?? [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadInbox()
    const t = setInterval(loadInbox, 10000)
    return () => clearInterval(t)
  }, [filterStatus])

  useEffect(() => {
    if (!selectedContactId) {
      setMessages([])
      setContactDetail(null)
      return
    }
    const loadMessages = async () => {
      const res = await fetch(`/api/admin/crm/messages?contact_id=${selectedContactId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      }
    }
    const loadContact = async () => {
      const res = await fetch(`/api/admin/crm/contacts/${selectedContactId}`)
      if (res.ok) {
        const data = await res.json()
        setContactDetail(data.contact)
      }
    }
    loadMessages()
    loadContact()
    const t = setInterval(loadMessages, 5000)
    return () => clearInterval(t)
  }, [selectedContactId])

  useEffect(() => {
    if (messages.length) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!selectedContactId || !inputMessage.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/crm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_id: selectedContactId, message: inputMessage.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.ok !== false) {
        setInputMessage('')
        const msgRes = await fetch(`/api/admin/crm/messages?contact_id=${selectedContactId}`)
        if (msgRes.ok) {
          const d = await msgRes.json()
          setMessages(d.messages ?? [])
        }
        loadInbox()
      } else {
        alert(data?.message || data?.error || 'Falha ao enviar')
      }
    } catch (e: any) {
      alert(e?.message || 'Erro ao enviar')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseConversation = async () => {
    const item = conversations.find((c) => c.contact_id === selectedContactId)
    if (!item?.conversation_id || !selectedContactId) return
    setClosingId(item.conversation_id)
    try {
      const res = await fetch(`/api/admin/crm/conversations/${item.conversation_id}/close`, {
        method: 'POST',
      })
      if (res.ok) {
        await loadInbox()
        setContactDetail((prev) => (prev ? { ...prev } : null))
      }
    } finally {
      setClosingId(null)
    }
  }

  const formatTime = (s: string) =>
    new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (s: string) => {
    const d = new Date(s)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Hoje'
    return d.toLocaleDateString('pt-BR')
  }

  const filtered = conversations.filter((c) => {
    const term = searchTerm.toLowerCase()
    if (!term) return true
    return (
      (c.contact_nome ?? '').toLowerCase().includes(term) ||
      (c.contact_telefone ?? '').includes(term) ||
      (c.contact_email ?? '').toLowerCase().includes(term)
    )
  })

  const selected = conversations.find((c) => c.contact_id === selectedContactId)

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold text-white mb-1">CRM WhatsApp</h1>
        <p className="text-sm text-white/70">Inbox de conversas e contatos</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[400px]">
        {/* Lista */}
        <div
          className={`flex flex-col w-full sm:w-80 shrink-0 rounded-xl border border-white/10 bg-[#1e1e1e] overflow-hidden ${
            selectedContactId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Filter size={16} className="text-white/60" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus((e.target.value || '') as ContactStatus | '')}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white"
              >
                <option value="">Todos</option>
                {(Object.keys(STATUS_LABELS) as ContactStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40" size={14} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-white/50 text-sm">
                Nenhuma conversa
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.contact_id}
                  onClick={() => setSelectedContactId(c.contact_id)}
                  className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 ${
                    selectedContactId === c.contact_id ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate">
                        {c.contact_nome || c.contact_telefone || 'Sem nome'}
                      </p>
                      <p className="text-xs text-white/50 truncate">{c.contact_telefone}</p>
                      <p className="text-xs text-white/60 truncate mt-0.5">
                        {c.ultima_mensagem || '—'}
                      </p>
                    </div>
                    <span className="text-[10px] text-white/40 shrink-0">
                      {formatDate(c.ultima_interacao)} {formatTime(c.ultima_interacao)}
                    </span>
                  </div>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-white/70">
                    {STATUS_LABELS[c.contact_status]}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat */}
        <div
          className={`flex-1 flex flex-col rounded-xl border border-white/10 bg-[#1e1e1e] overflow-hidden ${
            selectedContactId ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {selectedContactId ? (
            <>
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => setSelectedContactId(null)}
                    className="sm:hidden p-1.5 rounded-lg hover:bg-white/10 text-white"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <p className="font-medium text-white truncate">
                      {selected?.contact_nome || selected?.contact_telefone || 'Contato'}
                    </p>
                    <p className="text-xs text-white/50">{selected?.contact_telefone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDetailPanel((v) => !v)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/70"
                    title="Detalhes do contato"
                  >
                    <User size={18} />
                  </button>
                  {selected?.conversation_id && (
                    <button
                      onClick={handleCloseConversation}
                      disabled={!!closingId}
                      className="px-2 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {closingId ? '...' : 'Resolver'}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.tipo === 'saida' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 ${
                        m.tipo === 'saida'
                          ? 'bg-emerald-600/80 text-white rounded-br-sm'
                          : 'bg-white/10 text-white rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm break-words">{m.mensagem}</p>
                      <p className="text-[10px] mt-1 opacity-80">{formatTime(m.timestamp)}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Digite a mensagem..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputMessage.trim() || loading}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Enviar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/50">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>Selecione uma conversa</p>
              </div>
            </div>
          )}
        </div>

        {/* Painel do contato */}
        {showDetailPanel && contactDetail && (
          <div className="hidden lg:flex flex-col w-72 shrink-0 rounded-xl border border-white/10 bg-[#1e1e1e] overflow-hidden">
            <div className="p-3 border-b border-white/10 flex justify-between items-center">
              <span className="text-sm font-medium text-white">Contato</span>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="text-white/60 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-white/50" />
                <span className="text-white">{contactDetail.telefone}</span>
              </div>
              {contactDetail.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-white/50" />
                  <span className="text-white">{contactDetail.email}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-white/50">Status</span>
                <p className="text-sm text-white">{STATUS_LABELS[contactDetail.status]}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-white/50" />
                <span className="text-white/80">
                  Primeiro contato: {formatDate(contactDetail.data_primeiro_contato)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-white/50" />
                <span className="text-white/80">
                  Última interação: {formatDate(contactDetail.ultima_interacao)} {formatTime(contactDetail.ultima_interacao)}
                </span>
              </div>
              {contactDetail.observacoes && (
                <div>
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Activity size={12} /> Observações
                  </span>
                  <p className="text-sm text-white/80 mt-0.5">{contactDetail.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
