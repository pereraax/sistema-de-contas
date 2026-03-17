import { motion } from 'framer-motion'
import Image from 'next/image'
import mascot from '@/assets/mascot-CebL40u7.gif'

type HeroProps = {
  onStart: () => void
}

export function Hero({ onStart }: HeroProps) {
  return (
    <section className="relative min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square"
            >
              <Image
                src={mascot}
                alt="Mascote Plenipay"
                className="object-contain w-full h-full"
                priority
                unoptimized
              />
            </motion.div>
          </div>

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
        </motion.div>

        <div className="mt-7 space-y-3">
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
      </div>
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

