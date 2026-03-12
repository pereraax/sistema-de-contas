'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import confetti from 'canvas-confetti'

const PLANOS = [
  { name: 'Plano Gratuito', price: 'R$0', period: '', recommended: false },
  { name: 'Plano Básico', price: 'R$9,90', period: '/ mês', recommended: true },
  { name: 'Plano Premium', price: 'R$49,90', period: '/ mês', recommended: false },
  { name: 'Plano Anual', price: 'R$197', period: '/ ano', recommended: false },
]

type ScreenFinalOfferProps = {
  onConfetti?: () => void
}

export default function ScreenFinalOffer({ onConfetti }: ScreenFinalOfferProps) {
  const confettiFired = useRef(false)

  useEffect(() => {
    if (confettiFired.current) return
    confettiFired.current = true
    const duration = 2500
    const end = Date.now() + duration
    const colors = ['#1e4976', '#163a5f', '#2c5aa0', '#fff']

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0.2, y: 0.8 },
        colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 0.8, y: 0.8 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    const t = setTimeout(frame, 400)
    onConfetti?.()
    return () => clearTimeout(t)
  }, [onConfetti])

  return (
    <motion.section
      className="min-h-screen flex flex-col px-6 pt-24 pb-16"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-md mx-auto w-full">
        <motion.h2
          className="text-xl font-bold text-[#1a1a1a] mb-2 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Comece agora
        </motion.h2>
        <motion.p
          className="text-[#666] text-sm text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Escolha o plano ideal para você
        </motion.p>
        <div className="space-y-3 mb-8">
          {PLANOS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className={`rounded-2xl border-2 p-4 ${
                p.recommended
                  ? 'border-[#1e4976] bg-[#1e4976]/10'
                  : 'border-[#e5e5e5] bg-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-[#1a1a1a]">{p.name}</span>
                  {p.recommended && (
                    <span className="ml-2 text-xs font-medium text-[#1e4976] bg-[#1e4976]/20 px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#1a1a1a]">{p.price}</span>
                  <span className="text-sm text-[#666]">{p.period}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/cadastro"
            className="block w-full py-4 rounded-2xl font-semibold text-center text-white bg-[#1e4976] hover:bg-[#163a5f] active:scale-[0.98] transition-all text-lg shadow-lg shadow-[#1e4976]/30"
          >
            Começar agora
          </Link>
        </motion.div>
      </div>
    </motion.section>
  )
}
