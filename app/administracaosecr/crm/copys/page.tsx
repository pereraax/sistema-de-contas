'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/crm/ui/Card'
import { Button } from '@/components/crm/ui/Button'
import { Input } from '@/components/crm/ui/Input'
import { Plus, Search } from 'lucide-react'
import { COPY_CATEGORIES } from '@/lib/crm/constants'

export default function CrmCopysPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Copys</h1>
          <p className="text-zinc-500 text-sm mt-1">Biblioteca de copywriting</p>
        </div>
        <Button variant="primary">
          <Plus size={18} />
          Novo copy
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <Input
            placeholder="Buscar copys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300"
        >
          <option value="">Todas as categorias</option>
          {COPY_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Categorias</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {COPY_CATEGORIES.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800"
                >
                  <span className="text-white">{c.label}</span>
                  <span className="text-zinc-500 text-sm">0 copys</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
