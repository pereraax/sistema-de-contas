'use client'

import { MessageSquare, GitBranch, Copy, LayoutGrid, Megaphone, Tag, BarChart3 } from 'lucide-react'

export type ToolbarPanel = 'mensagens' | 'fluxos' | 'copys' | 'kanban' | 'campanhas' | 'tags' | 'relatorios' | null

const TOOLS: { id: ToolbarPanel; label: string; icon: React.ElementType }[] = [
  { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
  { id: 'fluxos', label: 'Fluxos', icon: GitBranch },
  { id: 'copys', label: 'Copys', icon: Copy },
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'campanhas', label: 'Campanhas', icon: Megaphone },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
]

interface TopToolbarProps {
  activePanel: ToolbarPanel
  onPanelChange: (panel: ToolbarPanel) => void
}

export function TopToolbar({ activePanel, onPanelChange }: TopToolbarProps) {
  return (
    <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-zinc-900/80">
      {TOOLS.map((tool) => {
        const Icon = tool.icon
        const isActive = activePanel === tool.id
        return (
          <button
            key={tool.id || 'x'}
            type="button"
            onClick={() => onPanelChange(isActive ? null : tool.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-[#25D366]/20 text-[#25D366]'
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
            title={tool.label}
          >
            <Icon size={18} />
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        )
      })}
    </div>
  )
}
