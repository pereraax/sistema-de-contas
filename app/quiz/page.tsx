'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import QuizProgress from '@/components/quiz/QuizProgress'
import ScreenHero from '@/components/quiz/ScreenHero'
import ScreenQuestion from '@/components/quiz/ScreenQuestion'
import ScreenWhatsAppSim from '@/components/quiz/ScreenWhatsAppSim'
import ScreenReport from '@/components/quiz/ScreenReport'
import ScreenGoalsCircle from '@/components/quiz/ScreenGoalsCircle'
import ScreenDiagnosis from '@/components/quiz/ScreenDiagnosis'
import ScreenSavings from '@/components/quiz/ScreenSavings'
import ScreenFinalOffer from '@/components/quiz/ScreenFinalOffer'
import type { QuestionOption } from '@/components/quiz/ScreenQuestion'

const TOTAL_STEPS = 10

const QUESTIONS: { question: string; options: QuestionOption[]; key: string }[] = [
  {
    key: 'q1',
    question: 'Hoje você controla seus gastos de alguma forma?',
    options: [
      { id: 'planilha', label: 'Uso planilha' },
      { id: 'app', label: 'Uso aplicativo' },
      { id: 'mental', label: 'Anoto mentalmente' },
      { id: 'nao', label: 'Não controlo' },
    ],
  },
  {
    key: 'q2',
    question: 'Com que frequência você perde o controle do dinheiro no mês?',
    options: [
      { id: 'nunca', label: 'Nunca' },
      { id: 'as_vezes', label: 'Às vezes' },
      { id: 'frequentemente', label: 'Frequentemente' },
      { id: 'quase_sempre', label: 'Quase todo mês' },
    ],
  },
  {
    key: 'q3',
    question: 'Você possui alguma meta financeira?',
    options: [
      { id: 'sim', label: 'Sim' },
      { id: 'algumas', label: 'Tenho algumas' },
      { id: 'ainda_nao', label: 'Ainda não' },
      { id: 'nunca_pensei', label: 'Nunca pensei nisso' },
    ],
  },
]

export default function QuizPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const handleAnswer = useCallback(
    (key: string, value: string) => {
      setAnswers((a) => ({ ...a, [key]: value }))
      goNext()
    },
    [goNext]
  )

  const progressStep = step + 1

  return (
    <div className="quiz-page min-h-screen bg-white">
      {step > 0 && <QuizProgress step={progressStep} total={TOTAL_STEPS} />}
      <main className={step > 0 ? 'pt-16' : ''}>
        <AnimatePresence mode="wait">
          {step === 0 && <ScreenHero key="hero" onStart={goNext} />}
          {step >= 1 && step <= 3 && (
            <ScreenQuestion
              key={QUESTIONS[step - 1].key}
              question={QUESTIONS[step - 1].question}
              options={QUESTIONS[step - 1].options}
              onSelect={(id) => handleAnswer(QUESTIONS[step - 1].key, id)}
            />
          )}
          {step === 4 && <ScreenWhatsAppSim key="whatsapp" onNext={goNext} />}
          {step === 5 && <ScreenReport key="report" onNext={goNext} />}
          {step === 6 && <ScreenGoalsCircle key="goals" onNext={goNext} />}
          {step === 7 && (
            <ScreenDiagnosis key="diagnosis" onNext={goNext} answers={answers} />
          )}
          {step === 8 && <ScreenSavings key="savings" onNext={goNext} />}
          {step === 9 && <ScreenFinalOffer key="offer" />}
        </AnimatePresence>
      </main>
    </div>
  )
}
