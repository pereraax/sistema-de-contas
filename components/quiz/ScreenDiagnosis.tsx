'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const SCORE = 72
const MAX = 100
const STROKE = 6
const R = 52
const C = 2 * Math.PI * R

type ScreenDiagnosisProps = {
  onNext: () => void
  answers: Record<string, string>
}

function scoreFromAnswers(answers: Record<string, string>): number {
  // Simples: base 60 + pequeno bônus por respostas “positivas”
  let s = 60
  if (answers.q1 === 'planilha' || answers.q1 === 'app') s += 8
  if (answers.q2 === 'nunca' || answers.q2 === 'as_vezes') s += 6
  if (answers.q3 === 'sim' || answers.q3 === 'algumas') s += 8
  return Math.min(100, Math.max(40, s))
}

export default function ScreenDiagnosis({ onNext, answers }: ScreenDiagnosisProps) {
  const score = scoreFromAnswers(answers)
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let start = 0
    const end = score
    const duration = 1200
    const startTime = Date.now()
    const tick = () => {
      const t = Math.min(1, (Date.now() - startTime) / duration)
      const eased = 1 - (1 - t) * (1 - t)
      setDisplayScore(Math.round(start + (end - start) * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [score])

  const offset = C - (displayScore / MAX) * C

  const diagnosisText =
    score >= 70
      ? 'Você já possui alguns hábitos financeiros positivos, mas ainda pode melhorar muito com organização automática.'
      : score >= 50
        ? 'Com a Plenipay você pode criar rotina de controle e evoluir seu score em poucas semanas.'
        : 'A Plenipay ajuda a criar o hábito de registrar gastos e acompanhar metas pelo WhatsApp.'

  return (
    <motion.section
      className="min-h-screen flex flex-col px-6 pt-24 pb-12"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-md mx-auto w-full text-center">
        <motion.h2
          className="text-xl font-bold text-[#1a1a1a] mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Seu Score Financeiro
        </motion.h2>
        <motion.div
          className="inline-flex items-center justify-center relative w-44 h-44 mx-auto mb-6"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              className="text-[#e5e7eb]"
            />
            <motion.circle
              cx="60"
              cy="60"
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
          <span className="absolute text-3xl font-bold text-[#1a1a1a]">
            {displayScore}
            <span className="text-lg font-medium text-[#666]"> / {MAX}</span>
          </span>
        </motion.div>
        <motion.p
          className="text-[#555] text-sm leading-relaxed mb-8 px-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {diagnosisText}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <button
            type="button"
            onClick={onNext}
            className="w-full py-4 rounded-2xl font-semibold text-white bg-[#1e4976] hover:bg-[#163a5f] active:scale-[0.98] transition-all"
          >
            Ver como economizar
          </button>
        </motion.div>
      </div>
    </motion.section>
  )
}
