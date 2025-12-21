'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ModalConfirmarEmail from './ModalConfirmarEmail'
import { Mail, AlertCircle } from 'lucide-react'

interface EmailVerificadoGuardProps {
  children: React.ReactNode
  feature?: string
}

export default function EmailVerificadoGuard({ children, feature = 'esta funcionalidade' }: EmailVerificadoGuardProps) {
  const [emailVerificado, setEmailVerificado] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const verificarEmail = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          setEmailVerificado(false)
          setLoading(false)
          return
        }

        setUserEmail(user.email || '')
        
        // CRÍTICO: Verificar se email foi confirmado muito rapidamente (menos de 30 segundos)
        // Se foi, provavelmente foi pelo bypass automático e deve ser considerado NÃO confirmado
        
        const emailConfirmedAt = user.email_confirmed_at
        
        // Se email_confirmed_at existe e não é null, está confirmado
        const isConfirmed = emailConfirmedAt !== null && emailConfirmedAt !== undefined && emailConfirmedAt !== ''
        
        // Forçar refresh da sessão para garantir estado atualizado
        await supabase.auth.refreshSession()
        
        console.log('🔍 EmailVerificadoGuard - Verificação:', {
          emailConfirmedAt,
          isConfirmed
        })
        
        console.log('🔍 EmailVerificadoGuard - Verificando email:', {
          email: user.email,
          email_confirmed_at: emailConfirmedAt,
          isConfirmed,
          tipo: typeof emailConfirmedAt
        })
        
        setEmailVerificado(isConfirmed)
        setLoading(false)

        // NÃO mostrar modal automaticamente - apenas bloquear o conteúdo
        // O usuário pode clicar no botão para verificar quando quiser
      } catch (error) {
        console.error('Erro ao verificar email:', error)
        setEmailVerificado(false)
        setLoading(false)
      }
    }

    verificarEmail()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-brand-midnight dark:text-brand-clean/60">Verificando...</p>
      </div>
    )
  }

  if (!emailVerificado) {
    return (
      <>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
              <AlertCircle className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-2">
                Email não confirmado
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
                Para usar {feature}, você precisa confirmar seu email primeiro. Verifique sua caixa de entrada e insira o código de confirmação.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-smooth font-medium"
              >
                <Mail size={18} />
                Verificar email agora
              </button>
            </div>
          </div>
        </div>

        {showModal && userEmail && (
          <ModalConfirmarEmail
            email={userEmail}
            obrigatorio={false}
            onConfirmado={() => {
              setShowModal(false)
              setEmailVerificado(true)
              // Recarregar a página para atualizar o estado
              window.location.reload()
            }}
            onClose={() => {
              setShowModal(false)
              // Permitir fechar o modal, mas o usuário ainda não poderá usar as funcionalidades
            }}
          />
        )}
      </>
    )
  }

  return <>{children}</>
}

