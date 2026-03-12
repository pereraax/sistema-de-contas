'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Button } from '@/components/crm/ui/Button'
import { Input } from '@/components/crm/ui/Input'
import { Plus, Pencil, Copy, Trash2 } from 'lucide-react'
import { DYNAMIC_VARIABLES } from '@/lib/crm/constants'

interface Template {
  id: string
  titulo: string
  conteudo: string
  categoria: string
}

export default function CrmMensagensPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/crm/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mensagens</h1>
          <p className="text-zinc-500 text-sm mt-1">Templates com variáveis dinâmicas</p>
        </div>
        <Button variant="primary">
          <Plus size={18} />
          Nova mensagem
        </Button>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-zinc-800/50 border border-white/10">
        <p className="text-sm text-zinc-400">
          Variáveis: {DYNAMIC_VARIABLES.map((v) => (
            <code key={v.key} className="mx-1 px-1.5 py-0.5 rounded bg-white/10">{v.key}</code>
          ))}
        </p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-zinc-500">Carregando...</p>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-zinc-500">
              Nenhum template. Crie sua primeira mensagem pronta.
            </CardContent>
          </Card>
        ) : (
          templates.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="font-semibold text-white">{t.titulo}</h3>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400">
                    <Pencil size={16} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-zinc-400">
                    <Copy size={16} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-500/20 text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-400 whitespace-pre-wrap">{t.conteudo}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded bg-white/10 text-xs text-zinc-500">
                  {t.categoria}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
