'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Inbox,
  MessageCircle,
  Users,
  LayoutGrid,
  GitBranch,
  FileText,
  Copy,
  Megaphone,
  BarChart3,
  Settings,
  ArrowLeft,
} from 'lucide-react'
const menuItems = [
  { href: '/administracaosecr/crm/inbox', label: 'Inbox', icon: Inbox },
  { href: '/administracaosecr/crm/conversas', label: 'Conversas (WhatsApp)', icon: MessageCircle },
  { href: '/administracaosecr/crm/contatos', label: 'Contatos', icon: Users },
  { href: '/administracaosecr/crm/leads', label: 'Leads', icon: Users },
  { href: '/administracaosecr/crm/kanban', label: 'Kanban', icon: LayoutGrid },
  { href: '/administracaosecr/crm/fluxos', label: 'Fluxos', icon: GitBranch },
  { href: '/administracaosecr/crm/mensagens', label: 'Mensagens', icon: FileText },
  { href: '/administracaosecr/crm/copys', label: 'Copys', icon: Copy },
  { href: '/administracaosecr/crm/campanhas', label: 'Campanhas', icon: Megaphone },
  { href: '/administracaosecr/crm/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/administracaosecr/crm/configuracoes', label: 'Configurações', icon: Settings },
]

export default function CrmDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-[calc(100vh-0.5rem)] max-h-[calc(100vh-0.5rem)] rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-zinc-900/95 border-r border-white/10">
        <div className="p-4 border-b border-white/10">
          <Link
            href="/administracaosecr/dashboard"
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao Admin
          </Link>
          <h2 className="mt-3 text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#25D366]/20 flex items-center justify-center">
              <MessageCircle size={18} className="text-[#25D366]" />
            </span>
            CRM WhatsApp
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/administracaosecr/crm/inbox' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#25D366]/15 text-[#25D366]'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      {/* Content: janela fixa (estilo WhatsApp Web) — sem scroll da página; cada rota gerencia scroll interno */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-zinc-950/50">
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  )
}
