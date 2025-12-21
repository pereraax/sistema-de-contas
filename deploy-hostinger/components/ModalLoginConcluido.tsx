'use client'

import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'

interface ModalLoginConcluidoProps {
  isOpen: boolean
  onClose: () => void
  mensagem?: string
  titulo?: string
}

export default function ModalLoginConcluido({ isOpen, onClose, mensagem, titulo = 'Login Concluído!' }: ModalLoginConcluidoProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Pequeno delay para animação suave
      setTimeout(() => setShow(true), 100)
      
      // Fechar automaticamente após 3 segundos e redirecionar
      const timer = setTimeout(() => {
        setShow(false)
        setTimeout(() => {
          onClose()
        }, 300)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className={`bg-gradient-to-br from-[#00C2FF] via-[#0099CC] to-[#007A99] rounded-xl max-w-xs w-full shadow-2xl overflow-hidden border border-[#00C2FF]/30 transition-all duration-500 ${
          show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Conteúdo do popup */}
        <div className="p-5 text-center">
          {/* Ícone de sucesso animado */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle size={32} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute inset-0 bg-white/10 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-lg font-display font-bold text-white mb-1.5">
            {titulo}
          </h2>

          {/* Mensagem */}
          <p className="text-white/90 text-xs leading-relaxed">
            {mensagem || 'Você será redirecionado em instantes...'}
          </p>
        </div>

        {/* Barra de progresso animada */}
        <div className="h-0.5 bg-white/20">
          <div 
            className="h-full bg-white/70 animate-progress"
            style={{
              animation: 'progress 3s linear forwards'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  )
}



