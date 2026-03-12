'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Avatar } from '@/components/crm/ui/Avatar'
import { KANBAN_COLUMNS, STATUS_LABELS } from '@/lib/crm/constants'
import type { ContactStatus } from '@/lib/crm/constants'

export interface LeadCard {
  id: string
  nome: string | null
  telefone: string
  data: string
  origem: string
  status: ContactStatus
}

interface LeadKanbanProps {
  leads: LeadCard[]
  onStatusChange?: (leadId: string, newStatus: ContactStatus) => void
}

export function LeadKanban({ leads, onStatusChange }: LeadKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const formatDate = (s: string) => new Date(s).toLocaleDateString('pt-BR')

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = (e: React.DragEvent, columnStatus: ContactStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id && onStatusChange) onStatusChange(id, columnStatus)
    setDraggedId(null)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {KANBAN_COLUMNS.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status)
        return (
          <div
            key={status}
            className="rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden min-w-0"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="p-3 border-b border-white/10 bg-zinc-800/50">
              <h3 className="text-sm font-semibold text-white">{STATUS_LABELS[status]}</h3>
              <p className="text-xs text-zinc-500">{columnLeads.length} leads</p>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable={!!onStatusChange}
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className={`p-3 rounded-xl bg-zinc-800/80 border border-white/5 cursor-grab active:cursor-grabbing ${
                    draggedId === lead.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={lead.nome || lead.telefone} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-sm truncate">
                        {lead.nome || lead.telefone || 'Sem nome'}
                      </p>
                      <p className="text-xs text-zinc-500">{lead.telefone}</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">{formatDate(lead.data)}</p>
                  <p className="text-xs text-zinc-500">Origem: {lead.origem || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
