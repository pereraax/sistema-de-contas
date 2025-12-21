'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface TutorialStep {
  id: string
  target: string // ID ou seletor CSS do elemento
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface TutorialOverlayProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  steps: TutorialStep[]
  tutorialId: string
}

export default function TutorialOverlay({
  isOpen,
  onClose,
  onComplete,
  steps,
  tutorialId,
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || steps.length === 0) return

    const step = steps[currentStep]
    if (!step) return

    // Buscar elemento alvo
    const element = document.querySelector(step.target) as HTMLElement
    setTargetElement(element)

    if (element) {
      // Calcular posição do popup
      const rect = element.getBoundingClientRect()
      const scrollY = window.scrollY
      const scrollX = window.scrollX

      let top = rect.top + scrollY
      let left = rect.left + scrollX

      // Ajustar posição baseado na preferência
      switch (step.position) {
        case 'top':
          top = rect.top + scrollY - 10
          left = rect.left + scrollX + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + scrollY + 10
          left = rect.left + scrollX + rect.width / 2
          break
        case 'left':
          top = rect.top + scrollY + rect.height / 2
          left = rect.left + scrollX - 10
          break
        case 'right':
          top = rect.top + scrollY + rect.height / 2
          left = rect.right + scrollX + 10
          break
        case 'center':
        default:
          top = rect.top + scrollY + rect.height / 2
          left = rect.left + scrollX + rect.width / 2
          break
      }

      // Garantir que o popup não saia da tela
      const popupWidth = 384 // w-96 = 384px
      const popupHeight = 300 // altura aproximada
      const margin = 20

      if (left < margin) left = margin
      if (left > window.innerWidth - popupWidth - margin) {
        left = window.innerWidth - popupWidth - margin
      }
      if (top < margin) top = margin
      if (top > window.innerHeight - popupHeight - margin) {
        top = window.innerHeight - popupHeight - margin
      }

      setPopupPosition({ top, left })

      // Scroll para o elemento se necessário
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentStep, isOpen, steps])

  if (!isOpen || steps.length === 0) return null

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <>
      {/* Overlay claro com highlight */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998]"
        onClick={handleSkip}
      >
        {targetElement ? (() => {
          const rect = targetElement.getBoundingClientRect()
          const padding = 10
          
          // Coordenadas da viewport (fixed positioning)
          const highlightTop = Math.max(0, rect.top - padding)
          const highlightLeft = Math.max(0, rect.left - padding)
          const highlightRight = Math.min(window.innerWidth, rect.right + padding)
          const highlightBottom = Math.min(window.innerHeight, rect.bottom + padding)
          const highlightHeight = highlightBottom - highlightTop
          
          return (
            <>
              {/* Overlay escuro com blur - 4 retângulos cobrindo toda a tela EXCETO a área destacada */}
              
              {/* Topo - cobre toda a largura de 0 até highlightTop */}
              <div
                className="absolute bg-black/20 backdrop-blur-sm pointer-events-none"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${highlightTop}px`,
                }}
              />
              
              {/* Esquerda - cobre da highlightTop até highlightBottom, de 0 até highlightLeft */}
              <div
                className="absolute bg-black/20 backdrop-blur-sm pointer-events-none"
                style={{
                  position: 'fixed',
                  top: `${highlightTop}px`,
                  left: 0,
                  width: `${highlightLeft}px`,
                  height: `${highlightHeight}px`,
                }}
              />
              
              {/* Direita - cobre da highlightTop até highlightBottom, de highlightRight até o fim */}
              <div
                className="absolute bg-black/20 backdrop-blur-sm pointer-events-none"
                style={{
                  position: 'fixed',
                  top: `${highlightTop}px`,
                  left: `${highlightRight}px`,
                  right: 0,
                  height: `${highlightHeight}px`,
                }}
              />
              
              {/* Fundo - cobre toda a largura de highlightBottom até o fim */}
              <div
                className="absolute bg-black/20 backdrop-blur-sm pointer-events-none"
                style={{
                  position: 'fixed',
                  top: `${highlightBottom}px`,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              
              {/* Borda azul pulsante ao redor da área destacada - por cima de tudo */}
              <div
                className="absolute border-4 border-brand-aqua rounded-xl pointer-events-none animate-pulse z-30"
                style={{
                  position: 'fixed',
                  top: rect.top - 4,
                  left: rect.left - 4,
                  width: rect.width + 8,
                  height: rect.height + 8,
                  boxShadow: '0 0 0 2px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2)',
                }}
              />
            </>
          )
        })() : (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-none" />
        )}
      </div>

      {/* Popup de explicação */}
      <div
        className="fixed z-[9999] w-80 md:w-96 bg-gradient-to-br from-brand-royal via-brand-midnight to-brand-royal rounded-2xl shadow-2xl border-2 border-brand-aqua/50 p-6 animate-scale-in"
        style={{
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          transform: step.position === 'left' || step.position === 'right' 
            ? 'translateY(-50%)' 
            : step.position === 'top' || step.position === 'bottom'
            ? 'translateX(-50%)'
            : 'translate(-50%, -50%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-aqua/20 rounded-lg">
              <Sparkles size={18} className="text-brand-aqua" />
            </div>
            <span className="text-sm text-brand-clean/60">
              {currentStep + 1} de {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-white/10 rounded-lg transition-smooth"
          >
            <X size={18} className="text-brand-clean/60" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="mb-6">
          <h3 className="text-xl font-display font-bold text-white mb-2">
            {step.title}
          </h3>
          <p className="text-brand-clean/80 text-sm leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={isFirst}
            className="px-4 py-2 bg-brand-midnight/50 hover:bg-brand-midnight border border-brand-aqua/30 rounded-lg text-white transition-smooth flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <button
            onClick={handleSkip}
            className="px-4 py-2 text-brand-clean/60 hover:text-brand-clean transition-smooth text-sm"
          >
            Pular tutorial
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-brand-aqua hover:bg-brand-aqua/90 text-brand-midnight rounded-lg font-semibold transition-smooth flex items-center gap-2 text-sm"
          >
            {isLast ? 'Finalizar' : 'Próximo'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

