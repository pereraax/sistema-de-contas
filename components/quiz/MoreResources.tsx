'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

type MoreResourcesProps = {
  onContinue: () => void
}

const FEATURES = [
  {
    title: 'Categorias Automáticas',
    description:
      'Você não precisa criar nada. A IA identifica e organiza todos os seus gastos sozinha.',
  },
  {
    title: 'Sugestões Inteligentes',
    description:
      'Acompanhe dicas como: "Você está gastando mais em lazer este mês. Fique de olho."',
  },
  {
    title: 'Análise De Compras',
    description:
      'Diga o que quer comprar e a IA analisa seu perfil e te diz: parcelar, esperar ou pagar à vista.',
  },
  {
    title: 'Pare De Só Economizar',
    description:
      'Participe dos nossos desafios com recompensas onde você pode ganhar até R$ 4.000 / mês.',
  },
]

export function MoreResources({ onContinue }: MoreResourcesProps) {
  return (
    <section className="relative min-h-screen bg-white pb-10">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            E Mais Recursos:
          </h2>
          <p className="mt-4 text-base text-slate-700 leading-relaxed max-w-md mx-auto">
            Além do que já mostramos também{' '}
            <span className="font-bold text-slate-800">contamos com:</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B4BFF] text-white">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 space-y-3 text-center"
        >
          <p className="text-sm text-slate-600 leading-relaxed">
            você receberá treinamento, e outros recursos...
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Nosso diferencial é justamente não ser SÓ uma ferramenta que você vai usar uma vez e
            esquecer.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Não só registrar gastos, a{' '}
            <span className="font-bold text-[#0B4BFF]">PleniPay</span> é o meio para você transformar
            sua realidade financeira.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10"
        >
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-2xl py-4 text-base font-bold text-white bg-[#0B4BFF] shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
          >
            Continuar
          </button>
        </motion.div>
      </div>
    </section>
  )
}
