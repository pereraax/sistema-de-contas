'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Lock, ChevronLeft, ChevronRight, MessageCircle, Repeat2, Heart, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { OfferCheckoutModal } from './OfferCheckoutModal'
import { PreCheckoutCaptureModal } from './PreCheckoutCaptureModal'

type OfferPageProps = {
  onContinue: () => void
}

// Fotos reais de pessoas (IA) - caminhos em public/images/depoimentos
const TESTIMONIALS = [
  {
    name: 'Neide',
    handle: '@neidesilva_amorim',
    text: 'Nunca me dei bem com planilhas ou blocos de nota pra organização! O fato de eu conseguir ter controle total do meu dinheiro pelo whatsapp é incrível',
    image: '/images/depoimentos/neide.png',
  },
  {
    name: 'Carlos',
    handle: '@carlos_tech',
    text: 'Revolucionou minha vida financeira! Em 3 meses já consegui economizar mais que no ano todo anterior.',
    image: '/images/depoimentos/carlos.png',
  },
  {
    name: 'Mariana',
    handle: '@mari_empreendedora',
    text: 'A melhor ferramenta que já usei! A IA entende exatamente meus gastos e me ajuda a tomar decisões inteligentes.',
    image: '/images/depoimentos/marina.png',
  },
  {
    name: 'Ricardo',
    handle: '@ricardo.financas',
    text: 'A IA entende exatamente o que eu pergunto e me mostra onde estou gastando demais. Em um mês já vi resultado.',
    image: '/images/depoimentos/ricardo.png',
  },
  {
    name: 'Fernanda',
    handle: '@feh.organizada',
    text: 'Uso todo dia pelo WhatsApp. Melhor decisão que tomei pra organizar minha vida financeira.',
    image: '/images/depoimentos/fernanda.png',
  },
]

