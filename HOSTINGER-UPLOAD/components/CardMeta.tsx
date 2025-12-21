'use client'

import { Trophy, Calendar, TrendingUp } from 'lucide-react'
import type { MetaCofrinho } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CardMetaProps {
  meta: MetaCofrinho
}

export default function CardMeta({ meta }: CardMetaProps) {
  const percentual = ((meta.valor_acumulado || 0) / (meta.meta_total || 1)) * 100

  return (
    <div className="bg-brand-royal rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-green-500/30 shadow-xl hover:shadow-2xl transition-smooth">
      {/* Badge de concluído */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 border border-green-500/50 rounded-full">
          <Trophy size={14} className="sm:w-4 sm:h-4 text-green-400" />
          <span className="text-green-400 font-semibold text-xs sm:text-sm">Concluída</span>
        </div>
        <span className="text-brand-clean text-xs sm:text-sm">
          {meta.data_conclusao ? format(new Date(meta.data_conclusao), 'dd/MM/yyyy', { locale: ptBR }) : ''}
        </span>
      </div>

      {/* Nome da meta */}
      <h3 className="text-lg sm:text-xl font-display font-bold text-brand-white mb-1.5 sm:mb-2">
        {meta.nome}
      </h3>

      {/* Periodicidade */}
      <p className="text-brand-clean text-xs sm:text-sm mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
        <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
        <span className="capitalize">{meta.periodicidade}</span>
      </p>

      {/* Valor e Progresso */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-brand-clean text-xs sm:text-sm">Guardado:</span>
          <span className="text-brand-aqua font-bold text-base sm:text-lg">
            R$ {(meta.valor_acumulado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="flex justify-between items-baseline">
          <span className="text-brand-clean text-xs sm:text-sm">Meta:</span>
          <span className="text-brand-white font-semibold text-sm sm:text-base">
            R$ {(meta.meta_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-2.5 sm:h-3 bg-brand-midnight rounded-full overflow-hidden border border-green-500/30">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
            style={{ width: `${Math.min(percentual, 100)}%` }}
          />
        </div>
        
        <p className="text-center text-green-400 font-bold text-xs sm:text-sm">
          {percentual.toFixed(1)}% atingido
        </p>
      </div>
    </div>
  )
}

