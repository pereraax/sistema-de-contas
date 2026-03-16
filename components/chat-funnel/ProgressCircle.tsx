import { motion } from 'framer-motion'

type ProgressCircleProps = {
  label: string
  percent: number
}

export function ProgressCircle({ label, percent }: ProgressCircleProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const stroke = 10
  const r = 46
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c

  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm">
      <div className="text-xs font-semibold text-slate-600 mb-3">{label}</div>
      <div className="flex items-center gap-4">
        <div className="relative h-28 w-28">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="rgba(148,163,184,0.35)"
              strokeWidth={stroke}
            />
            <motion.circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="rgba(56,189,248,0.95)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{clamped}%</div>
              <div className="text-[10px] text-slate-500">progresso</div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900 mb-1">Meta: iPhone 16</div>
          <div className="text-xs text-slate-500 mb-3">R$ 5.399,00</div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${clamped}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

