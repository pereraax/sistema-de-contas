import { motion } from 'framer-motion'

type ProgressBarProps = {
  currentStep: number
  totalSteps: number
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = Math.min(100, Math.max(0, ((currentStep + 1) / totalSteps) * 100))

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
        <span>
          Pergunta {currentStep + 1} de {totalSteps}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

