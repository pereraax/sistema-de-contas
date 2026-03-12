'use client'

import { useState } from 'react'
import { Avatar } from '@/components/crm/ui/Avatar'
import { Badge } from '@/components/crm/ui/Badge'
import { Button } from '@/components/crm/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/crm/ui/Card'
import { Phone, Mail, Calendar, Tag, FileText, MessageSquare } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/crm/constants'
import type { ContactStatus } from '@/lib/crm/constants'

export interface ContactProfileData {
  id: string
  nome: string | null
  telefone: string
  email: string | null
  status: ContactStatus
  data_primeiro_contato: string
  ultima_interacao: string
  observacoes: string | null
  origem?: string
  tags?: string[]
}

interface ContactProfileProps {
  contact: ContactProfileData | null
  onStatusChange?: (contactId: string, status: ContactStatus) => void
  onPhoneChange?: (contactId: string, telefone: string) => void
  onAddNote?: (contactId: string, note: string) => void
  onEditTags?: (contactId: string, tags: string[]) => void
}

export function ContactProfile({
  contact,
  onStatusChange,
  onPhoneChange,
  onAddNote,
  onEditTags,
}: ContactProfileProps) {
  const [note, setNote] = useState('')
  const [activeTab, setActiveTab] = useState<'dados' | 'historico' | 'notas'>('dados')
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')

  if (!contact) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 p-6">
        Selecione um contato
      </div>
    )
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('pt-BR')
  const formatDateTime = (s: string) =>
    new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="h-full overflow-y-auto bg-zinc-900/30 border-l border-white/10">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar name={contact.nome || contact.telefone} size="lg" />
          <div>
            <h3 className="font-semibold text-white">
              {contact.nome || contact.telefone || 'Sem nome'}
            </h3>
            <p className="text-sm text-zinc-500">{contact.telefone}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="py-3">
            <span className="text-sm font-medium text-zinc-400">Status do lead</span>
          </CardHeader>
          <CardContent className="py-2">
            {onStatusChange ? (
              <select
                value={contact.status}
                onChange={(e) => onStatusChange(contact.id, e.target.value as ContactStatus)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-zinc-200 text-sm"
              >
                {(Object.keys(STATUS_LABELS) as ContactStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            ) : (
              <Badge variant={contact.status}>{STATUS_LABELS[contact.status]}</Badge>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Phone size={14} className="text-zinc-500 shrink-0" />
            {editingPhone && onPhoneChange ? (
              <>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="5511999999999"
                  className="flex-1 min-w-0 px-2 py-1 rounded bg-zinc-800 border border-white/10 text-zinc-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const v = phoneInput.replace(/\D/g, '').trim()
                    if (v.length >= 10) {
                      onPhoneChange(contact.id, v)
                      setEditingPhone(false)
                    }
                  }}
                  className="text-xs px-2 py-1 rounded bg-[#25D366] text-white hover:opacity-90"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingPhone(false); setPhoneInput(contact.telefone) }}
                  className="text-xs px-2 py-1 rounded bg-zinc-600 text-zinc-200 hover:opacity-90"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span className="text-zinc-300">{contact.telefone}</span>
                {onPhoneChange && (
                  <button
                    type="button"
                    onClick={() => { setPhoneInput(contact.telefone); setEditingPhone(true) }}
                    className="text-xs text-zinc-500 hover:text-[#25D366]"
                  >
                    Corrigir número
                  </button>
                )}
              </>
            )}
          </div>
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-zinc-500" />
              <span className="text-zinc-300">{contact.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-zinc-500" />
            <span className="text-zinc-500">Entrada: {formatDate(contact.data_primeiro_contato)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-zinc-500" />
            <span className="text-zinc-500">Última interação: {formatDateTime(contact.ultima_interacao)}</span>
          </div>
          {contact.origem && (
            <div className="flex items-center gap-2 text-sm">
              <Tag size={14} className="text-zinc-500" />
              <span className="text-zinc-500">Origem: {contact.origem}</span>
            </div>
          )}
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((t) => (
              <Badge key={t} className="text-xs">{t}</Badge>
            ))}
          </div>
        )}

        <div className="border-t border-white/10 pt-4">
          <div className="flex gap-2 border-b border-white/10 mb-3">
            {(['dados', 'historico', 'notas'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium capitalize ${
                  activeTab === tab ? 'text-[#25D366] border-b-2 border-[#25D366]' : 'text-zinc-500'
                }`}
              >
                {tab === 'dados' ? 'Dados' : tab === 'historico' ? 'Histórico' : 'Notas'}
              </button>
            ))}
          </div>
          {activeTab === 'notas' && onAddNote && (
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nova nota interna..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-white/10 text-zinc-200 text-sm resize-none h-20"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (note.trim()) {
                    onAddNote(contact.id, note.trim())
                    setNote('')
                  }
                }}
              >
                Adicionar nota
              </Button>
            </div>
          )}
          {activeTab === 'historico' && (
            <p className="text-sm text-zinc-500">Histórico de mensagens e gastos na conversa.</p>
          )}
        </div>
      </div>
    </div>
  )
}
