'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const GOAL_PERCENT = 68
const STROKE = 8
const R = 56
const C = 2 * Math.PI * R
const OFFSET = C - (GOAL_PERCENT / 100) * C

type ScreenGoalsCircleProps = {
  onNext: () => void
}

export default function ScreenGoalsCircle({ onNext }: ScreenGoalsCircleProps) {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setPercent(GOAL_PERCENT), 200)
    return () => clearTimeout(t)
  }, [])

  const offset = C - (percent / 100) * C

  return (
    <motion.section
      className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-12"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-md mx-auto w-full text-center">
        <motion.h2
          className="text-xl font-bold text-[#1a1a1a] mb-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Metas financeiras
        </motion.h2>
        <motion.p
          className="text-[#666] mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Meta: Viagem
        </motion.p>
        <motion.div
          className="inline-flex items-center justify-center relative w-40 h-40 mx-auto mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              className="text-[#e5e7eb]"
            />
            <motion.circle
              cx="64"
              cy="64"
              r={R}
              fill="none"
              stroke="#1e4976"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="absolute text-2xl font-bold text-[#1a1a1a]">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {percent}%
            </motion.span>
          </span>
        </motion.div>
        <motion.p
          className="text-[#666] text-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Progresso
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <button
            type="button"
            onClick={onNext}
            className="w-full max-w-sm mx-auto py-4 rounded-2xl font-semibold text-white bg-[#1e4976] hover:bg-[#163a5f] active:scale-[0.98] transition-all"
          >
            Continuar
          </button>
        </motion.div>
      </div>
    </motion.section>
  )
}
