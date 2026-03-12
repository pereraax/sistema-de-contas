'use client'

import { motion } from 'framer-motion'
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts'

const DATA = [
  { month: 'Mês 1', value: 400 },
  { month: 'Mês 2', value: 980 },
  { month: 'Mês 3', value: 1520 },
  { month: 'Mês 4', value: 2180 },
  { month: 'Mês 5', value: 2850 },
  { month: 'Mês 6', value: 3500 },
]

type ScreenSavingsProps = {
  onNext: () => void
}

export default function ScreenSavings({ onNext }: ScreenSavingsProps) {
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
          className="text-xl font-bold text-[#1a1a1a] mb-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Simulação de economia
        </motion.h2>
        <motion.p
          className="text-[#666] text-sm mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Usuários da Plenipay economizam em média R$3.500 em 6 meses.
        </motion.p>
        <motion.div
          className="h-56 rounded-2xl bg-white p-4 shadow-lg border border-[#eee]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DATA} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="quizSavingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e4976" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1e4976" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#666' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#666' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
                width={45}
              />
              <Tooltip
                formatter={(value: number) => [`R$ ${value}`, 'Economia']}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #eee',
                  fontSize: 12,
                }}
                labelStyle={{ color: '#1a1a1a' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1e4976"
                strokeWidth={2.5}
                fill="url(#quizSavingsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <button
            type="button"
            onClick={onNext}
            className="w-full py-4 rounded-2xl font-semibold text-white bg-[#1e4976] hover:bg-[#163a5f] active:scale-[0.98] transition-all"
          >
            Ver planos Plenipay
          </button>
        </motion.div>
      </div>
    </motion.section>
  )
}
