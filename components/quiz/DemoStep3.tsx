'use client'

import { motion } from 'framer-motion'

type DemoStep3Props = {
  onContinue: () => void
}

const STAMP = '14:02'

const LIMIT_CATEGORIES = [
  { name: 'Lazer', pct: 60, value: '252,40', limit: '500' },
  { name: 'Delivery', pct: 84, value: '336,42', limit: '400' },
  { name: 'Compras', pct: 12, value: '36', limit: '300' },
  { name: 'Transporte', pct: 34, value: '204,72', limit: '600' },
]

function Bubble({
  from,
  stamp,
  children,
}: {
  from: 'user' | 'ai'
  stamp: string
  children: React.ReactNode
}) {
  const isUser = from === 'user'
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={[
          'max-w-[92%] rounded-2xl px-4 py-3 shadow-sm text-base',
          isUser ? 'rounded-tr-md bg-emerald-600 text-white' : 'rounded-tl-md bg-[#1f2937] text-white',
        ].join(' ')}
      >
        {children}
        <div className="mt-2 flex items-center justify-end gap-1 text-xs opacity-70">
          {isUser && (
            <svg className="h-3.5 w-4" viewBox="0 0 16 11" fill="currentColor">
              <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.564.278l-.037.135a.32.32 0 0 1-.188.2.32.32 0 0 1-.26 0  .32.32 0 0 1-.188-.2l-.037-.135a.365.365 0 0 0-.564-.278l-.478.372a.365.365 0 0 0-.136.46l.015.03a.365.365 0 0 0 .223.168l.05.01a.32.32 0 0 1 .188.2l.037.135a.365.365 0 0 0 .564.278l.478-.372a.365.365 0 0 0 .136-.46l-.015-.03a.365.365 0 0 0-.223-.168l-.05-.01a.32.32 0 0 1-.188-.2l-.037-.135a.365.365 0 0 0-.564-.278l-.478.372a.365.365 0 0 0-.136.46l.015.03a.365.365 0 0 0 .223.168l.05.01a.32.32 0 0 1 .188.2l.037.135a.365.365 0 0 0 .564.278l.478-.372a.365.365 0 0 0 .136-.46l-.015-.03a.365.365 0 0 0-.223-.168l-.05-.01a.32.32 0 0 1-.188-.2l-.037-.135z" />
              <path d="M10.653 3.316l-.478-.372a.365.365 0 0 0-.564.278l-.037.135a.32.32 0 0 1-.188.2.32.32 0 0 1-.26 0  .32.32 0 0 1-.188-.2l-.037-.135a.365.365 0 0 0-.564-.278l-.478.372a.365.365 0 0 0-.136.46l.015.03a.365.365 0 0 0 .223.168l.05.01a.32.32 0 0 1 .188.2l.037.135a.365.365 0 0 0 .564.278l.478-.372a.365.365 0 0 0 .136-.46l-.015-.03a.365.365 0 0 0-.223-.168l-.05-.01a.32.32 0 0 1-.188-.2l-.037-.135a.365.365 0 0 0-.564-.278l-.478.372a.365.365 0 0 0-.136.46l.015.03a.365.365 0 0 0 .223.168l.05.01a.32.32 0 0 1 .188.2l.037.135a.365.365 0 0 0 .564.278l.478-.372a.365.365 0 0 0 .136-.46l-.015-.03a.365.365 0 0 0-.223-.168l-.05-.01a.32.32 0 0 1-.188-.2l-.037-.135z" />
            </svg>
          )}
          <span>{stamp}</span>
        </div>
      </div>
    </div>
  )
}

function SectionHeading({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center mt-10 first:mt-6">
      <div className="text-4xl font-extrabold text-[#0B4BFF] leading-none">{number}.</div>
      <h2 className="mt-2 text-lg sm:text-xl font-extrabold text-[#0D1B2A] leading-tight max-w-md">
        {children}
      </h2>
    </div>
  )
}

export function DemoStep3({ onContinue }: DemoStep3Props) {
  return (
    <section className="relative min-h-screen bg-white pb-8">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-12">
        {/* Section 3: Lembretes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <SectionHeading number={3}>
            Defina lembretes para pagar contas e não esqueça de nada (para uma conta única, ou
            frequente).
          </SectionHeading>
          <div className="space-y-3 mt-4">
            <Bubble from="user" stamp={STAMP}>
              Boleto do carro todo dia 12, R$ 1300
            </Bubble>
            <Bubble from="ai" stamp={STAMP}>
              <div className="text-base">
                Lembrete adicionado 📌{' '}
                <span className="text-red-300 font-semibold">Boleto do carro</span> Data: 12
                Frequência: Mensal
              </div>
            </Bubble>
          </div>
        </motion.div>

        {/* Section 4: Lembrado com antecedência */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <SectionHeading number={4}>E seja lembrado com antecedência.</SectionHeading>
          <div className="space-y-3 mt-4">
            <Bubble from="ai" stamp={STAMP}>
              <span className="text-base">💡 Lembrete: Boleto Carro</span>
            </Bubble>
            <Bubble from="user" stamp={STAMP}>
              paguei já
            </Bubble>
            <Bubble from="ai" stamp={STAMP}>
              <span className="text-base">Te lembro de novo mês que vem ✔</span>
            </Bubble>
          </div>
        </motion.div>

        {/* Section 5: Limites por categoria */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <SectionHeading number={5}>
            Defina limites de gastos por categoria. Controle quanto quer gastar.
          </SectionHeading>
          <div className="space-y-3 mt-4">
            <Bubble from="user" stamp={STAMP}>
              como estão meus limites de gastos?
            </Bubble>
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-[#1f2937] text-white px-3 py-3 shadow-sm">
                <div className="rounded-xl bg-white text-[#0D1B2A] px-4 py-3 shadow-inner">
                  <div className="text-sm font-semibold text-slate-600 mb-3">
                    Limite definido: Relatório dia 21/01
                  </div>
                  <div className="space-y-3">
                    {LIMIT_CATEGORIES.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between items-center text-sm mb-1">
                          <span className="font-medium text-slate-800">{cat.name}</span>
                          <span className="font-semibold text-emerald-600">{cat.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{ width: `${Math.min(cat.pct, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          R$ {cat.value} de R$ {cat.limit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-xs opacity-70 flex justify-end">{STAMP}</div>
              </div>
            </div>
            <Bubble from="ai" stamp={STAMP}>
              <span className="text-base">Segue relatório dos seus limites de gastos 👆</span>
            </Bubble>
          </div>
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
