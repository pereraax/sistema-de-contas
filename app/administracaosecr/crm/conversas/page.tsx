'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ConversationList } from '@/components/crm/ConversationList'
import { ChatWindow } from '@/components/crm/ChatWindow'
import { ContactProfile } from '@/components/crm/ContactProfile'
import { Avatar } from '@/components/crm/ui/Avatar'
import { User, X, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ConversationItem } from '@/components/crm/ConversationList'
import type { ChatMessage } from '@/components/crm/ChatWindow'
import type { ContactProfileData } from '@/components/crm/ContactProfile'
import type { ContactStatus } from '@/lib/crm/constants'

export default function CrmConversasPage() {
  const searchParams = useSearchParams()
  const contactFromUrl = searchParams.get('contact')
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(contactFromUrl)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [contactDetail, setContactDetail] = useState<ContactProfileData | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [filterStatus, setFilterStatus] = useState<ContactStatus | ''>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const loadInbox = () => {
    fetch('/api/admin/crm/inbox')
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations ?? []))
      .catch(console.error)
  }

  useEffect(() => {
    loadInbox()
    const t = setInterval(loadInbox, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const c = searchParams.get('contact')
    if (c) setSelectedContactId(c)
  }, [searchParams])

  const selectedContactIdRef = useRef(selectedContactId)
  selectedContactIdRef.current = selectedContactId

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('crm_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_messages' },
        (payload: { new?: { contact_id?: string } }) => {
          const contactId = payload.new?.contact_id
          loadInbox()
          if (contactId && contactId === selectedContactIdRef.current) loadMessages(contactId)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'crm_messages' },
        () => {
          if (selectedContactIdRef.current) loadMessages(selectedContactIdRef.current)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_contacts' },
        () => loadInbox()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'crm_contacts' },
        () => loadInbox()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'crm_conversations' },
        () => loadInbox()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'crm_conversations' },
        () => loadInbox()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadMessages = (contactId: string) => {
    fetch(`/api/admin/crm/messages?contact_id=${contactId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages ?? []))
      .catch(console.error)
  }

  useEffect(() => {
    if (!selectedContactId) {
      setMessages([])
      setContactDetail(null)
      setShowContactInfo(false)
      return
    }
    setShowContactInfo(false)
    loadMessages(selectedContactId)
    const t = setInterval(() => loadMessages(selectedContactId), 5000)
    return () => clearInterval(t)
  }, [selectedContactId])

  useEffect(() => {
    if (!selectedContactId) return
    fetch(`/api/admin/crm/contacts/${selectedContactId}`)
      .then((res) => res.json())
      .then((data) => {
        const c = data.contact
        if (c)
          setContactDetail({
            id: c.id,
            nome: c.nome,
            telefone: c.telefone,
            email: c.email,
            status: c.status,
            data_primeiro_contato: c.data_primeiro_contato,
            ultima_interacao: c.ultima_interacao,
            observacoes: c.observacoes,
            origem: c.origem,
          })
        else setContactDetail(null)
      })
      .catch(console.error)
  }, [selectedContactId])

  const handleSend = () => {
    if (!selectedContactId || !inputMessage.trim()) return
    setLoading(true)
    fetch('/api/admin/crm/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: selectedContactId, message: inputMessage.trim() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (res.ok && data.ok !== false) {
          setInputMessage('')
          fetch(`/api/admin/crm/messages?contact_id=${selectedContactId}`)
            .then((r) => r.json())
            .then((d) => setMessages(d.messages ?? []))
          loadInbox()
        }
      })
      .finally(() => setLoading(false))
  }

  const handleSyncWhatsApp = () => {
    setSyncing(true)
    setSyncResult(null)
    fetch('/api/admin/crm/sync-whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setSyncResult(data.message ?? `Sincronizadas ${data.chatsSynced ?? 0} conversas.`)
          loadInbox()
        } else {
          setSyncResult(data.error ?? 'Erro ao sincronizar')
        }
      })
      .catch(() => setSyncResult('Erro de conexão'))
      .finally(() => {
        setSyncing(false)
        setTimeout(() => setSyncResult(null), 5000)
      })
  }

  const handleStatusChange = (contactId: string, status: ContactStatus) => {
    fetch(`/api/admin/crm/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
      .then((res) => res.ok && contactDetail?.id === contactId && setContactDetail((prev) => (prev ? { ...prev, status } : null)))
      .then(loadInbox)
  }

  const selected = conversations.find((c) => c.contact_id === selectedContactId)

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="px-3 py-1 border-b border-white/10 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white">Conversas</h1>
            <p className="text-[10px] text-zinc-500">Evolution ou Z-API</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {syncResult && (
            <span className="text-[10px] text-zinc-400 max-w-[100px] truncate" title={syncResult}>
              {syncResult}
            </span>
          )}
          <button
            type="button"
            onClick={handleSyncWhatsApp}
            disabled={syncing}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-white disabled:opacity-50 text-[11px]"
            title="Sincronizar conversas do WhatsApp"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </div>

      {conversations.length === 0 && (
        <div className="mx-4 mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
          Nenhuma conversa ao vivo ainda. Clique em <strong>&quot;Sincronizar WhatsApp&quot;</strong> acima para trazer todas as conversas do seu WhatsApp (igual ao WhatsApp Web). Se o webhook estiver configurado, novas mensagens também aparecerão aqui.
        </div>
      )}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="w-72 flex-shrink-0 border-r border-white/10 overflow-hidden flex flex-col">
          <ConversationList
            items={conversations}
            selectedContactId={selectedContactId}
            onSelect={setSelectedContactId}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-zinc-950/30 overflow-hidden">
          {/* Barra superior: avatar + nome + Info (estilo WhatsApp Web) */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 bg-zinc-900/50 flex-shrink-0">
            <div className="relative">
              <Avatar
                src={selected?.contact_avatar_url}
                name={selected ? selected.contact_nome || selected.contact_telefone : null}
                size="md"
              />
              {selected?.contact_is_online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900" title="Online" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate text-[15px]">
                {selected ? selected.contact_nome || selected.contact_telefone || 'Conversa' : 'Selecione um contato'}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                {selected?.contact_typing_until && new Date(selected.contact_typing_until) > new Date()
                  ? 'Digitando...'
                  : selected?.contact_is_online
                    ? 'Online'
                    : selected?.contact_last_seen_at
                      ? `Visto por último ${new Date(selected.contact_last_seen_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                      : ''}
              </p>
            </div>
            {selectedContactId && (
              <button
                type="button"
                onClick={() => setShowContactInfo(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
              >
                <User size={18} />
                Info
              </button>
            )}
          </div>

          {/* Área toda para a conversa */}
          <ChatWindow
            messages={messages}
            contactName={selected ? selected.contact_nome || selected.contact_telefone || undefined : undefined}
            inputValue={inputMessage}
            onInputChange={setInputMessage}
            onSend={handleSend}
            loading={loading}
            disabled={!selectedContactId}
            onInsertVariable={(v) => setInputMessage((prev) => prev + v)}
            hideHeader
          />
        </div>
      </div>

      {/* Drawer de informações do contato (abre por cima, ao clicar no topo) */}
      {showContactInfo && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            aria-hidden
            onClick={() => setShowContactInfo(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-white/10 shadow-xl z-50 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="font-medium text-white">Informações do contato</span>
              <button
                type="button"
                onClick={() => setShowContactInfo(false)}
                className="p-2 rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ContactProfile
                contact={contactDetail}
                onStatusChange={(id, status) => {
                  handleStatusChange(id, status)
                }}
                onAddNote={async (id, note) => {
                  await fetch(`/api/admin/crm/contacts/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      observacoes: (contactDetail?.observacoes || '') + '\n' + note + ' [' + new Date().toLocaleString('pt-BR') + ']',
                    }),
                  })
                  if (contactDetail?.id === id)
                    setContactDetail((prev) => (prev ? { ...prev, observacoes: (prev.observacoes || '') + '\n' + note } : null))
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
