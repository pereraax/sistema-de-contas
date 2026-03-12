'use client'

import {
  Play,
  MessageSquare,
  List,
  GitBranch,
  Bot,
  TrendingDown,
  TrendingUp,
  Clock,
  Bell,
  Webhook,
  Square,
} from 'lucide-react'
import type { FlowNodeType } from './FlowNode'

export interface BlockItem {
  type: FlowNodeType
  label: string
  icon: React.ReactNode
}

const BLOCKS: BlockItem[] = [
  { type: 'inicio', label: 'Início', icon: <Play size={18} /> },
  { type: 'mensagem', label: 'Mensagem', icon: <MessageSquare size={18} /> },
  { type: 'menu', label: 'Menu', icon: <List size={18} /> },
  { type: 'condicao', label: 'Condição', icon: <GitBranch size={18} /> },
  { type: 'ia', label: 'IA', icon: <Bot size={18} /> },
  { type: 'registrar_gasto', label: 'Registrar gasto', icon: <TrendingDown size={18} /> },
  { type: 'registrar_receita', label: 'Registrar receita', icon: <TrendingUp size={18} /> },
  { type: 'delay', label: 'Delay', icon: <Clock size={18} /> },
  { type: 'lembrete', label: 'Lembrete', icon: <Bell size={18} /> },
  { type: 'webhook', label: 'Webhook', icon: <Webhook size={18} /> },
  { type: 'fim', label: 'Fim', icon: <Square size={18} /> },
]

export function Sidebar({ onDragStart }: { onDragStart: (type: FlowNodeType, label: string) => void }) {
  return (
    <aside className="w-56 shrink-0 bg-zinc-900/95 border-r border-white/10 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Blocos</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Arraste para o canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {BLOCKS.map((block) => (
          <div
            key={block.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow', JSON.stringify({ type: block.type, label: block.label }))
              e.dataTransfer.effectAllowed = 'move'
              onDragStart(block.type, block.label)
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing hover:bg-white/10 hover:border-[#25D366]/40 transition-colors"
          >
            <span className="text-[#25D366]">{block.icon}</span>
            <span className="text-sm font-medium text-white">{block.label}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
