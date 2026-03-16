'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Hero } from './Hero'
import { Question } from './Question'
import { ProgressBar } from './ProgressBar'
import { Result } from './Result'

type DiagnosisKey = 'automation' | 'organization' | 'clients' | 'clarity'

type AnswerMap = {
  q1?: string
  q2?: string
  q3?: string
}

const ANALYSIS_MESSAGES = [
  'Analisando suas respostas...',
  'Identificando padrões no seu momento atual...',
  'Gerando um diagnóstico personalizado...',
]

export default function Quiz() {
  const [mode, setMode] = useState<'idle' | 'quiz' | 'analyzing' | 'result'>('idle')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [diagnosis, setDiagnosis] = useState<DiagnosisKey>('automation')
  const [analysisIndex, setAnalysisIndex] = useState(0)

  const totalSteps = 3

  // Travar scroll enquanto o quiz estiver ativo
  useEffect(() => {
    if (mode === 'quiz' || mode === 'analyzing' || mode === 'result') {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
    return
  }, [mode])

  // Ciclo de mensagens da tela de análise
  useEffect(() => {
    if (mode !== 'analyzing') return

    setAnalysisIndex(0)
    const interval = setInterval(() => {
      setAnalysisIndex((prev) => (prev + 1) % ANALYSIS_MESSAGES.length)
    }, 1100)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      const d = computeDiagnosis(answers)
      setDiagnosis(d)
      setMode('result')
    }, 2200)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [mode, answers])

  const currentQuestion = useMemo(() => {
    if (step === 0) {
      return {
        id: 'q1',
        title: 'Qual é seu maior desafio hoje?',
        subtitle: 'Escolha a opção que mais se aproxima da sua realidade neste momento.',
        options: [
          { value: 'mais_clientes', label: 'Conseguir mais clientes' },
          { value: 'organizar_negocio', label: 'Organizar meu negócio' },
          { value: 'automatizar_processos', label: 'Automatizar processos' },
          { value: 'aumentar_vendas', label: 'Aumentar vendas' },
        ],
      } as const
    }
    if (step === 1) {
      return {
        id: 'q2',
        title: 'Hoje você usa algum sistema para gerenciar clientes?',
        options: [
          { value: 'nada', label: 'Não uso nada' },
          { value: 'planilhas', label: 'Uso planilhas' },
          { value: 'varias_ferramentas', label: 'Uso várias ferramentas' },
          { value: 'tenho_sistema', label: 'Tenho um sistema' },
        ],
      } as const
    }
    return {
      id: 'q3',
      title: 'Quanto tempo você perde por dia organizando mensagens ou tarefas?',
      options: [
        { value: 'mais_3h', label: 'Mais de 3 horas' },
        { value: '1a3h', label: '1 a 3 horas' },
        { value: 'menos_1h', label: 'Menos de 1 hora' },
        { value: 'nao_sei', label: 'Não sei' },
      ],
    } as const
  }, [step])

  const handleSelect = (value: string) => {
    const id = currentQuestion.id
    const updated: AnswerMap = { ...answers, [id]: value }
    setAnswers(updated)

    const isLast = step === totalSteps - 1
    if (!isLast) {
      setStep((prev) => prev + 1)
      return
    }

    setMode('analyzing')
  }

  const handleStart = () => {
    setAnswers({})
    setStep(0)
    setMode('quiz')
  }

  return (
    <main className="min-h-screen bg-[#0D1B2A] text-white flex flex-col">
      <AnimatePresence mode="wait">
        {mode === 'idle' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Hero onStart={handleStart} />
          </motion.div>
        )}

        {(mode === 'quiz' || mode === 'analyzing' || mode === 'result') && (
          <motion.section
            key="quiz"
            className="relative flex-1 flex items-start justify-center px-4 py-8 bg-[#0D1B2A]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Fundo PWA (sem “janela”) */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[520px] rounded-full bg-cyan-500/20 blur-3xl" />
              <div className="absolute -bottom-40 -right-24 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
              <div className="absolute -bottom-48 -left-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-[520px] pt-2">
              {mode === 'quiz' && (
                <div className="bg-white text-[#0D1B2A] rounded-[22px] shadow-2xl border border-white/10 overflow-hidden">
                  <div className="px-6 py-6">
                    <ProgressBar currentStep={step} totalSteps={totalSteps} />
                    <div className="text-[#0D1B2A]">
                      <Question
                        title={currentQuestion.title}
                        // @ts-expect-error subtitle is optional in one question only
                        subtitle={currentQuestion.subtitle}
                        options={currentQuestion.options}
                        onSelect={handleSelect}
                      />
                    </div>
                    <p className="mt-6 text-[11px] text-slate-500">
                      Leva menos de 30 segundos. Suas respostas são usadas apenas para montar este diagnóstico.
                    </p>
                  </div>
                </div>
              )}

              {mode === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center text-center py-10 bg-white text-[#0D1B2A] rounded-[22px] shadow-2xl border border-white/10 overflow-hidden px-6"
                >
                  <div className="relative mb-6">
                    <div className="h-16 w-16 rounded-3xl bg-[#0D1B2A] border border-cyan-500/40 flex items-center justify-center shadow-[0_0_0_1px_rgba(13,27,42,0.9)]">
                      <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#0D1B2A]" />
                      </div>
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-3xl border border-cyan-400/40"
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1.35] }}
                      transition={{ duration: 1.3, repeat: Infinity }}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-medium tracking-[0.2em] uppercase text-cyan-600">
                      Montando seu diagnóstico
                    </p>
                    <motion.p
                      key={analysisIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35 }}
                      className="text-sm sm:text-base text-slate-700"
                    >
                      {ANALYSIS_MESSAGES[analysisIndex]}
                    </motion.p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Isso leva só alguns segundos.
                  </div>
                </motion.div>
              )}

              {mode === 'result' && (
                <div className="bg-white text-[#0D1B2A] rounded-[22px] shadow-2xl border border-white/10 overflow-hidden px-6 py-8">
                  <Result diagnosis={diagnosis} />
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}

function computeDiagnosis(answers: AnswerMap): DiagnosisKey {
  const { q1, q2, q3 } = answers

  // Se maior desafio é automação, ou perde muito tempo + usa planilhas/nada → automação
  if (
    q1 === 'automatizar_processos' ||
    ((q3 === 'mais_3h' || q3 === '1a3h') && (q2 === 'planilhas' || q2 === 'nada'))
  ) {
    return 'automation'
  }

  // Se maior desafio é organizar o negócio ou usa várias ferramentas → organização
  if (q1 === 'organizar_negocio' || q2 === 'varias_ferramentas') {
    return 'organization'
  }

  // Se maior desafio é conseguir clientes / aumentar vendas → clientes
  if (q1 === 'mais_clientes' || q1 === 'aumentar_vendas') {
    return 'clients'
  }

  // Cenário padrão → clareza de números
  return 'clarity'
}

