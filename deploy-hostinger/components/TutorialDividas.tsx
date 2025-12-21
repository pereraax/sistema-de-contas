'use client'

import { useEffect, useState } from 'react'
import TutorialOverlay from './TutorialOverlay'
import { useTutorial } from '@/hooks/useTutorial'
import { createClient } from '@/lib/supabase/client'
import { Sparkles } from 'lucide-react'

interface TutorialDividasProps {
  dividasCount: number
  onShowTutorial?: () => void
}

export default function TutorialDividas({ dividasCount, onShowTutorial }: TutorialDividasProps) {
  const [shouldShow, setShouldShow] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkPlan() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setShouldShow(false)
          setIsChecking(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('plano, plano_status, plano_data_fim')
          .eq('id', user.id)
          .single()

        if (!profile) {
          setShouldShow(false)
          setIsChecking(false)
          return
        }

        // Verificar se tem plano pago (basico ou premium) e está ativo
        const temPlanoPago = (profile.plano === 'basico' || profile.plano === 'premium')
        const estaAtivo = profile.plano_status === 'ativo'
        const naoExpirado = profile.plano_data_fim 
          ? new Date(profile.plano_data_fim) > new Date()
          : false

        // Mostrar tutorial apenas se o usuário tem plano pago, ativo e não expirado
        setShouldShow(temPlanoPago && estaAtivo && naoExpirado)
      } catch (error) {
        console.error('Erro ao verificar plano:', error)
        setShouldShow(false)
      } finally {
        setIsChecking(false)
      }
    }
    checkPlan()
  }, [])

  const { isOpen, isLoading, markAsSeen, resetTutorial } = useTutorial({
    tutorialId: 'dividas',
    shouldShow,
  })

  const [showTutorialManually, setShowTutorialManually] = useState(false)

  const handleShowTutorial = () => {
    resetTutorial()
    setShowTutorialManually(true)
  }

  // Debug: verificar se shouldShow está true
  useEffect(() => {
    console.log('Tutorial Dividas - shouldShow:', shouldShow, 'isChecking:', isChecking)
  }, [shouldShow, isChecking])

  // Steps do tutorial
  const steps = [
    {
      id: 'busca',
      target: '[data-tutorial="busca-dividas"]',
      title: 'Buscar Dívidas',
      description: 'Use o campo de busca para encontrar dívidas específicas por nome, valor ou usuário. É rápido e eficiente!',
      position: 'bottom' as const,
    },
    {
      id: 'registrar',
      target: '[data-tutorial="registrar-divida"]',
      title: 'Registrar Nova Dívida',
      description: 'Clique aqui para registrar uma nova dívida. Você pode definir valor, parcelas, categoria e muito mais.',
      position: 'bottom' as const,
    },
    {
      id: 'estatisticas',
      target: '[data-tutorial="estatisticas-dividas"]',
      title: 'Estatísticas de Dívidas',
      description: 'Acompanhe o total de dívidas pendentes, o valor que ainda falta pagar e seu progresso geral de quitação.',
      position: 'bottom' as const,
    },
    {
      id: 'tabela',
      target: '[data-tutorial="tabela-dividas"]',
      title: 'Lista de Dívidas',
      description: 'Aqui você vê todas as suas dívidas organizadas. Dívidas pendentes aparecem primeiro, seguidas das quitadas.',
      position: 'top' as const,
    },
    {
      id: 'pagar',
      target: '[data-tutorial="pagar-divida"]',
      title: 'Pagar Dívida',
      description: 'Clique em "Pagar Dívida" para registrar um pagamento. Você pode pagar parcialmente ou quitar completamente.',
      position: 'left' as const,
    },
    {
      id: 'acoes',
      target: '[data-tutorial="acoes-divida"]',
      title: 'Editar ou Excluir',
      description: 'Use os ícones para editar informações da dívida ou excluí-la se necessário. Cuidado ao excluir!',
      position: 'left' as const,
    },
  ]

  return (
    <>
      {!isChecking && !isLoading && (
        <TutorialOverlay
          isOpen={isOpen || showTutorialManually}
          onClose={() => {
            markAsSeen()
            setShowTutorialManually(false)
          }}
          onComplete={() => {
            markAsSeen()
            setShowTutorialManually(false)
          }}
          steps={steps}
          tutorialId="dividas"
        />
      )}
      {/* Botão discreto para ver tutorial novamente */}
      {shouldShow && !isChecking && (
        <button
          onClick={handleShowTutorial}
          className="fixed bottom-6 left-6 z-[60] p-3 bg-brand-aqua/20 hover:bg-brand-aqua/30 backdrop-blur-sm border-2 border-brand-aqua/50 rounded-full transition-smooth group shadow-xl hover:shadow-2xl"
          title="Ver tutorial novamente"
          aria-label="Ver tutorial novamente"
          style={{ 
            minWidth: '48px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}
        >
          <Sparkles 
            size={20} 
            className="text-brand-aqua group-hover:scale-110 transition-transform" 
            strokeWidth={2.5}
          />
        </button>
      )}
    </>
  )
}

