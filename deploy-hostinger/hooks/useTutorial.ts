'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseTutorialOptions {
  tutorialId: string
  shouldShow: boolean // Se deve mostrar o tutorial (ex: usuário tem plano pago)
}

export function useTutorial({ tutorialId, shouldShow }: UseTutorialOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkTutorialStatus() {
      if (!shouldShow) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        // Verificar se já viu o tutorial no banco
        const { data: visto } = await supabase
          .from('tutoriais_vistos')
          .select('id')
          .eq('user_id', user.id)
          .eq('tutorial_id', tutorialId)
          .single()

        // Verificar também no localStorage (fallback)
        const vistoLocalStorage = localStorage.getItem(`tutorial_${tutorialId}_visto`)

        if (visto || vistoLocalStorage) {
          setIsOpen(false)
        } else {
          // Mostrar tutorial após um pequeno delay para garantir que a página carregou
          setTimeout(() => {
            setIsOpen(true)
          }, 500)
        }
      } catch (error) {
        console.error('Erro ao verificar status do tutorial:', error)
        // Em caso de erro, verificar localStorage
        const vistoLocalStorage = localStorage.getItem(`tutorial_${tutorialId}_visto`)
        if (!vistoLocalStorage) {
          setTimeout(() => {
            setIsOpen(true)
          }, 500)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkTutorialStatus()
  }, [tutorialId, shouldShow])

  const markAsSeen = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Salvar no banco
        await supabase
          .from('tutoriais_vistos')
          .upsert({
            user_id: user.id,
            tutorial_id: tutorialId,
            visto_em: new Date().toISOString(),
          })

        // Salvar no localStorage também (fallback)
        localStorage.setItem(`tutorial_${tutorialId}_visto`, 'true')
      }
    } catch (error) {
      console.error('Erro ao marcar tutorial como visto:', error)
      // Fallback: salvar apenas no localStorage
      localStorage.setItem(`tutorial_${tutorialId}_visto`, 'true')
    }

    setIsOpen(false)
  }

  const resetTutorial = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Remover do banco
        await supabase
          .from('tutoriais_vistos')
          .delete()
          .eq('user_id', user.id)
          .eq('tutorial_id', tutorialId)

        // Remover do localStorage
        localStorage.removeItem(`tutorial_${tutorialId}_visto`)
      } else {
        // Se não tem usuário, apenas remover do localStorage
        localStorage.removeItem(`tutorial_${tutorialId}_visto`)
      }
    } catch (error) {
      console.error('Erro ao resetar tutorial:', error)
      // Fallback: remover apenas do localStorage
      localStorage.removeItem(`tutorial_${tutorialId}_visto`)
    }

    // Abrir tutorial novamente
    setIsOpen(true)
  }

  return {
    isOpen,
    isLoading,
    markAsSeen,
    resetTutorial,
    close: () => setIsOpen(false),
  }
}

