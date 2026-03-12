'use client'

import { motion } from 'framer-motion'

export type QuestionOption = { id: string; label: string }

type ScreenQuestionProps = {
  question: string
  options: QuestionOption[]
  onSelect: (id: string) => void
}

export default function ScreenQuestion({ question, options, onSelect }: ScreenQuestionProps) {
  return (
    <motion.section
      className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-12"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-md mx-auto w-full">
        <motion.h2
          className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {question}
        </motion.h2>
        <ul className="space-y-3">
          {options.map((opt, i) => (
            <motion.li
              key={opt.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <button
                type="button"
                onClick={() => onSelect(opt.id)}
                className="w-full py-4 px-5 rounded-2xl text-left font-medium text-[#1a1a1a] bg-white border border-[#e5e5e5] shadow-sm hover:border-[#1e4976] hover:shadow-md active:scale-[0.99] transition-all"
              >
                {opt.label}
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.section>
  )
}
