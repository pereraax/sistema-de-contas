'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, DollarSign, Hand, CreditCard } from 'lucide-react'
import ModalEditarRegistro from './ModalEditarRegistro'
import ModalSalario from './ModalSalario'
import ModalEmprestimo from './ModalEmprestimo'
import ModalDivida from './ModalDivida'
import UpgradeModal from './UpgradeModal'
import { obterPlanoUsuario } from '@/lib/plano'

interface QuickActionCardProps {
  title: string
  description: string
  buttonText: string
  iconName: 'FileText' | 'DollarSign' | 'Hand' | 'CreditCard'
  type: 'registro' | 'salario' | 'emprestimo' | 'divida'
}

export default function QuickActionCard({
  title,
  description,
  buttonText,
  iconName,
  type
}: QuickActionCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [planoAtual, setPlanoAtual] = useState<'teste' | 'basico' | 'premium'>('teste')
  const [emailVerificado, setEmailVerificado] = useState<boolean | null>(null)

  useEffect(() => {
    async function carregarPlano() {
      const plano = await obterPlanoUsuario()
      setPlanoAtual(plano)
    }
    carregarPlano()
  }, [])

  useEffect(() => {
    async function verificarEmail() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setEmailVerificado(false)
          return
        }
        
        // Verificar o status REAL do email
        // Se email_confirmed_at existe e não é null, está confirmado
        const emailConfirmedAt = user?.email_confirmed_at
        const isConfirmed = emailConfirmedAt !== null && emailConfirmedAt !== undefined && emailConfirmedAt !== ''
        
        // Forçar refresh da sessão para garantir estado atualizado
        await supabase.auth.refreshSession()
        
        console.log('🔍 QuickActionCard - Status de email:', {
          email: user.email,
          emailConfirmedAt,
          isConfirmed
        })
        
        setEmailVerificado(isConfirmed)
      } catch (error) {
        console.error('Erro ao verificar email:', error)
        // Em caso de erro, considerar como NÃO confirmado por segurança
        setEmailVerificado(false)
      }
    }
    verificarEmail()
  }, [])

  const iconMap = {
    FileText: FileText,
    DollarSign: DollarSign,
    Hand: Hand,
    CreditCard: CreditCard,
  }

  const Icon = iconMap[iconName]

  const handleClick = () => {
    // CRÍTICO: Se email não está verificado, BLOQUEAR completamente
    if (emailVerificado === false) {
      // Mostrar mensagem ou modal pedindo para confirmar email
      alert('Por favor, confirme seu email antes de usar esta funcionalidade. Acesse Configurações → Perfil para verificar seu email.')
      return
    }
    
    // Se ainda está verificando, aguardar
    if (emailVerificado === null) {
      return
    }
    
    // Verificar se precisa de plano específico
    if (type === 'divida' && planoAtual === 'teste') {
      setShowUpgradeModal(true)
      return
    }
    if (type === 'salario' && planoAtual === 'teste') {
      setShowUpgradeModal(true)
      return
    }
    if (type === 'emprestimo' && planoAtual !== 'premium') {
      setShowUpgradeModal(true)
      return
    }
    
    setShowModal(true)
  }

  const planoNecessario = 
    type === 'emprestimo' ? 'premium' :
    type === 'divida' || type === 'salario' ? 'basico' :
    'teste'

  // Se email não está verificado, desabilitar o card completamente
  const isDisabled = emailVerificado === false

  return (
    <>
      <div className={`bg-brand-white dark:bg-brand-royal rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-brand-clean dark:border-white/10 hover:shadow-xl transition-smooth animate-slide-up flex flex-col h-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {isDisabled && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-xs text-orange-800 dark:text-orange-200">
              ⚠️ Confirme seu email em Configurações → Perfil para usar esta funcionalidade.
            </p>
          </div>
        )}
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5 flex-1">
          <div className="p-2.5 sm:p-3 bg-brand-aqua/10 dark:bg-brand-aqua/20 rounded-lg sm:rounded-xl flex-shrink-0">
            <Icon size={24} className={`sm:w-7 sm:h-7 ${isDisabled ? 'opacity-50' : ''} text-brand-aqua dark:text-brand-aqua`} strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-base sm:text-lg md:text-xl font-display font-bold mb-2 sm:mb-2.5 ${isDisabled ? 'text-brand-midnight/50 dark:text-brand-clean/50' : 'text-brand-midnight dark:text-brand-clean'}`}>
              {title}
            </h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDisabled ? 'text-brand-midnight/40 dark:text-brand-clean/40' : 'text-brand-midnight/70 dark:text-brand-clean/70'}`}>
              {description}
            </p>
          </div>
        </div>
        <button
          onClick={handleClick}
          disabled={isDisabled}
          className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#2c5aa0] via-[#1e4976] to-[#163a5f] hover:from-[#1e4976] hover:via-[#163a5f] hover:to-[#0f2847] text-white rounded-full font-bold transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-[#1e4976]/40 flex items-center justify-center gap-2 text-sm sm:text-base transform hover:scale-105 active:scale-100 mt-auto ${
            isDisabled 
              ? 'opacity-50 cursor-not-allowed transform-none' 
              : ''
          }`}
        >
          <Plus size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
          {buttonText}
        </button>
      </div>

      {showModal && type === 'registro' && (
        <ModalEditarRegistro
          registro={null}
          onClose={() => setShowModal(false)}
        />
      )}

      {showModal && type === 'salario' && (
        <ModalSalario
          onClose={() => setShowModal(false)}
        />
      )}

      {showModal && type === 'emprestimo' && (
        <ModalEmprestimo
          onClose={() => setShowModal(false)}
        />
      )}

      {showModal && type === 'divida' && (
        <ModalDivida
          onClose={() => setShowModal(false)}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={title}
          planoNecessario={planoNecessario as 'basico' | 'premium'}
          planoAtual={planoAtual}
        />
      )}
    </>
  )
}

