'use client'

import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { GitBranch } from 'lucide-react'

/**
 * Construtor visual de fluxos (trigger → condição → ação).
 * Usado na página Fluxos; expansível para drag-and-drop.
 */
export function FlowBuilder() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-white">Construtor de fluxos</h2>
      </CardHeader>
      <CardContent>
        <div className="p-8 rounded-2xl border border-dashed border-white/20 text-center text-zinc-500">
          <GitBranch size={48} className="mx-auto mb-3 opacity-50" />
          <p>Arraste e solte: Trigger → Condição → Ação</p>
        </div>
      </CardContent>
    </Card>
  )
}
