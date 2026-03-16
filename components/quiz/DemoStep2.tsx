'use client'

import { motion } from 'framer-motion'
import { Send } from 'lucide-react'

type DemoStep2Props = {
  onContinue: () => void
}

export function DemoStep2({ onContinue }: DemoStep2Props) {
  return (
    <section className="relative min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <span className="inline-block rounded-full bg-[#0B4BFF] px-4 py-2 text-white text-sm font-semibold shadow-sm">
            Demonstração
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start gap-4"
        >
          <div className="text-4xl font-extrabold text-[#0B4BFF] leading-none">2.</div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0D1B2A] leading-tight">
              Você pode perguntar <span className="text-[#0B4BFF]">TUDO SOBRE SUAS FINANÇAS.</span>
            </h2>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-slate-600 leading-relaxed"
        >
          Exemplo: Digamos que você quer ver quanto gastou nos últimos 7 dias:
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex justify-center"
        >
          <div className="w-full max-w-md rounded-2xl rounded-tr-md bg-emerald-600 px-5 py-4 shadow-lg flex items-center gap-3 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 flex-shrink-0">
              <Send size={18} />
            </span>
            <span className="text-base font-semibold">
              Quanto eu gastei nos últimos 7 dias?
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12"
        >
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-2xl py-4 text-base font-bold text-white bg-[#0B4BFF] shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
          >
            Continuar
          </button>
        </motion.div>
      </div>
    </section>
  )
}
