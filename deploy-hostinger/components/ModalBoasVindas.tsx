'use client'

import { useEffect, useState } from 'react'
import { Check, Crown, Sparkles, X } from 'lucide-react'
import confetti from 'canvas-confetti'

interface ModalBoasVindasProps {
  isOpen: boolean
  onClose: () => void
  plano: 'basico' | 'premium'
}

export default function ModalBoasVindas({ isOpen, onClose, plano }: ModalBoasVindasProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Disparar confetes animados
      setShowConfetti(true)
      
      // Configuração dos confetes
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // Confetes da esquerda
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })

        // Confetes da direita
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })

        // Confetes do centro
        confetti({
          ...defaults,
          particleCount: particleCount * 0.5,
          origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 }
        })
      }, 250)

      // Parar confetes após 3 segundos
      setTimeout(() => {
        setShowConfetti(false)
      }, duration)
    }
  }, [isOpen])

  if (!isOpen) return null

  const planoNome = plano === 'basico' ? 'Plano Básico' : 'Plano Premium'
  const planoDescricao = plano === 'basico' 
    ? 'Agora você tem acesso a todas as funcionalidades do plano básico!'
    : 'Agora você tem acesso a todas as funcionalidades premium!'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-gradient-to-br from-brand-royal via-brand-midnight to-brand-royal rounded-3xl p-8 border-2 border-brand-aqua/50 shadow-2xl max-w-md w-full animate-scale-in">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-brand-clean/50 hover:text-white transition-smooth rounded-lg hover:bg-white/10"
        >
          <X size={20} />
        </button>

        {/* Ícone de sucesso animado */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-aqua to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
              <Check size={48} className="text-white" strokeWidth={3} />
            </div>
            <div className="absolute -top-2 -right-2">
              <Crown size={32} className="text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -left-1">
              <Sparkles size={24} className="text-brand-aqua animate-pulse" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-3xl font-display font-bold text-center text-white mb-3">
          Parabéns! 🎉
        </h2>

        {/* Mensagem de boas-vindas */}
        <div className="text-center mb-6">
          <p className="text-xl font-semibold text-brand-aqua mb-2">
            Seja bem-vindo ao {planoNome}!
          </p>
          <p className="text-brand-clean/80 text-sm leading-relaxed">
            {planoDescricao}
          </p>
        </div>

        {/* Lista de benefícios */}
        <div className="bg-brand-midnight/50 rounded-xl p-4 mb-6 border border-brand-aqua/20">
          <p className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-brand-aqua" />
            Seus benefícios:
          </p>
          <ul className="space-y-2 text-sm text-brand-clean/80">
            {plano === 'basico' ? (
              <>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Registros ilimitados</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Criar e gerenciar dívidas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Registrar salário</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Calendário financeiro</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Sistema de metas (até 3)</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Tudo do Plano Básico</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Criar empréstimos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Metas ilimitadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Dashboard avançado</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Upload de documentos</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Botão de ação */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-brand-aqua to-blue-500 text-white rounded-xl font-semibold hover:from-brand-aqua/90 hover:to-blue-400 transition-smooth shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span>Começar a usar</span>
          <Sparkles size={20} />
        </button>
      </div>
    </div>
  )
}

