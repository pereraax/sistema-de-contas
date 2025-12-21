'use client'

import { AlertTriangle, X } from 'lucide-react'

interface ModalConfirmacaoProps {
  titulo: string
  mensagem: string
  onConfirmar: () => void
  onCancelar: () => void
  textoConfirmar?: string
  textoCancelar?: string
  tipo?: 'danger' | 'warning' | 'info'
  loading?: boolean
}

export default function ModalConfirmacao({
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'warning',
  loading = false,
}: ModalConfirmacaoProps) {
  const cores = {
    danger: {
      bg: 'bg-red-100',
      icon: 'text-red-600',
      botao: 'bg-red-600 hover:bg-red-700',
      border: 'border-red-200',
    },
    warning: {
      bg: 'bg-orange-100',
      icon: 'text-orange-600',
      botao: 'bg-orange-600 hover:bg-orange-700',
      border: 'border-orange-200',
    },
    info: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      botao: 'bg-blue-600 hover:bg-blue-700',
      border: 'border-blue-200',
    },
  }

  const cor = cores[tipo]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-slide-up border-2 border-brand-aqua/30 dark:border-brand-aqua/40">
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-3 ${cor.bg} rounded-xl shadow-lg`}>
            <AlertTriangle className={cor.icon} size={24} strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-display font-bold text-brand-midnight dark:text-brand-clean flex-1">
            {titulo}
          </h3>
          <button
            onClick={onCancelar}
            disabled={loading}
            className="p-2 hover:bg-red-500/20 dark:hover:bg-red-500/30 rounded-xl transition-smooth disabled:opacity-50"
          >
            <X size={20} className="text-brand-midnight dark:text-brand-clean" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-brand-midnight/80 dark:text-brand-clean/70 leading-relaxed">
            {mensagem}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-brand-midnight text-brand-midnight dark:text-brand-clean rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-smooth font-semibold disabled:opacity-50 text-sm border-2 border-gray-200 dark:border-white/20"
          >
            {textoCancelar}
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className={`flex-1 px-4 py-3 ${cor.botao} text-white rounded-xl transition-smooth font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processando...</span>
              </>
            ) : (
              textoConfirmar
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


