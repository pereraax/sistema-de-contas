'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PlanoBloqueado from './PlanoBloqueado'
import { Loader2 } from 'lucide-react'

interface PlanoGuardProps {
  feature: string
  planoNecessario: 'basico' | 'premium'
  children: React.ReactNode
}

export default function PlanoGuard({ feature, planoNecessario, children }: PlanoGuardProps) {
  const [planoAtual, setPlanoAtual] = useState<'teste' | 'basico' | 'premium' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    // Timeout de segurança (5 segundos)
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('PlanoGuard: Timeout ao carregar plano, usando padrão "teste"')
        setPlanoAtual('teste')
        setLoading(false)
      }
    }, 5000)
    
    async function carregarPlano() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (!user) {
          setPlanoAtual('teste')
          setLoading(false)
          clearTimeout(timeout)
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('plano, plano_status, plano_data_fim')
          .eq('id', user.id)
          .single()

        if (!mounted) return

        if (error || !profile) {
          setPlanoAtual('teste')
          setLoading(false)
          clearTimeout(timeout)
          return
        }

        // Verificar se plano está ativo e não expirado
        if (profile.plano_status === 'ativo') {
          const dataFim = profile.plano_data_fim ? new Date(profile.plano_data_fim) : null
          if (dataFim && dataFim > new Date()) {
            setPlanoAtual(profile.plano as 'teste' | 'basico' | 'premium')
          } else {
            setPlanoAtual('teste')
          }
        } else {
          setPlanoAtual('teste')
        }
      } catch (error) {
        console.error('Erro ao carregar plano:', error)
        if (mounted) {
          setPlanoAtual('teste')
        }
      } finally {
        if (mounted) {
          setLoading(false)
          clearTimeout(timeout)
        }
      }
    }
    
    carregarPlano()
    
    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-brand-aqua" size={32} />
      </div>
    )
  }

  if (!planoAtual) {
    return null
  }

  return (
    <PlanoBloqueado
      feature={feature}
      planoNecessario={planoNecessario}
      planoAtual={planoAtual}
    >
      {children}
    </PlanoBloqueado>
  )
}

