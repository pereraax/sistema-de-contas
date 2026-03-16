import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

type DiagnosisKey = 'automation' | 'organization' | 'clients' | 'clarity'

type ResultProps = {
  diagnosis: DiagnosisKey
}

const DIAGNOSIS_COPY: Record<
  DiagnosisKey,
  {
    title: string
    subtitle: string
    bullets: string[]
  }
> = {
  automation: {
    title: 'Seu diagnóstico: Falta de automação',
    subtitle:
      'Com base nas suas respostas, você está prendendo energia em tarefas manuais que poderiam ser 100% automatizadas.',
    bullets: [
      'Você perde tempo organizando mensagens, planilhas ou tarefas manualmente.',
      'Isso atrasa seu crescimento e faz você perder oportunidades todos os dias.',
      'Um fluxo automatizado pode liberar horas por semana para foco em estratégia e vendas.',
    ],
  },
  organization: {
    title: 'Seu diagnóstico: Falta de organização do fluxo',
    subtitle:
      'Seu negócio já tem demanda, mas o bastidor está confuso e isso trava a escala e a previsibilidade dos resultados.',
    bullets: [
      'Mensagens, leads e tarefas se perdem no meio do caminho.',
      'Você depende demais da memória ou de anotações soltas.',
      'Com um sistema visual, fica claro o que fazer, quando fazer e quem é responsável.',
    ],
  },
  clients: {
    title: 'Seu diagnóstico: Geração de demanda inconsistente',
    subtitle:
      'O maior gargalo hoje é o volume e a qualidade dos clientes que chegam até você.',
    bullets: [
      'Sua operação até funciona, mas falta um fluxo previsível de novos interessados.',
      'Sem uma jornada bem pensada, muitos leads esfriarem antes de comprar.',
      'Um funil inteligente pode transformar curiosos em clientes de forma automática.',
    ],
  },
  clarity: {
    title: 'Seu diagnóstico: Falta de clareza dos números',
    subtitle:
      'Você até tem movimento, mas não enxerga com precisão onde o tempo e o dinheiro estão indo.',
    bullets: [
      'Sem métricas claras, fica difícil decidir o próximo passo com segurança.',
      'Isso abre espaço para decisões por “sentimento” em vez de dados.',
      'Com um painel simples, você enxerga gargalos e oportunidades em segundos.',
    ],
  },
}

export function Result({ diagnosis }: ResultProps) {
  const copy = DIAGNOSIS_COPY[diagnosis]

  // WhatsApp da equipe PleniPay (já usado na landing principal)
  const WHATSAPP_URL = 'https://wa.me/message/PLHJUVZSV2B5O1'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-cyan-300 mb-3">
          Diagnóstico personalizado
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-3">
          {copy.title}
        </h2>
        <p className="text-sm sm:text-base text-gray-200 max-w-xl">{copy.subtitle}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 space-y-3">
        {copy.bullets.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
            <p className="text-sm text-gray-100">{item}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        <p className="text-xs sm:text-sm text-gray-300">
          O próximo passo é transformar esse diagnóstico em um plano prático para o seu negócio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/30 hover:brightness-110 hover:shadow-xl active:scale-[0.98] transition-all flex-1"
          >
            Quero resolver isso agora
            <ArrowRight size={18} />
          </a>

          <Link
            href="/checkout"
            className="inline-flex items-center justify-center px-5 py-3.5 rounded-2xl text-sm sm:text-base font-medium text-cyan-200 border border-cyan-400/60 bg-cyan-500/5 hover:bg-cyan-500/10 active:scale-[0.98] transition-all"
          >
            Ver planos e preços
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

