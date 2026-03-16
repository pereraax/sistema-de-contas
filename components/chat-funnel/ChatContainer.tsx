import { motion } from 'framer-motion'

type ChatContainerProps = {
  children: React.ReactNode
}

export function ChatContainer({ children }: ChatContainerProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] rounded-[28px] bg-slate-50 shadow-2xl border border-white/10 overflow-hidden"
      >
        {/* “Barra” do topo estilo app */}
        <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500" />
            <div>
              <div className="text-sm font-semibold text-slate-900 leading-none">PLEN</div>
              <div className="text-[11px] text-slate-500 leading-none mt-1">online</div>
            </div>
          </div>
          <div className="text-[11px] font-medium text-slate-500">simulação</div>
        </div>

        {children}
      </motion.div>
    </div>
  )
}

