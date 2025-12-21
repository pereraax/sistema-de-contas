'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface SlideExplicacao {
  imagem: string
  titulo: string
  descricao: string
}

interface ModalExplicacaoFuncionalidadeProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  slides: SlideExplicacao[]
}

export default function ModalExplicacaoFuncionalidade({
  isOpen,
  onClose,
  feature,
  slides,
}: ModalExplicacaoFuncionalidadeProps) {
  const [slideAtual, setSlideAtual] = useState(0)

  if (!isOpen || slides.length === 0) return null

  const slideAnterior = () => {
    setSlideAtual((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const slideProximo = () => {
    setSlideAtual((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const slide = slides[slideAtual]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop transparente - não muda o fundo */}
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />

      {/* Modal - mais compacto */}
      <div className="relative bg-gradient-to-br from-brand-royal via-brand-midnight to-brand-royal rounded-3xl shadow-2xl border-2 border-brand-aqua/50 w-full max-w-3xl max-h-[85vh] overflow-hidden animate-scale-in">
        {/* Header - mais compacto */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-brand-aqua/20 bg-brand-midnight/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-aqua/20 rounded-lg">
              <Sparkles size={20} className="text-brand-aqua" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white">
                Como funciona: {feature}
              </h2>
              <p className="text-xs text-brand-clean/60">
                {slideAtual + 1} de {slides.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-smooth"
          >
            <X size={18} className="text-brand-clean/60" />
          </button>
        </div>

        {/* Content - mais compacto */}
        <div className="p-4 bg-brand-royal/50">
          {/* Imagem - menor */}
          <div className="relative w-full h-48 md:h-64 mb-4 rounded-xl overflow-hidden border-2 border-brand-aqua/30 bg-brand-midnight/50 flex items-center justify-center">
            <Image
              src={slide.imagem}
              alt={slide.titulo}
              width={800}
              height={600}
              className="object-contain w-full h-full"
              unoptimized
              onError={(e) => {
                // Se a imagem não existir, mostrar placeholder
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const placeholder = target.parentElement?.querySelector('.placeholder')
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = 'flex'
                }
              }}
            />
            <div className="placeholder hidden absolute inset-0 items-center justify-center text-brand-clean/40">
              <div className="text-center">
                <Sparkles size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Imagem em breve</p>
              </div>
            </div>
          </div>

          {/* Título e Descrição - mais compacto */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-display font-bold text-white mb-2">
              {slide.titulo}
            </h3>
            <p className="text-brand-clean/80 leading-relaxed text-sm">
              {slide.descricao}
            </p>
          </div>

          {/* Indicadores de slides */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setSlideAtual(index)}
                className={`h-2 rounded-full transition-smooth ${
                  index === slideAtual
                    ? 'w-8 bg-brand-aqua'
                    : 'w-2 bg-brand-aqua/30 hover:bg-brand-aqua/50'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navegação - mais compacta */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={slideAnterior}
              className="px-3 py-2 bg-brand-midnight/50 hover:bg-brand-midnight border border-brand-aqua/30 rounded-lg text-white transition-smooth flex items-center gap-1.5 text-sm"
            >
              <ChevronLeft size={18} />
              <span>Anterior</span>
            </button>

            <button
              onClick={slideProximo}
              className="px-3 py-2 bg-brand-aqua hover:bg-brand-aqua/90 text-brand-midnight rounded-lg font-semibold transition-smooth flex items-center gap-1.5 text-sm"
            >
              <span>Próximo</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

