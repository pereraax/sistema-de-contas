'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, X } from 'lucide-react'

interface ModalEmailConfirmadoSucessoProps {
  onClose?: () => void
}

export default function ModalEmailConfirmadoSucesso({ onClose }: ModalEmailConfirmadoSucessoProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const emailConfirmed = searchParams.get('emailConfirmed')
    
    if (emailConfirmed === 'true') {
      setIsOpen(true)
      
      // Limpar parâmetro da URL após 5 segundos
      setTimeout(() => {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('emailConfirmed')
        router.replace(newUrl.pathname + (newUrl.search ? newUrl.search : ''))
      }, 5000)
    }
  }, [searchParams, router])

  const handleClose = async () => {
    setIsOpen(false)
    
    // Limpar parâmetro da URL
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('emailConfirmed')
    router.replace(newUrl.pathname + (newUrl.search ? newUrl.search : ''))
    
    if (onClose) {
      onClose()
    }
    
    // Forçar refresh do usuário para garantir que o estado está atualizado
    // Aguardar um pouco antes de recarregar
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div 
        className="bg-gradient-to-br from-brand-royal to-brand-midnight rounded-xl max-w-md w-full shadow-2xl animate-slide-up overflow-hidden border border-brand-aqua/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-aqua/20 bg-brand-midnight/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/25 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-brand-clean">
                  Email Confirmado!
                </h2>
                <p className="text-sm text-brand-clean/70">
                  Sua conta foi verificada com sucesso
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-brand-aqua/10 rounded transition-smooth flex-shrink-0"
            >
              <X size={20} className="text-brand-clean/50" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4 bg-brand-royal/50">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-brand-clean">
                Parabéns! 🎉
              </h3>
              <p className="text-sm text-brand-clean/80 leading-relaxed">
                Seu email foi confirmado com sucesso. Agora você pode usar todas as funcionalidades da plataforma.
              </p>
            </div>
          </div>

          <div className="bg-brand-aqua/10 rounded-lg px-4 py-3 border border-brand-aqua/20">
            <p className="text-xs text-brand-clean/70 text-center">
              Você será redirecionado em alguns instantes...
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full px-4 py-3 bg-brand-aqua hover:bg-brand-aqua/90 text-brand-midnight font-semibold rounded-lg transition-smooth"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

