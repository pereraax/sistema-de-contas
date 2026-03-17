import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'

// Evitar cache estático para sempre servir a versão mais recente após deploy
export const dynamic = 'force-dynamic'
export const revalidate = 0

const Quiz = nextDynamic(() => import('@/components/quiz/Quiz'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Diagnóstico Rápido | Descubra o que trava seus resultados',
  description:
    'Responda um quiz rápido e descubra, em menos de 30 segundos, qual é o maior gargalo que está travando seus resultados hoje.',
  openGraph: {
    title: 'Diagnóstico Rápido | Descubra o que trava seus resultados',
    description:
      'Quiz interativo que gera um diagnóstico personalizado sobre o principal gargalo do seu negócio.',
    type: 'website',
  },
}

export default function DiagnosticoQuizPage() {
  return <Quiz />
}

