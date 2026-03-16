import { motion } from 'framer-motion'
import { Play } from 'lucide-react'

type HowItWorksProps = {
  onDemo: () => void
}

export function HowItWorks({ onDemo }: HowItWorksProps) {
  return (
    <section className="relative min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl sm:text-3xl font-extrabold text-[#0D1B2A]"
          >
            Como funciona?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-slate-600 leading-relaxed"
          >
            Um assistente financeiro disponível no seu WhatsApp, 24h por dia, para você ter um
            controle financeiro mais rápido e inteligente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 inline-flex items-center justify-center"
          >
            <span className="rounded-full bg-[#0B4BFF] px-4 py-2 text-white text-sm font-semibold shadow-sm">
              Demonstração
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl font-extrabold text-[#0B4BFF] leading-none">1.</div>
            <div className="text-left">
              <p className="text-base text-slate-700 leading-relaxed">
                Digite o que comprou e quanto gastou, por exemplo{' '}
                <span className="font-extrabold text-[#0D1B2A]">&quot;Camisa 110&quot;</span>.
              </p>
              <p className="mt-4 text-sm text-slate-600">Registre um gasto para testar.</p>
              <p className="mt-6 text-xs text-slate-500 italic">
                (Não se preocupe com vírgulas ou com R$, escreva do seu jeito)
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            <button
              type="button"
              onClick={onDemo}
              className="w-full rounded-full py-4 px-5 text-base font-semibold text-white bg-emerald-600 shadow-lg hover:bg-emerald-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Play size={18} />
              </span>
              Camisa 110
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

