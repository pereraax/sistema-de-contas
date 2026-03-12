'use client'

import { useState, useEffect } from 'react'
import { LeadKanban } from '@/components/crm/LeadKanban'
import type { LeadCard } from '@/components/crm/LeadKanban'
import type { ContactStatus } from '@/lib/crm/constants'

export default function CrmKanbanPage() {
  const [leads, setLeads] = useState<LeadCard[]>([])

  useEffect(() => {
    fetch('/api/admin/crm/contacts')
      .then((res) => res.json())
      .then((data) => {
        const list = (data.contacts ?? []).map((c: any) => ({
          id: c.id,
          nome: c.nome,
          telefone: c.telefone,
          data: c.data_primeiro_contato || c.created_at,
          origem: c.origem || 'whatsapp',
          status: c.status,
        }))
        setLeads(list)
      })
      .catch(console.error)
  }, [])

  const handleStatusChange = async (leadId: string, newStatus: ContactStatus) => {
    await fetch(`/api/admin/crm/contacts/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Kanban</h1>
        <p className="text-zinc-500 text-sm mt-1">Arraste os cards para alterar o status do lead</p>
      </div>
      <LeadKanban leads={leads} onStatusChange={handleStatusChange} />
    </div>
  )
}
