'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MESSAGES: { type: 'user' | 'assistant'; text: string; delay: number }[] = [
  { type: 'user', text: 'Café 12', delay: 400 },
  { type: 'assistant', text: 'Registrado!', delay: 800 },
  { type: 'assistant', text: 'Categoria: Alimentação', delay: 200 },
  { type: 'user', text: 'Uber 25', delay: 600 },
  { type: 'assistant', text: 'Registrado!', delay: 400 },
  { type: 'assistant', text: 'Categoria: Transporte', delay: 200 },
  { type: 'user', text: 'Mercado 180', delay: 600 },
  { type: 'assistant', text: 'Registrado!', delay: 400 },
  { type: 'assistant', text: 'Categoria: Alimentação', delay: 200 },
]

type ScreenWhatsAppSimProps = {
  onNext: () => void
}

export default function ScreenWhatsAppSim({ onNext }: ScreenWhatsAppSimProps) {
  const [shown, setShown] = useState<number>(0)
  const [autoNext, setAutoNext] = useState(false)

  useEffect(() => {
    if (shown >= MESSAGES.length) {
      const t = setTimeout(() => setAutoNext(true), 1200)
      return () => clearTimeout(t)
    }
    const next = MESSAGES[shown]
    const t = setTimeout(() => setShown((s) => s + 1), next.delay)
    return () => clearTimeout(t)
  }, [shown])

  return (
    <motion.section
      className="min-h-screen flex flex-col px-6 pt-24 pb-12"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <motion.p
          className="text-center text-[#666] mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Simulação de conversa no WhatsApp
        </motion.p>
        <div className="flex-1 rounded-3xl bg-[#e5ddd5] p-4 min-h-[320px] flex flex-col justify-end">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {MESSAGES.slice(0, shown).map((msg, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <span
                    className={`max-w-[85%] py-2.5 px-4 rounded-2xl text-sm ${
                      msg.type === 'user'
                        ? 'bg-[#dcf8c6] text-[#1a1a1a] rounded-br-md'
                        : 'bg-white text-[#1a1a1a] rounded-bl-md shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {(autoNext || shown >= MESSAGES.length) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <button
              type="button"
              onClick={onNext}
              className="py-3 px-6 rounded-2xl font-semibold text-white bg-[#1e4976] hover:bg-[#163a5f] active:scale-[0.98] transition-all"
            >
              Continuar
            </button>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}
