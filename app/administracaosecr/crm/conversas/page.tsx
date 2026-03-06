'use client'

import { useState, useEffect } from 'react'
import { ConversationList } from '@/components/crm/ConversationList'
import { ChatWindow } from '@/components/crm/ChatWindow'
import { ContactProfile } from '@/components/crm/ContactProfile'
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
      return
    }
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
      <div className="p-4 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">Conversas</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Gerencie contatos e mensagens</p>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-80 flex-shrink-0">
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
        <div className="flex-1 min-w-0 flex flex-col">
          <ChatWindow
            messages={messages}
            contactName={selected ? selected.contact_nome || selected.contact_telefone || undefined : undefined}
            inputValue={inputMessage}
            onInputChange={setInputMessage}
            onSend={handleSend}
            loading={loading}
            disabled={!selectedContactId}
            onInsertVariable={(v) => setInputMessage((prev) => prev + v)}
          />
        </div>
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <ContactProfile
            contact={contactDetail}
            onStatusChange={handleStatusChange}
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
    </div>
  )
}
