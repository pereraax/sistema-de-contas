'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ModalConfirmarEmail from './ModalConfirmarEmail'
import { Mail, AlertCircle } from 'lucide-react'

export default function AvisoEmailNaoConfirmado() {
  const [emailVerificado, setEmailVerificado] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const searchParams = useSearchParams()

  const verificarEmail = async () => {
    try {
      const supabase = createClient()
      
      // Forçar refresh do usuário para garantir que temos o estado mais recente
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        setEmailVerificado(true) // Se não conseguir verificar, assumir que está OK para não bloquear
        setLoading(false)
        return
      }

      setUserEmail(user.email || '')
      
      // Verificar se email está realmente confirmado
      // Se email_confirmed_at existe e não é null, está confirmado
      const emailConfirmedAt = user.email_confirmed_at
      const isConfirmed = emailConfirmedAt !== null && emailConfirmedAt !== undefined && emailConfirmedAt !== ''
      
      // Forçar refresh da sessão para garantir estado atualizado
      await supabase.auth.refreshSession()
      
      console.log('🔍 Verificando email confirmado:', {
        email: user.email,
        email_confirmed_at: emailConfirmedAt,
        isConfirmed
      })
      
      setEmailVerificado(isConfirmed)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao verificar email:', error)
      setEmailVerificado(true) // Em caso de erro, assumir que está OK
      setLoading(false)
    }
  }

  useEffect(() => {
    verificarEmail()
    
    // Verificar novamente quando houver emailConfirmed na URL (vindo do callback)
    const emailConfirmed = searchParams.get('emailConfirmed')
    if (emailConfirmed === 'true') {
      console.log('✅ Email foi confirmado via link - verificando novamente...')
      // Aguardar um pouco e verificar novamente para garantir que o estado está atualizado
      setTimeout(() => {
        verificarEmail()
      }, 1000)
    }
  }, [searchParams])
  
  // Verificar novamente quando a página receber foco (usuário voltou da confirmação)
  useEffect(() => {
    const handleFocus = () => {
      verificarEmail()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (loading || emailVerificado) {
    return null
  }

  return (
    <>
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6 relative">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
            <AlertCircle className="text-orange-600 dark:text-orange-400" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 mb-2">
              Email não confirmado
            </h3>
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
              Para usar todas as funcionalidades, você precisa confirmar seu email primeiro. Verifique sua caixa de entrada e insira o código de confirmação.
            </p>
            <button
              onClick={() => {
                console.log('🔘 Botão "Verificar email agora" clicado!')
                console.log('📧 Email do usuário:', userEmail)
                setShowModal(true)
              }}
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
          key={userEmail} // Forçar remontagem quando email mudar
          email={userEmail}
          obrigatorio={false}
          onConfirmado={() => {
            console.log('✅ Email confirmado! Recarregando página...')
            setShowModal(false)
            setEmailVerificado(true)
            // Recarregar a página para atualizar o estado
            window.location.reload()
          }}
          onClose={() => {
            console.log('❌ Modal fechado sem confirmar')
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}

