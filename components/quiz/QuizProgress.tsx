'use client'

import { motion } from 'framer-motion'

const TOTAL_STEPS = 10 // Hero + 3 perguntas + WhatsApp + Relatório + Metas + Diagnóstico + Simulação + Oferta

type QuizProgressProps = {
  step: number
  total?: number
}

export default function QuizProgress({ step, total = TOTAL_STEPS }: QuizProgressProps) {
  const progress = Math.min(step / total, 1)

  return (
    <div
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2 bg-white border-b border-[#eee]"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
      <div className="max-w-md mx-auto">
        <p className="text-xs font-medium text-[#666] mb-1.5 text-center">
          {step} de {total}
        </p>
        <div className="h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[#1e4976]"
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
            style={{ originX: 0 }}
          />
        </div>
      </div>
    </div>
  )
}
