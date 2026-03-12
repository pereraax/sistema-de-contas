'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Button } from '@/components/crm/ui/Button'
import { GitBranch, Plus } from 'lucide-react'

const TRIGGERS = [
  { id: 'nova_mensagem', label: 'Nova mensagem' },
  { id: 'novo_lead', label: 'Novo lead' },
  { id: 'cadastro_iniciado', label: 'Cadastro iniciado' },
  { id: 'cadastro_completo', label: 'Cadastro completo' },
]

const ACTIONS = [
  { id: 'enviar_mensagem', label: 'Enviar mensagem' },
  { id: 'pedir_email', label: 'Pedir e-mail' },
  { id: 'pedir_codigo', label: 'Pedir código' },
  { id: 'registrar_gasto', label: 'Registrar gasto' },
  { id: 'atribuir_tag', label: 'Atribuir tag' },
]

export default function CrmFluxosPage() {
  const [flows, setFlows] = useState<Array<{ id: string; nome: string; trigger: string; ativo: boolean }>>([])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fluxos</h1>
          <p className="text-zinc-500 text-sm mt-1">Automações estilo ManyChat / n8n</p>
        </div>
        <Button variant="primary">
          <Plus size={18} />
          Novo fluxo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Construtor visual</h2>
          <p className="text-sm text-zinc-500">Trigger → Condição → Ação</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Triggers</h3>
            <div className="flex flex-wrap gap-2">
              {TRIGGERS.map((t) => (
                <span
                  key={t.id}
                  className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm border border-white/10"
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Ações</h3>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <span
                  key={a.id}
                  className="px-3 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] text-sm border border-[#25D366]/20"
                >
                  {a.label}
                </span>
              ))}
            </div>
          </div>
          <div className="p-8 rounded-2xl border border-dashed border-white/20 text-center text-zinc-500">
            <GitBranch size={48} className="mx-auto mb-3 opacity-50" />
            <p>Arraste e solte para criar fluxos. Em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
