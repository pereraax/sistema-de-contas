import { motion } from 'framer-motion'

export type MessageFrom = 'user' | 'ai'

type MessageBubbleProps = {
  from: MessageFrom
  children: React.ReactNode
}

export function MessageBubble({ from, children }: MessageBubbleProps) {
  const isUser = from === 'user'

  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <motion.div
        initial={{ opacity: 0, y: 10, x: isUser ? 10 : -10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className={[
          'max-w-[84%] rounded-2xl px-4 py-3 shadow-sm border',
          isUser
            ? 'rounded-tr-md bg-emerald-700 text-white border-emerald-500/30'
            : 'rounded-tl-md bg-slate-800 text-white border-white/10',
        ].join(' ')}
      >
        <div className="text-sm leading-relaxed whitespace-pre-line">{children}</div>
      </motion.div>
    </div>
  )
}

