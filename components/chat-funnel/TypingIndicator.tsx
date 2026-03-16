import { motion } from 'framer-motion'

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-slate-800 text-white px-4 py-3 shadow-sm border border-white/10">
        <div className="flex items-center gap-1.5">
          <Dot delay={0} />
          <Dot delay={0.15} />
          <Dot delay={0.3} />
          <span className="sr-only">Digitando...</span>
        </div>
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block h-2 w-2 rounded-full bg-white/80"
      initial={{ opacity: 0.3, y: 0 }}
      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
      transition={{ duration: 0.9, repeat: Infinity, delay }}
    />
  )
}

