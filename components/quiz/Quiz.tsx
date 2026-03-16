'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Hero } from './Hero'
import { HowItWorks } from './HowItWorks'
import { DemoStep2 } from './DemoStep2'
import { DemoStep3 } from './DemoStep3'
import { DemoStep4 } from './DemoStep4'
import { Question } from './Question'
import { ProgressBar } from './ProgressBar'
import { Result } from './Result'

type DiagnosisKey = 'automation' | 'organization' | 'clients' | 'clarity'

type QuizMode = 'idle' | 'how' | 'how2' | 'how3' | 'how4' | 'quiz' | 'analyzing' | 'result'

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
  const [mode, setMode] = useState<QuizMode>('idle')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [diagnosis, setDiagnosis] = useState<DiagnosisKey>('automation')
  const [analysisIndex, setAnalysisIndex] = useState(0)

  const totalSteps = 3

  // History API: ao avançar, empilha estado para o botão Voltar do navegador levar às páginas anteriores
  const goToStep = useCallback((nextMode: QuizMode) => {
    setMode(nextMode)
    if (typeof window !== 'undefined') {
      window.history.pushState({ mode: nextMode }, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.history.replaceState({ mode: 'idle' }, '', window.location.pathname)
    const onPopState = (e: PopStateEvent) => {
      const next = (e.state?.mode as QuizMode | undefined) ?? 'idle'
      setMode(next)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Este funil precisa ser sempre "modo claro" (fundo branco), independente do tema global
  useEffect(() => {
    const root = document.documentElement
    const hadDark = root.classList.contains('dark')
    if (hadDark) root.classList.remove('dark')
    return () => {
      if (hadDark) root.classList.add('dark')
    }
  }, [])

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

  const handleContinueToQuiz = useCallback(() => {
    setAnswers({})
    setStep(0)
    setMode('quiz')
    if (typeof window !== 'undefined') {
      window.history.pushState({ mode: 'quiz' }, '', window.location.pathname)
    }
  }, [])

  return (
    <main className="min-h-screen bg-white text-[#0D1B2A] flex flex-col">
      <AnimatePresence mode="wait">
        {mode === 'idle' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Hero onStart={() => goToStep('how')} />
          </motion.div>
        )}

        {mode === 'how' && (
          <motion.div
            key="how"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <HowItWorks onContinue={() => goToStep('how2')} />
          </motion.div>
        )}

        {mode === 'how2' && (
          <motion.div
            key="how2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <DemoStep2 onContinue={() => goToStep('how3')} />
          </motion.div>
        )}

        {mode === 'how3' && (
          <motion.div
            key="how3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <DemoStep3 onContinue={() => goToStep('how4')} />
          </motion.div>
        )}

        {mode === 'how4' && (
          <motion.div
            key="how4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <DemoStep4 onContinue={handleContinueToQuiz} />
          </motion.div>
        )}

        {(mode === 'quiz' || mode === 'analyzing' || mode === 'result') && (
          <motion.section
            key="quiz"
            className="relative flex-1 flex items-start justify-center px-4 py-8 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative z-10 w-full max-w-[520px] pt-2">
              {mode === 'quiz' && (
                <div className="bg-white text-[#0D1B2A] rounded-[22px] shadow-xl border border-slate-200 overflow-hidden">
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
                  className="flex flex-col items-center text-center py-10 bg-white text-[#0D1B2A] rounded-[22px] shadow-xl border border-slate-200 overflow-hidden px-6"
                >
                  <div className="relative mb-6">
                    <div className="h-16 w-16 rounded-3xl bg-[#0D1B2A] border border-cyan-500/40 flex items-center justify-center shadow-sm">
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
                <div className="bg-white text-[#0D1B2A] rounded-[22px] shadow-xl border border-slate-200 overflow-hidden px-6 py-8">
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

