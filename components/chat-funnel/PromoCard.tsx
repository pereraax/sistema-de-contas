import { motion } from 'framer-motion'

export function PromoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-600">Oferta encontrada</div>
          <div className="text-base font-bold text-slate-900 mt-1">Plano Premium com 7 dias grátis</div>
          <div className="text-xs text-slate-600 mt-1">
            Automação + relatórios + metas em um só lugar.
          </div>
        </div>
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-md" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">R$ 49,90/mês</div>
        <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
          -20% hoje
        </div>
      </div>
    </motion.div>
  )
}

