'use client'

import { X, TrendingUp, TrendingDown } from 'lucide-react'

interface ModalSelecionarTipoProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (tipo: 'entrada' | 'saida' | '') => void
  selectedTipo?: 'entrada' | 'saida' | ''
}

export default function ModalSelecionarTipo({
  isOpen,
  onClose,
  onSelect,
  selectedTipo
}: ModalSelecionarTipoProps) {
  const tipos = [
    {
      value: 'entrada' as const,
      label: 'Entrada',
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800/30',
      iconColor: 'text-green-600 dark:text-green-400',
      textColor: 'text-green-700 dark:text-green-300',
      hoverBg: 'hover:bg-green-100 dark:hover:bg-green-900/30',
    },
    {
      value: 'saida' as const,
      label: 'Saída',
      icon: TrendingDown,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800/30',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-700 dark:text-red-300',
      hoverBg: 'hover:bg-red-100 dark:hover:bg-red-900/30',
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-white via-white to-gray-50 dark:from-brand-royal dark:via-brand-midnight dark:to-brand-royal rounded-3xl max-w-md w-full shadow-2xl animate-slide-up overflow-hidden border-2 border-brand-aqua/30 dark:border-brand-aqua/40">
        <div className="flex-shrink-0 border-b-2 border-brand-aqua/20 dark:border-brand-aqua/30 px-6 py-5 flex items-center justify-between bg-gradient-to-r from-brand-aqua to-blue-500 dark:from-brand-midnight dark:to-brand-royal">
          <h2 className="text-xl font-display font-bold text-white dark:text-brand-clean">
            Selecionar Tipo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 dark:hover:bg-red-500/30 rounded-xl transition-smooth"
          >
            <X size={20} className="text-white dark:text-brand-clean" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {/* Opção para remover seleção */}
          <button
            onClick={() => {
              onSelect('')
              onClose()
            }}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              !selectedTipo
                ? 'bg-brand-aqua/20 dark:bg-brand-aqua/30 border-brand-aqua dark:border-brand-aqua/50 shadow-md'
                : 'bg-gray-50 dark:bg-brand-midnight/50 border-gray-200 dark:border-brand-midnight/50 hover:border-gray-300 dark:hover:border-brand-midnight'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                !selectedTipo
                  ? 'bg-brand-aqua/30 dark:bg-brand-aqua/40'
                  : 'bg-gray-200 dark:bg-brand-midnight'
              }`}>
                <X size={20} className={!selectedTipo ? 'text-brand-aqua' : 'text-gray-400 dark:text-gray-500'} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${!selectedTipo ? 'text-brand-midnight dark:text-brand-clean' : 'text-gray-600 dark:text-gray-400'}`}>
                  Nenhum
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Não classificar
                </p>
              </div>
              {!selectedTipo && (
                <div className="w-5 h-5 rounded-full bg-brand-aqua flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              )}
            </div>
          </button>

          {/* Opções de tipo */}
          {tipos.map((tipo) => {
            const Icon = tipo.icon
            const isSelected = selectedTipo === tipo.value

            return (
              <button
                key={tipo.value}
                onClick={() => {
                  onSelect(tipo.value)
                  onClose()
                }}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? `${tipo.bgColor} ${tipo.borderColor} border-opacity-100 shadow-md scale-[1.02]`
                    : `bg-white dark:bg-brand-royal ${tipo.borderColor} border-opacity-50 hover:border-opacity-100 ${tipo.hoverBg}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected
                      ? `${tipo.bgColor}`
                      : 'bg-gray-100 dark:bg-brand-midnight'
                  }`}>
                    <Icon size={20} className={isSelected ? tipo.iconColor : 'text-gray-400 dark:text-gray-500'} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      isSelected ? tipo.textColor : 'text-brand-midnight dark:text-brand-clean'
                    }`}>
                      {tipo.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {tipo.value === 'entrada' ? 'Dinheiro recebido' : 'Dinheiro gasto'}
                    </p>
                  </div>
                  {isSelected && (
                    <div className={`w-5 h-5 rounded-full ${tipo.bgColor} flex items-center justify-center border-2 ${tipo.borderColor}`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${tipo.value === 'entrada' ? 'bg-green-600 dark:bg-green-400' : 'bg-red-600 dark:bg-red-400'}`}></div>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

