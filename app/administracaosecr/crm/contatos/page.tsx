'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Input } from '@/components/crm/ui/Input'
import { Badge } from '@/components/crm/ui/Badge'
import { Search, MessageCircle, Download } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/crm/constants'
import type { ContactStatus } from '@/lib/crm/constants'

interface ContactRow {
  id: string
  telefone: string
  nome: string | null
  email: string | null
  status: ContactStatus
  origem: string | null
  data_primeiro_contato: string
  ultima_interacao: string
}

function toCSV(rows: ContactRow[]): string {
  const header = ['nome', 'telefone', 'origem', 'data_primeiro_contato', 'ultima_interacao', 'status']
  const escape = (v: string | null | undefined) => {
    if (v == null) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push(
      [
        escape(r.nome),
        escape(r.telefone),
        escape(r.origem),
        escape(r.data_primeiro_contato),
        escape(r.ultima_interacao),
        escape(r.status),
      ].join(',')
    )
  }
  return lines.join('\n')
}

export default function CrmContatosPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/crm/contacts?order=chegada&limit=500')
      .then((res) => res.json())
      .then((data) => setContacts(data.contacts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = contacts.filter(
    (c) =>
      !search.trim() ||
      (c.nome || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.telefone || '').includes(search) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.origem || '').toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    const csv = toCSV(filtered)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contatos-crm-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (s: string) => (s ? new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Contatos</h1>
        <p className="text-zinc-500 text-sm mt-1">Todos os contatos por ordem de chegada (nome, telefone, origem, data, status)</p>
        <p className="text-zinc-500 text-sm mt-2 flex items-center gap-2">
          <MessageCircle size={16} className="text-[#25D366]" />
          Para conversas ao vivo, use{' '}
          <Link href="/administracaosecr/crm/conversas" className="text-[#25D366] hover:underline font-medium">
            Conversas
          </Link>
          .
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input
            placeholder="Buscar por nome, telefone, e-mail ou origem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 font-medium text-sm"
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Lista de contatos ({filtered.length})</h2>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-zinc-500">Carregando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-zinc-500">
                    <th className="p-3 font-medium">Nome</th>
                    <th className="p-3 font-medium">Telefone</th>
                    <th className="p-3 font-medium">Origem</th>
                    <th className="p-3 font-medium">Data</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-3 text-white">{c.nome || '—'}</td>
                      <td className="p-3 text-zinc-300">{c.telefone}</td>
                      <td className="p-3">
                        <span className="text-zinc-400">{c.origem || 'whatsapp'}</span>
                      </td>
                      <td className="p-3 text-zinc-500">{formatDate(c.data_primeiro_contato)}</td>
                      <td className="p-3">
                        <Badge variant={c.status === 'usuario_ativo' ? 'success' : 'secondary'}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/administracaosecr/crm/conversas?contact=${c.id}`}
                          className="text-[#25D366] hover:underline"
                        >
                          Conversa
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="p-6 text-zinc-500">Nenhum contato encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
