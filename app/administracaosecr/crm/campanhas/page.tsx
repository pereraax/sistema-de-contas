'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Button } from '@/components/crm/ui/Button'
import { Input } from '@/components/crm/ui/Input'
import { Megaphone, Plus } from 'lucide-react'

export default function CrmCampanhasPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas</h1>
          <p className="text-zinc-500 text-sm mt-1">Envio em massa com agendamento e limite por minuto</p>
        </div>
        <Button variant="primary">
          <Plus size={18} />
          Nova campanha
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-zinc-500">Mensagens enviadas</p>
            <p className="text-2xl font-bold text-white">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-zinc-500">Entregues</p>
            <p className="text-2xl font-bold text-white">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-zinc-500">Respondidas</p>
            <p className="text-2xl font-bold text-white">0</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Suas campanhas</h2>
        </CardHeader>
        <CardContent>
          <div className="p-8 rounded-2xl border border-dashed border-white/20 text-center text-zinc-500">
            <Megaphone size={48} className="mx-auto mb-3 opacity-50" />
            <p>Nenhuma campanha. Crie uma para selecionar contatos, mensagem e agendar envio.</p>
            <p className="text-sm mt-1">Defina limite de disparos por minuto para evitar bloqueios.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
