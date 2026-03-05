'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, X } from 'lucide-react'

interface ModalEmailConfirmadoSucessoProps {
  onClose?: () => void
}

function ModalEmailConfirmadoSucessoContent({ onClose }: ModalEmailConfirmadoSucessoProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const emailConfirmed = searchParams?.get('emailConfirmed')
    const mensagem = searchParams?.get('mensagem')
    const cookieConfirmed = typeof document !== 'undefined' && document.cookie.includes('email_confirmed=true')
    const sessionFlag = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('email_just_confirmed') === '1'
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

    const isLoginOrHome = pathname === '/login' || pathname === '/'
    const mensagemConfirmacao = mensagem && (mensagem.includes('confirmado') || mensagem.includes('confirmada') || mensagem.includes('verificad'))

    if (emailConfirmed === 'true' || cookieConfirmed || sessionFlag || (isLoginOrHome && mensagemConfirmacao)) {
      setIsOpen(true)
      if (cookieConfirmed) {
        document.cookie = 'email_confirmed=; path=/; max-age=0'
      }
      if (sessionFlag) {
        try { sessionStorage.removeItem('email_just_confirmed') } catch { /* ignore */ }
      }
    }
  }, [searchParams, router])

  const handleClose = async () => {
    setIsOpen(false)

    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('emailConfirmed')
    newUrl.searchParams.delete('mensagem')
    const newSearch = newUrl.searchParams.toString()
    router.replace(newUrl.pathname + (newSearch ? '?' + newSearch : ''))

    if (onClose) onClose()

    setTimeout(() => {
      window.location.reload()
    }, 300)
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
                Seu email foi confirmado com sucesso. Agora você pode usar as funcionalidades e voltar no WhatsApp para registrar com a assistente!
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
            className="w-full px-4 py-3 bg-brand-aqua hover:bg-brand-aqua/90 text-white font-semibold rounded-lg transition-smooth"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ModalEmailConfirmadoSucesso({ onClose }: ModalEmailConfirmadoSucessoProps) {
  return (
    <Suspense fallback={null}>
      <ModalEmailConfirmadoSucessoContent onClose={onClose} />
    </Suspense>
  )
}

