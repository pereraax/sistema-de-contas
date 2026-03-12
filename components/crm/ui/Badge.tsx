'use client'

const statusColors: Record<string, string> = {
  novo_lead: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  aguardando_email: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  aguardando_codigo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  usuario_ativo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cliente_pago: 'bg-green-600/20 text-green-400 border-green-500/30',
  inativo: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode
  variant?: keyof typeof statusColors | 'default'
  className?: string
}) {
  const style = variant === 'default' ? 'bg-white/10 text-zinc-300 border-white/10' : statusColors[variant] || statusColors.inativo
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${style} ${className}`}
    >
      {children}
    </span>
  )
}
