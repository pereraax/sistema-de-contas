'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/crm/ui/Button'
import { Input } from '@/components/crm/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Plus, Copy, Pencil, Trash2 } from 'lucide-react'
import { DYNAMIC_VARIABLES } from '@/lib/crm/constants'

interface Template {
  id: string
  titulo: string
  conteudo: string
  categoria: string
}

interface MessageTemplatesProps {
  onInsertTemplate?: (text: string) => void
}

export function MessageTemplates({ onInsertTemplate }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/crm/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Mensagens prontas</h3>
        <Button size="sm" variant="secondary">
          <Plus size={16} />
          Nova mensagem
        </Button>
      </div>
      <p className="text-xs text-zinc-500">
        Variáveis: {DYNAMIC_VARIABLES.map((v) => v.key).join(', ')}
      </p>
      {loading ? (
        <p className="text-sm text-zinc-500">Carregando...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum template. Crie um em Mensagens.</p>
      ) : (
        <div className="grid gap-2 max-h-48 overflow-y-auto">
          {templates.map((t) => (
            <Card key={t.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white text-sm">{t.titulo}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{t.conteudo}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {onInsertTemplate && (
                    <button
                      type="button"
                      onClick={() => onInsertTemplate(t.conteudo)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400"
                      title="Inserir"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
