'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, TrendingUp } from 'lucide-react'

type DemoStep2Props = {
  onContinue: () => void
}

const STAMP = '13:40'
const STAMP_PHASE2 = '13:54'

// Bar values (max 131 for height scale)
const BAR_DATA = [
  { label: 'dom', value: 105 },
  { label: 'seg', value: 53 },
  { label: 'ter', value: 64 },
  { label: 'qua', value: 131 },
  { label: 'qui', value: 52 },
]
const BAR_MAX = Math.max(...BAR_DATA.map((d) => d.value))

const PIE_LEGEND = [
  { label: 'Alimentação', pct: 14, color: 'bg-cyan-400' },
  { label: 'Transporte', pct: 16, color: 'bg-blue-500' },
  { label: 'Lazer', pct: 11, color: 'bg-purple-500' },
  { label: 'Contas Fixas', pct: 36, color: 'bg-orange-500' },
  { label: 'Jantar fora', pct: 23, color: 'bg-amber-400' },
]

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
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
    <motion.div
      initial={{ opacity: 0, y: 10, x: isUser ? 10 : -10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={isUser ? 'flex justify-end' : 'flex justify-start'}
    >
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
    </motion.div>
  )
}

export function DemoStep2({ onContinue }: DemoStep2Props) {
  const [demoState, setDemoState] = useState<'idle' | 'running' | 'done' | 'phase2running' | 'phase2done'>('idle')
  const [showUserMsg, setShowUserMsg] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [showResp1, setShowResp1] = useState(false)
  const [showResp2, setShowResp2] = useState(false)
  const [showResp3, setShowResp3] = useState(false)
  const [showResp4, setShowResp4] = useState(false)
  const [showPhase2User, setShowPhase2User] = useState(false)
  const [showPhase2Typing, setShowPhase2Typing] = useState(false)
  const [showPhase2Resp, setShowPhase2Resp] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const continuarRef = useRef<HTMLDivElement | null>(null)
  const phase2ContinuarRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (demoState === 'phase2done') {
      phase2ContinuarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    } else if (demoState === 'done') {
      continuarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [showUserMsg, showTyping, showResp1, showResp2, showResp3, showResp4, showPhase2User, showPhase2Typing, showPhase2Resp, demoState])

  const runDemo = async () => {
    if (demoState !== 'idle') return
    setDemoState('running')
    setShowUserMsg(true)
    setShowTyping(true)

    await wait(2400)
    setShowTyping(false)
    setShowResp1(true)

    await wait(800)
    setShowResp2(true)

    await wait(700)
    setShowResp3(true)

    await wait(700)
    setShowResp4(true)

    await wait(500)
    setDemoState('done')
  }

  const runPhase2 = async () => {
    if (demoState !== 'done') return
    setDemoState('phase2running')
    setShowPhase2User(true)
    setShowPhase2Typing(true)

    await wait(2200)
    setShowPhase2Typing(false)
    setShowPhase2Resp(true)

    await wait(500)
    setDemoState('phase2done')
  }

  const showPrompt = demoState === 'idle' || demoState === 'running'
  const showCtaAndGreenButton = demoState === 'done'
  const showPhase2Closing = demoState === 'phase2done'

  return (
    <section className="relative min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <span className="inline-block rounded-full bg-[#0B4BFF] px-4 py-2 text-white text-sm font-semibold shadow-sm">
            Demonstração
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center"
        >
          <div className="text-4xl font-extrabold text-[#0B4BFF] leading-none">2.</div>
          <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-[#0D1B2A] leading-tight max-w-md">
            Você pode perguntar <span className="text-[#0B4BFF]">TUDO SOBRE SUAS FINANÇAS.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-slate-600 leading-relaxed"
        >
          Exemplo: Digamos que você quer ver quanto gastou nos últimos 7 dias:
        </motion.p>

        {showPrompt && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={runDemo}
            disabled={demoState !== 'idle'}
            className="mt-8 w-full max-w-md mx-auto flex rounded-2xl rounded-tr-md bg-emerald-600 px-5 py-4 shadow-lg items-center gap-3 text-white hover:bg-emerald-700 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 flex-shrink-0">
              <Send size={18} />
            </span>
            <span className="text-base font-semibold text-left flex-1">
              Quanto eu gastei nos últimos 7 dias?
            </span>
          </motion.button>
        )}

        {/* Chat simulation */}
        <div className="mt-8 space-y-3">
          <AnimatePresence initial={false}>
            {showUserMsg && (
              <Bubble key="user" from="user" stamp={STAMP}>
                quanto eu gastei nos últimos dias?
              </Bubble>
            )}

            {showTyping && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-tl-md bg-[#1f2937] text-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Dot delay={0} />
                    <Dot delay={0.15} />
                    <Dot delay={0.3} />
                    <span className="sr-only">Digitando...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {showResp1 && (
              <motion.div
                key="resp1"
                initial={{ opacity: 0, y: 10, x: -10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-start"
              >
                <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-white px-4 py-4 shadow-lg border border-slate-200 text-[#0D1B2A]">
                  <div className="text-base font-bold">Últimos 7 dias</div>
                  <div className="text-sm text-slate-600 mt-0.5">
                    R$ 632,00 - 16/03/2026 - 23/03/2026
                  </div>
                  <div className="flex items-end gap-1.5 mt-3 h-16">
                    {BAR_DATA.map((d, i) => (
                      <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-slate-600">{d.value}</span>
                        <div
                          className="w-full rounded-t bg-emerald-400 min-h-[8px]"
                          style={{ height: `${(d.value / BAR_MAX) * 100}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1.5 justify-between text-xs text-slate-500">
                    {BAR_DATA.map((d) => (
                      <span key={d.label}>{d.label}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-sm text-red-600">
                    <TrendingUp size={14} />
                    <span>Seus gastos aumentaram em 20% essa semana</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex justify-end">{STAMP}</div>
                </div>
              </motion.div>
            )}

            {showResp2 && (
              <Bubble key="resp2" from="ai" stamp={STAMP}>
                Segue gráfico dos seus gastos dos últimos 7 dias 👋
              </Bubble>
            )}

            {showResp3 && (
              <motion.div
                key="resp3"
                initial={{ opacity: 0, y: 10, x: -10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-start"
              >
                <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-white px-4 py-4 shadow-lg border border-slate-200 text-[#0D1B2A]">
                  <div className="text-base font-bold">Divisão de gastos</div>
                  <div className="text-sm text-slate-600 mt-0.5">16/03/2026 - 23/03/2026</div>
                  <div
                    className="mt-3 w-28 h-28 rounded-full mx-auto"
                    style={{
                      background: `conic-gradient(
                        #22d3ee 0% 14%,
                        #3b82f6 14% 30%,
                        #a855f7 30% 41%,
                        #f97316 41% 77%,
                        #fbbf24 77% 100%
                      )`,
                    }}
                  />
                  <div className="mt-3 space-y-1.5">
                    {PIE_LEGEND.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        <span className={`w-3 h-3 rounded-sm ${item.color}`} />
                        <span className="text-slate-700">{item.label}</span>
                        <span className="text-slate-500 ml-auto">{item.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex justify-end">{STAMP}</div>
                </div>
              </motion.div>
            )}

            {showResp4 && (
              <Bubble key="resp4" from="ai" stamp={STAMP}>
                Segue o gráfico da divisão dos seus gastos por categoria 👋
              </Bubble>
            )}

            {showPhase2User && (
              <Bubble key="phase2-user" from="user" stamp={STAMP_PHASE2}>
                O que eu gastei a mais essa semana?
              </Bubble>
            )}

            {showPhase2Typing && (
              <motion.div
                key="phase2-typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-tl-md bg-[#1f2937] text-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <Dot delay={0} />
                    <Dot delay={0.15} />
                    <Dot delay={0.3} />
                    <span className="sr-only">Digitando...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {showPhase2Resp && (
              <Bubble key="phase2-ai" from="ai" stamp={STAMP_PHASE2}>
                <div className="space-y-2 text-base">
                  <p>
                    Os gastos aumentaram nesta semana em comparação com a semana passada, totalizando R$157,00 a mais.
                  </p>
                  <p>
                    O principal motivo foi a compra de gás de cozinha, realizada na Segunda-feira e na Quarta-feira, o que não ocorreu na semana anterior.
                  </p>
                </div>
              </Bubble>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {showCtaAndGreenButton && (
          <motion.div
            ref={continuarRef}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 space-y-4"
          >
            <p className="text-slate-600 text-base">
              Imaginando que esses gastos sejam os seus, pergunte algo ao seu assistente:
            </p>
            <button
              type="button"
              onClick={runPhase2}
              className="w-full rounded-2xl rounded-tr-md bg-emerald-600 px-5 py-4 shadow-lg flex items-center gap-3 text-white hover:bg-emerald-700 active:scale-[0.99] transition-all text-left"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 flex-shrink-0">
                <Send size={18} />
              </span>
              <span className="text-base font-semibold">O que eu gastei a mais essa semana?</span>
            </button>
          </motion.div>
        )}

        {showPhase2Closing && (
          <motion.div
            ref={phase2ContinuarRef}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 space-y-6"
          >
            <p className="text-slate-700 text-base leading-relaxed">
              Você nunca mais vai se fazer a pergunta &quot;onde que eu gastei tanto esse mês&quot;, sem ter a resposta.
            </p>
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-2xl py-4 text-base font-bold text-white bg-[#0B4BFF] shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
            >
              Continuar
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}
