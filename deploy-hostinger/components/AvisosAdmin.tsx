'use client'

import { useState, useEffect } from 'react'
import { X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminAviso {
  id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'error' | 'success'
  mostrar_popup: boolean
  ativo: boolean
  created_at: string
}

export default function AvisosAdmin() {
  const router = useRouter()
  const [avisos, setAvisos] = useState<AdminAviso[]>([])
  const [popupAviso, setPopupAviso] = useState<AdminAviso | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarAvisos() {
      try {
        // Obter user ID do Supabase
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const response = await fetch(`/api/admin/avisos?userId=${user.id}`, {
          cache: 'no-store'
        })
        
        if (!response.ok) {
          console.error('Erro ao carregar avisos')
          return
        }

        const data = await response.json()
        const avisosData = data.avisos || []
        setAvisos(avisosData)

        // Verificar se há aviso para mostrar como popup
        const avisoPopup = avisosData.find((a: AdminAviso) => a.mostrar_popup && a.ativo)
        if (avisoPopup) {
          setPopupAviso(avisoPopup)
        }
      } catch (error) {
        console.error('Erro ao carregar avisos admin:', error)
      } finally {
        setLoading(false)
      }
    }

    carregarAvisos()
  }, [])

  const handleFecharPopup = async () => {
    if (popupAviso) {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        try {
          await fetch('/api/admin/marcar-visto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avisoId: popupAviso.id, userId: user.id }),
          })
        } catch (error) {
          console.error('Erro ao marcar aviso como visto:', error)
        }
      }
      setPopupAviso(null)
    }
  }

  const tipoConfig = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/50' },
    warning: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-800/50' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/50' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-800/50' },
  }

  if (loading || avisos.length === 0) {
    return null
  }

  return (
    <>
      {/* Popup de aviso (se configurado) */}
      {popupAviso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 glass-backdrop">
          <div className={`bg-brand-royal rounded-3xl p-6 shadow-2xl border ${tipoConfig[popupAviso.tipo].border} max-w-md w-full animate-slide-up`}>
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl ${tipoConfig[popupAviso.tipo].bg}`}>
                {(() => {
                  const Icon = tipoConfig[popupAviso.tipo].icon
                  return <Icon size={24} className={tipoConfig[popupAviso.tipo].color} />
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-brand-clean mb-2">
                  {popupAviso.titulo}
                </h3>
                <p className="text-sm text-brand-clean/70">
                  {popupAviso.mensagem}
                </p>
              </div>
              <button
                onClick={handleFecharPopup}
                className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
              >
                <X size={20} className="text-brand-clean" />
              </button>
            </div>
            <button
              onClick={handleFecharPopup}
              className="w-full px-4 py-2 bg-brand-aqua text-brand-midnight rounded-xl font-semibold hover:bg-brand-aqua/90 transition-smooth"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  )
}

