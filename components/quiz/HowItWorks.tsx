import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'

type HowItWorksProps = {
  onContinue: () => void
}

export function HowItWorks({ onContinue }: HowItWorksProps) {
  const [demoState, setDemoState] = useState<'idle' | 'running' | 'done'>('idle')
  const [showUserMsg, setShowUserMsg] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [showAiCard, setShowAiCard] = useState(false)
  const [showAiReminder, setShowAiReminder] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [showUserMsg, showTyping, showAiCard, showAiReminder, demoState])

  const runDemo = async () => {
    if (demoState !== 'idle') return
    setDemoState('running')
    setShowUserMsg(true)
    setShowTyping(true)

    await wait(2200)
    setShowTyping(false)
    setShowAiCard(true)

    await wait(650)
    setShowAiReminder(true)

    await wait(450)
    setDemoState('done')
  }

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
              onClick={runDemo}
              disabled={demoState !== 'idle'}
              className="w-full rounded-full py-4 px-5 text-base font-semibold text-white bg-emerald-600 shadow-lg hover:bg-emerald-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                <Play size={18} />
              </span>
              Camisa 110
            </button>
          </motion.div>

          {/* Mini chat (WhatsApp-like) */}
          <div className="mt-8 space-y-3">
            <AnimatePresence initial={false}>
              {showUserMsg && (
                <Bubble key="user" from="user" stamp="12:54">
                  Camisa 110
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

              {showAiCard && (
                <Bubble key="ai-card" from="ai" stamp="12:54">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Gasto adicionado</div>
                    <div className="text-sm">
                      <span className="mr-2">📌</span>
                      Camisa <span className="opacity-85 italic">(Roupas)</span>
                    </div>
                    <div className="text-base font-bold">R$ 110.00</div>
                    <div className="pt-2 text-xs opacity-80">25/02/2025</div>
                  </div>
                </Bubble>
              )}

              {showAiReminder && (
                <Bubble key="ai-reminder" from="ai" stamp="12:54">
                  <div className="text-sm">
                    Lembrete: Você está quase chegando no seu limite definido de{' '}
                    <span className="font-bold">R$ 200</span> por mês com{' '}
                    <span className="font-bold">Roupas</span>.
                  </div>
                </Bubble>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>

          {demoState === 'done' && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <button
                type="button"
                onClick={onContinue}
                className="w-full rounded-2xl py-4 text-base font-bold text-white bg-[#0B4BFF] shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
              >
                Continuar
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
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
          'max-w-[92%] rounded-2xl px-4 py-3 shadow-sm',
          isUser ? 'rounded-tr-md bg-emerald-800 text-white' : 'rounded-tl-md bg-[#1f2937] text-white',
        ].join(' ')}
      >
        {children}
        <div className="mt-2 text-[11px] opacity-70 flex justify-end">{stamp}</div>
      </div>
    </motion.div>
  )
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

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

