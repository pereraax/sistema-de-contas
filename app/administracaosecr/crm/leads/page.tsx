'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Input } from '@/components/crm/ui/Input'
import { Badge } from '@/components/crm/ui/Badge'
import { Search, MessageCircle } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/crm/constants'
import type { ContactStatus } from '@/lib/crm/constants'

interface Lead {
  id: string
  telefone: string
  nome: string | null
  email: string | null
  status: ContactStatus
  origem: string | null
  data_primeiro_contato: string
  ultima_interacao: string
}

export default function CrmLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/crm/contacts')
      .then((res) => res.json())
      .then((data) => setLeads(data.contacts ?? []))
      .catch(console.error)
  }, [])

  const filtered = leads.filter(
    (l) =>
      !search.trim() ||
      (l.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.telefone || '').includes(search) ||
      (l.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        <p className="text-zinc-500 text-sm mt-1">Todos os contatos e leads</p>
        <p className="text-zinc-500 text-sm mt-2 flex items-center gap-2">
          <MessageCircle size={16} className="text-[#25D366]" />
          Para ver e responder as conversas ao vivo do WhatsApp, use{' '}
          <Link href="/administracaosecr/crm/conversas" className="text-[#25D366] hover:underline font-medium">
            Conversas
          </Link>
          .
        </p>
      </div>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <Input
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Lista de leads ({filtered.length})</h2>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-white/5">
            {filtered.map((lead) => (
              <li
                key={lead.id}
                className="flex items-center justify-between gap-4 p-4 hover:bg-white/[0.02]"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{lead.nome || lead.telefone || 'Sem nome'}</p>
                  <p className="text-sm text-zinc-500">{lead.telefone}</p>
                  {lead.email && <p className="text-xs text-zinc-500">{lead.email}</p>}
                </div>
                <Badge variant={lead.status}>{STATUS_LABELS[lead.status]}</Badge>
                <p className="text-xs text-zinc-500 shrink-0">
                  {new Date(lead.ultima_interacao).toLocaleDateString('pt-BR')}
                </p>
                <Link
                  href={`/administracaosecr/crm/conversas?contact=${lead.id}`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 text-sm font-medium"
                >
                  <MessageCircle size={16} />
                  Ver conversa
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
