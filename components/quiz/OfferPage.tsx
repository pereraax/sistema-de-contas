'use client'

import { motion } from 'framer-motion'
import { Clock, Lock } from 'lucide-react'

type OfferPageProps = {
  onContinue: () => void
}

export function OfferPage({ onContinue }: OfferPageProps) {
  return (
    <section className="relative min-h-screen bg-white pb-10">
      <div className="mx-auto w-full max-w-[520px] px-5 sm:px-6 py-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center text-slate-700 text-base"
        >
          ...nossa inteligência artificial por apenas:
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.35 }}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#0B4BFF] px-4 py-3 text-white"
        >
          <Clock className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">Oferta por tempo limitado: 12:57</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex gap-3">
            <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-lg font-semibold">
              N
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">Neide</p>
              <p className="text-xs text-slate-500">@neidesilva_amorim</p>
              <p className="mt-2 text-sm text-slate-800 leading-relaxed">
                Nunca me dei bem com planilhas ou blocos de nota pra organização! O fato de eu
                conseguir ter controle total do meu dinheiro pelo whatsapp é incrível
              </p>
              <div className="mt-3 flex gap-4 text-slate-400">
                <span className="text-xs">Reply</span>
                <span className="text-xs">Repost</span>
                <span className="text-xs">Like</span>
                <span className="text-xs">Share</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#0B4BFF]" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="h-2 w-2 rounded-full bg-slate-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.35 }}
          className="mt-6 relative rounded-2xl bg-slate-800 px-4 py-5 text-white"
        >
          <div className="absolute right-0 top-0 flex">
            <div className="rounded-bl-lg bg-[#0B4BFF] px-3 py-1.5 text-xs font-bold text-white">
              PROMOÇÃO 50% OFF
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Lock className="h-8 w-8 shrink-0 text-sky-400" />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">Plano ANUAL</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0">
                <span className="text-sm opacity-90">12x de</span>
                <span className="text-2xl font-bold">R$ 4,75</span>
              </div>
              <p className="mt-0.5 text-sm opacity-85">ou R$ 57 à vista</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            (equivalente à menos de R$ 0,16 por dia)
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-8"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <span className="text-lg font-bold">A</span>
            </div>
            <div>
              <p className="font-bold uppercase tracking-tight text-slate-800 text-sm">
                ABSTARTUPS
              </p>
              <p className="text-[10px] uppercase text-slate-500">
                Associação Brasileira de Startups
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200">
              <span className="text-xl font-bold text-slate-600">∞</span>
            </div>
            <p className="font-bold text-slate-800">Meta</p>
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.35 }}
          className="mt-4 text-center text-sm text-slate-500"
        >
          Somos associados com a Meta e ABStartups para entregar o melhor produto
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.35 }}
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
