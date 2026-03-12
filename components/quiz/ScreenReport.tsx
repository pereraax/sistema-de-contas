'use client'

import { motion } from 'framer-motion'
import { AnimatedCounter } from './AnimatedCounter'

const CATEGORIES = [
  { name: 'Alimentação', value: 192, color: '#1e4976' },
  { name: 'Transporte', value: 25, color: '#2c5aa0' },
  { name: 'Outros', value: 270, color: '#64748b' },
]

const receitas = 2000
const despesas = 487
const saldo = receitas - despesas

type ScreenReportProps = {
  onNext: () => void
}

export default function ScreenReport({ onNext }: ScreenReportProps) {
  const maxCat = Math.max(...CATEGORIES.map((c) => c.value))

  return (
    <motion.section
      className="min-h-screen flex flex-col px-6 pt-24 pb-12"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-md mx-auto w-full">
        <motion.h2
          className="text-xl font-bold text-[#1a1a1a] mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Relatório automático
        </motion.h2>
        <div className="rounded-2xl bg-white shadow-lg border border-[#eee] p-5 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-between items-center"
          >
            <span className="text-[#666]">Receitas</span>
            <span className="font-semibold text-green-600">
              <AnimatedCounter value={receitas} prefix="R$" delay={0.3} />
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex justify-between items-center"
          >
            <span className="text-[#666]">Despesas</span>
            <span className="font-semibold text-red-600">
              <AnimatedCounter value={despesas} prefix="R$" delay={0.45} />
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-between items-center pt-3 border-t border-[#eee]"
          >
            <span className="font-medium text-[#1a1a1a]">Saldo</span>
            <span className="font-bold text-lg text-[#1e4976]">
              <AnimatedCounter value={saldo} prefix="R$" delay={0.6} />
            </span>
          </motion.div>
        </div>
        <motion.p
          className="text-sm text-[#666] mt-4 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Por categoria
        </motion.p>
        <div className="space-y-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#1a1a1a]">{cat.name}</span>
                <span className="text-[#666]">R$ {cat.value}</span>
              </div>
              <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(cat.value / maxCat) * 100}%` }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.6 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mt-8"
        >
          <button
            type="button"
            onClick={onNext}
            className="w-full py-4 rounded-2xl font-semibold text-white bg-[#1e4976] hover:bg-[#163a5f] active:scale-[0.98] transition-all"
          >
            Continuar
          </button>
        </motion.div>
      </div>
    </motion.section>
  )
}
