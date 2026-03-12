'use client'

import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { BarChart3 } from 'lucide-react'

export default function CrmRelatoriosPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <p className="text-zinc-500 text-sm mt-1">Métricas e análises</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Em breve</h2>
        </CardHeader>
        <CardContent>
          <div className="p-12 rounded-2xl border border-dashed border-white/20 text-center text-zinc-500">
            <BarChart3 size={56} className="mx-auto mb-4 opacity-50" />
            <p>Gráficos de conversão, volume de mensagens e desempenho por período.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
