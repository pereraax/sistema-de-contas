'use client'

import { useState, useEffect } from 'react'
import { ConversationList } from '@/components/crm/ConversationList'
import { ChatWindow } from '@/components/crm/ChatWindow'
import { ContactProfile } from '@/components/crm/ContactProfile'
import { User, X, RefreshCw } from 'lucide-react'
import type { ConversationItem } from '@/components/crm/ConversationList'
import type { ChatMessage } from '@/components/crm/ChatWindow'
import type { ContactProfileData } from '@/components/crm/ContactProfile'
import type { ContactStatus } from '@/lib/crm/constants'

export default function CrmConversasPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
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
    const t = setInterval(loadInbox, 3000)
    return () => clearInterval(t)
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
    const t = setInterval(() => loadMessages(selectedContactId), 3000)
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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Conversas</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gerencie contatos e mensagens</p>
        </div>
        <div className="flex items-center gap-2">
          {syncResult && (
            <span className="text-sm text-zinc-400 max-w-xs truncate" title={syncResult}>
              {syncResult}
            </span>
          )}
          <button
            type="button"
            onClick={handleSyncWhatsApp}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-zinc-300 hover:bg-white/15 hover:text-white disabled:opacity-50 text-sm"
            title="Trazer todas as conversas do WhatsApp conectado (como no WhatsApp Web)"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar WhatsApp'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-80 flex-shrink-0 border-r border-white/10">
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

        <div className="flex-1 min-w-0 flex flex-col bg-zinc-950/30">
          {/* Barra superior: nome do contato + opção "Informações do contato" */}
          <div className="flex items-center justify-between gap-3 p-3 border-b border-white/10 bg-zinc-900/50 flex-shrink-0">
            <p className="font-medium text-white truncate">
              {selected ? selected.contact_nome || selected.contact_telefone || 'Conversa' : 'Selecione um contato'}
            </p>
            {selectedContactId && (
              <button
                type="button"
                onClick={() => setShowContactInfo(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <User size={18} />
                Informações do contato
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
