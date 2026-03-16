'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

type DemoStep4Props = {
  onContinue: () => void
}

const STAMP = '14:06'

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
          'max-w-[92%] rounded-2xl px-4 py-3 shadow-sm',
          isUser ? 'rounded-tr-md bg-emerald-600 text-white' : 'rounded-tl-md bg-[#1f2937] text-white',
        ].join(' ')}
      >
        {children}
        <div className="mt-2 flex items-center justify-end gap-1 text-[11px] opacity-70">
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

export function DemoStep4({ onContinue }: DemoStep4Props) {
  return (
    <section className="relative min-h-screen bg-white pb-8">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-12">
        {/* Section 6: Planejamento de Metas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <SectionHeading number={6}>Planejamento de Metas</SectionHeading>
          <p className="text-slate-600 text-sm leading-relaxed text-center max-w-md mx-auto mt-3">
            Defina uma meta e te levaremos até lá. Ele planeja, calcula e avisa o que você precisa
            fazer.
          </p>
          <div className="space-y-3 mt-4">
            <Bubble from="user" stamp={STAMP}>
              <span className="text-sm">Crie uma meta para Iphone 16, preciso de 5.399</span>
            </Bubble>
            <Bubble from="user" stamp={STAMP}>
              <span className="text-sm">Já guardei 500 hoje</span>
            </Bubble>
            <Bubble from="ai" stamp={STAMP}>
              <span className="text-sm">
                Criei a meta e já registrei o valor que você guardou hoje.
              </span>
            </Bubble>
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-[#1f2937] text-white px-3 py-3 shadow-sm">
                <div className="rounded-xl bg-white text-[#0D1B2A] px-4 py-4 shadow-inner">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-800">Nova Meta</span>
                  </div>
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="3"
                          strokeDasharray="9.27, 90.73"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-slate-800">9,27%</span>
                        <span className="text-[10px] text-slate-500">da meta</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-700 mb-1">
                    <span className="font-medium">Iphone</span>
                    <ChevronDown size={14} className="text-slate-500" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    R$ 500,00 → R$ 5.399,00
                  </div>
                </div>
                <div className="mt-2 text-[11px] opacity-70 flex justify-end">{STAMP}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section 7: Alerta de Promoções */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <SectionHeading number={7}>Alerta de Promoções</SectionHeading>
          <p className="text-slate-600 text-sm leading-relaxed text-center max-w-md mx-auto mt-3">
            Te ajudamos a achar promoções absurdas e pagar mais barato em tudo. Nossa IA realiza
            buscas automáticas na internet 24 horas por dia.
          </p>
          <div className="space-y-3 mt-4">
            <Bubble from="ai" stamp={STAMP}>
              <span className="text-sm">
                🏠 Você demonstrou interesse Viagens alguns dias atrás. Encontrei uma promoção:
              </span>
            </Bubble>
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-[#1f2937] text-white px-4 py-4 shadow-sm">
                <div className="text-sm space-y-2">
                  <p>
                    ➕ Pacote Completo Disney 7 dias - Ida e volta + Hospedagem
                  </p>
                  <p>por R$ 1.799 no pix 👹👹</p>
                  <p>💳 ou 10x de R$ 179,90</p>
                  <p>🎟️ Use o cupom: DISNEY20</p>
                  <p className="pt-1">
                    ➡️ Compre aqui:{' '}
                    <span className="text-white/70 select-none blur-sm">https://exemplo.com/promo</span>
                  </p>
                </div>
                <div className="mt-2 text-[11px] opacity-70 flex justify-end">{STAMP}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
