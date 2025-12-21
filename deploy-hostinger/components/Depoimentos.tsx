'use client'

import { Star } from 'lucide-react'

interface Depoimento {
  nome: string
  profissao: string
  foto: string
  avaliacao: number
  texto: string
  plano?: 'teste' | 'basico' | 'premium'
}

interface DepoimentosProps {
  depoimentos: Depoimento[]
  variant?: 'default' | 'compact'
}

export default function Depoimentos({ depoimentos, variant = 'default' }: DepoimentosProps) {
  const isCompact = variant === 'compact'

  return (
    <div className={`grid ${isCompact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
      {depoimentos.map((depoimento, index) => (
        <div
          key={index}
          className="bg-brand-royal/50 backdrop-blur-sm rounded-2xl p-6 border border-brand-aqua/20 hover:border-brand-aqua/50 transition-smooth"
        >
          {/* Avaliação */}
          <div className="flex items-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < depoimento.avaliacao ? 'text-yellow-400 fill-yellow-400' : 'text-brand-clean/30'}
              />
            ))}
          </div>

          {/* Texto do depoimento */}
          <p className="text-brand-clean/90 mb-6 leading-relaxed">
            "{depoimento.texto}"
          </p>

          {/* Informações do autor */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-aqua/30 to-brand-royal flex items-center justify-center text-brand-aqua font-bold text-lg">
              {depoimento.foto}
            </div>
            <div>
              <p className="text-brand-white font-semibold">{depoimento.nome}</p>
              <p className="text-brand-clean/60 text-sm">{depoimento.profissao}</p>
              {depoimento.plano && (
                <span className="text-xs text-brand-aqua/80 mt-1 inline-block">
                  Plano {depoimento.plano === 'basico' ? 'Básico' : depoimento.plano === 'premium' ? 'Premium' : 'Teste'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}




