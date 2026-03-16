import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const Quiz = dynamic(() => import('@/components/quiz/Quiz'), {
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

