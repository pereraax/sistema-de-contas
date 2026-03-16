import { motion } from 'framer-motion'

type HeroProps = {
  onStart: () => void
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Glow de fundo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[11px] font-medium tracking-[0.18em] uppercase text-cyan-200 mb-4">
            Diagnóstico rápido • em menos de 30s
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-4">
            Descubra em 30 segundos o que está travando seus resultados.
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-xl mx-auto">
            Responda algumas perguntas rápidas e receba um diagnóstico personalizado sobre o maior gargalo hoje no seu negócio.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 px-7 py-3.5 text-sm sm:text-base font-semibold text-slate-950 shadow-xl shadow-cyan-500/30 hover:brightness-110 hover:shadow-2xl active:scale-[0.98] transition-all"
          >
            Começar diagnóstico agora
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-900/90">
              30s
            </span>
          </button>

          <p className="text-[11px] sm:text-xs text-gray-400">
            Sem compromisso • Diagnóstico 100% gratuito
          </p>
        </motion.div>
      </div>
    </section>
  )
}

