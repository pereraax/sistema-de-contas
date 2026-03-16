import { motion } from 'framer-motion'

type HeroProps = {
  onStart: () => void
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-[#0D1B2A]">
      {/* Fundo PleniPay (glow) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[520px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-48 -left-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px] rounded-[28px] bg-white shadow-2xl border border-white/10 overflow-hidden"
      >
        <div className="px-6 pt-10 pb-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-xs text-slate-500 italic"
          >
            A mesma tecnologia usada por gerentes de investimentos.
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-[22px] sm:text-2xl font-extrabold leading-tight text-[#0D1B2A]"
          >
            Economize{' '}
            <span className="text-[#007A99]">+ de 400 Reais</span> Em{' '}
            <span className="text-[#007A99]">30 Dias</span> sem cortar os &quot;Luxos&quot; e
            apenas com o WhatsApp.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-sm text-slate-600"
          >
            Não é aplicativo, nem planilha, nem Notion.
            <br />
            <span className="font-semibold text-slate-700">É inteligência artificial de ponta.</span>
          </motion.p>
        </div>

        <div className="px-6 pb-7 space-y-3">
          <FeatureCard
            delay={0.24}
            title="Pra onde tá indo seu dinheiro?"
            text="Você trabalha o mês inteiro, mas não faz ideia de onde foi parar seu dinheiro suado."
          />
          <FeatureCard
            delay={0.3}
            title="Sem planilhas ou apps"
            text="Tudo isso é complicado, dá muita preguiça de usar. Aqui você resolve direto no WhatsApp."
          />
          <FeatureCard
            delay={0.36}
            title="Perdido nas dívidas?"
            text="Não sabe quanto paga de parcela, quanto tempo falta, quem deve, e não tem um plano para pagar."
          />
          <FeatureCard
            delay={0.42}
            title="Você paga mais caro sempre!"
            text="Faz compras por impulso ou não pesquisa antes? Você está gastando mais e deixando de poupar."
          />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pt-4"
          >
            <button
              type="button"
              onClick={onStart}
              className="w-full rounded-2xl py-4 text-base font-bold text-white bg-[#0B4BFF] shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
            >
              Continuar
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

function FeatureCard({
  title,
  text,
  delay,
}: {
  title: string
  text: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-emerald-50/60 px-5 py-4 shadow-sm"
    >
      <div className="text-sm font-extrabold text-[#0D1B2A] text-center">{title}</div>
      <div className="mt-2 text-[13px] leading-relaxed text-slate-700 text-center">{text}</div>
    </motion.div>
  )
}

