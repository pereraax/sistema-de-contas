'use client'

import { motion } from 'framer-motion'

type ScreenHeroProps = {
  onStart: () => void
}

export default function ScreenHero({ onStart }: ScreenHeroProps) {
  return (
    <motion.section
      className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-md mx-auto w-full text-center">
        <motion.h1
          className="text-2xl sm:text-3xl font-bold text-[#1a1a1a] leading-tight mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Descubra em 1 minuto como melhorar sua vida financeira
        </motion.h1>
        <motion.p
          className="text-base text-[#555] mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          A Plenipay pode organizar suas finanças diretamente pelo WhatsApp.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <button
            type="button"
            onClick={onStart}
            className="w-full max-w-sm mx-auto py-4 px-6 rounded-2xl font-semibold text-white bg-[#1e4976] hover:bg-[#163a5f] active:scale-[0.98] transition-all shadow-lg shadow-[#1e4976]/30 text-lg"
          >
            Começar diagnóstico
          </button>
        </motion.div>
      </div>
    </motion.section>
  )
}
