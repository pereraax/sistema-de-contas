import { motion } from 'framer-motion'

type QuestionOption = {
  value: string
  label: string
}

type QuestionProps = {
  title: string
  subtitle?: string
  options: QuestionOption[]
  onSelect: (value: string) => void
}

export function Question({ title, subtitle, options, onSelect }: QuestionProps) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-2">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-gray-300 max-w-md">{subtitle}</p>}
      </div>

      <div className="grid gap-3 sm:gap-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className="group w-full text-left px-4 sm:px-5 py-4 sm:py-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/60 transition-all duration-200 flex items-center justify-between gap-3"
          >
            <span className="text-sm sm:text-base text-white font-medium">{option.label}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs text-gray-300 group-hover:border-cyan-400/70 group-hover:text-cyan-200">
              Escolher
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

