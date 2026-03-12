'use client'

import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Button } from '@/components/crm/ui/Button'
import { Megaphone, Plus } from 'lucide-react'

/**
 * Gerenciador de campanhas: selecionar contatos, mensagem, agendar, limite/min.
 */
export function CampaignManager() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Campanhas</h2>
        <Button size="sm" variant="primary">
          <Plus size={16} />
          Nova campanha
        </Button>
      </CardHeader>
      <CardContent>
        <div className="p-8 rounded-2xl border border-dashed border-white/20 text-center text-zinc-500">
          <Megaphone size={48} className="mx-auto mb-3 opacity-50" />
          <p>Selecione contatos, mensagem, agende e defina limite de disparos por minuto.</p>
        </div>
      </CardContent>
    </Card>
  )
}