// Contador regressivo: 12 min 57 s (777 segundos)
const INITIAL_SECONDS = 12 * 60 + 57
const CAROUSEL_INTERVAL_MS = 4500

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function OfferPage({ onContinue }: OfferPageProps) {
  const [countdown, setCountdown] = useState(INITIAL_SECONDS)
  const [slideIndex, setSlideIndex] = useState(0)
  const [showCheckout, setShowCheckout] = useState(false)
  // A captura discreta deve aparecer antes da página de oferta/checkout.
  const [captureOpen, setCaptureOpen] = useState(true)
  const [captureData, setCaptureData] = useState<{
    email: string
    celularDigits: string
    celularFormatted: string
  } | null>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown((c) => (c <= 0 ? 0 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const goTo = useCallback((index: number) => {
    setSlideIndex((i) => {
      const n = TESTIMONIALS.length
      if (index < 0) return n - 1
      if (index >= n) return 0
      return index
    })
  }, [])

  useEffect(() => {
    const t = setInterval(() => goTo(slideIndex + 1), CAROUSEL_INTERVAL_MS)
    return () => clearInterval(t)
  }, [slideIndex, goTo])

  const handleCaptured = (data: { email: string; celularDigits: string; celularFormatted: string }) => {
    setCaptureData({
      email: data.email,
      celularDigits: data.celularDigits,
      celularFormatted: data.celularFormatted,
    })
    setCaptureOpen(false)
    setShowCheckout(true)
  }

  if (captureOpen) {
    return (
      <PreCheckoutCaptureModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onContinue={(data) => handleCaptured(data)}
      />
    )
  }

  if (showCheckout) {
    return (
      <OfferCheckoutModal
        open={showCheckout}
        onClose={() => {
          setShowCheckout(false)
        }}
        prefillEmail={captureData?.email}
        prefillCelularDigits={captureData?.celularDigits}
        prefillCelularFormatted={captureData?.celularFormatted}
      />
    )
  }

  return (
    <section className="relative min-h-screen bg-white pb-10">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-8">
        {/* 1º print: cabeçalho e proposta */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center text-emerald-600 font-semibold text-sm uppercase tracking-wide"
        >
          Oferta por tempo limitado
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03, duration: 0.35 }}
          className="mt-3 text-center text-slate-800 text-lg font-bold leading-snug"
        >
          Essa é a sua chance de cumprir o que você tem prometido a tanto tempo.
        </motion.h2>

        {/* Gráfico de evolução - rótulos organizados, sem sobreposição */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex justify-between items-start mb-1">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">R$ 50</span>
              <span className="text-[10px] text-slate-500">Você hoje</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-emerald-600">R$ 7.499</span>
              <span className="text-[10px] text-slate-500">Daqui 6 meses</span>
            </div>
          </div>
          <div className="relative h-20 w-full mt-1">
            <svg viewBox="0 0 200 80" className="h-full w-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#0B4BFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,65 40,58 80,48 120,35 160,20 200,10"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Jan</span>
            <span>Fev</span>
            <span>Mar</span>
            <span>Abr</span>
            <span>Mai</span>
            <span>Jun</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07, duration: 0.35 }}
          className="mt-5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-slate-700 leading-relaxed"
        >
          Imagine você daqui a 6 meses, com dinheiro sobrando para viajar ou para completar pra
          trocar de carro, tudo por causa da decisão que você tomou hoje.
        </motion.div>

        <div className="mt-8 space-y-2">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.09, duration: 0.35 }}
            className="text-center text-slate-600 text-sm"
          >
            Todos os nossos recursos foram desenvolvidos em conjunto por programadores de ponta e os
            melhores analistas financeiros.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="text-center text-slate-600 text-sm"
          >
            Não é barato construir uma Inteligência Artificial do 0.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11, duration: 0.35 }}
          className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 space-y-2"
        >
          <p>
            Poderíamos te cobrar o valor de mercado, <strong>R$ 497 POR ANO</strong>, pelo dinheiro
            que vamos economizar pra você.
          </p>
          <p>
            Mas não faria sentido cobrarmos tanto sendo que o que queremos é a sua{' '}
            <strong>LIBERDADE FINANCEIRA</strong>. Queremos o melhor pra você e você pode ter
            certeza disso.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="mt-8 text-center text-slate-700 text-base"
        >
          Por tempo limitado vamos liberar para você nossa inteligência artificial por apenas:
        </motion.p>

        {/* Banner com contador */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.35 }}
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#0B4BFF] px-4 py-3 text-white shadow-md"
        >
          <Clock className="h-5 w-5 shrink-0" />
          <span className="text-base font-bold sm:text-lg">
            Oferta por tempo limitado: {formatCountdown(countdown)}
          </span>
        </motion.div>

        {/* Prova social em carrossel - layout mais horizontal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mt-8 relative"
        >
          <div className="flex items-stretch gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => goTo(slideIndex - 1)}
              className="flex shrink-0 items-center justify-center rounded-full w-9 h-9 sm:w-10 sm:h-10 border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition z-10"
              aria-label="Depoimento anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0 max-w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 shadow-sm overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slideIndex}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-row gap-3 items-center"
                >
                  <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden bg-slate-200 ring-2 ring-white shadow flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={TESTIMONIALS[slideIndex].image}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 object-cover object-top"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling
                        if (fallback) (fallback as HTMLElement).style.display = 'flex'
                      }}
                    />
                    <span
                      className="absolute inset-0 hidden items-center justify-center text-lg font-bold text-slate-600 bg-slate-200"
                      style={{ display: 'none' }}
                      aria-hidden
                    >
                      {TESTIMONIALS[slideIndex].name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col py-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                      <p className="font-bold text-slate-900 text-sm">{TESTIMONIALS[slideIndex].name}</p>
                      <p className="text-xs text-slate-500">{TESTIMONIALS[slideIndex].handle}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-800 leading-snug">
                      {TESTIMONIALS[slideIndex].text}
                    </p>
                    <div className="mt-2 flex flex-row gap-4 text-slate-500">
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                      <Repeat2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                      <Heart className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                      <Bookmark className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => goTo(slideIndex + 1)}
              className="flex shrink-0 items-center justify-center rounded-full w-9 h-9 sm:w-10 sm:h-10 border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition z-10"
              aria-label="Próximo depoimento"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSlideIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === slideIndex ? 'w-5 bg-[#0B4BFF]' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Ir para depoimento ${i + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Card de preço: R$ 29,90, 12x R$ 2,49, R$ 0,08/dia - mais organizado */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35 }}
          className="mt-6 relative rounded-2xl bg-slate-800 px-4 py-5 text-white overflow-hidden"
        >
          <div className="absolute right-0 top-0 flex">
            <div className="rounded-bl-lg bg-[#0B4BFF] px-3 py-1.5 text-xs font-bold text-white">
              PROMOÇÃO 50% OFF
            </div>
          </div>
          <div className="flex items-start gap-3 pt-2">
            <Lock className="h-8 w-8 shrink-0 text-sky-400 mt-0.5" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-lg font-bold">Plano ANUAL</p>
              <p className="text-2xl font-bold tracking-tight">12x de R$ 2,49</p>
              <p className="text-sm opacity-90">ou R$ 29,90 à vista</p>
              <p className="text-xs text-slate-400 pt-0.5">
                (equivalente à menos de R$ 0,08 por dia)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Sem seção de parcerias (4º print removido) */}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.35 }}
          className="mt-10"
        >
          <button
            type="button"
            onClick={() => {
              if (captureData?.email && captureData?.celularDigits) setShowCheckout(true)
              else setCaptureOpen(true)
            }}
            className="w-full rounded-2xl py-4 text-base font-bold text-white bg-[#0B4BFF] shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
          >
            Quero assinar
          </button>
          <p className="mt-4 text-center text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Ao assinar, você concorda com nossos{' '}
            <Link href="/termos" className="text-[#0B4BFF] underline hover:no-underline">Termos de Uso</Link>
            {' '}e{' '}
            <Link href="/privacidade" className="text-[#0B4BFF] underline hover:no-underline">Política de Privacidade</Link>.
            O pagamento é processado de forma segura.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
