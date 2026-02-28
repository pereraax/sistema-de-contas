'use client'

import { useState, useEffect } from 'react'
import { X, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

interface AdminAviso {
  id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'error' | 'success'
  mostrar_popup?: boolean
  read?: boolean
  created_at: string
}

export default function AvisosAdmin() {
  const [avisos, setAvisos] = useState<AdminAviso[]>([])
  const [popupAviso, setPopupAviso] = useState<AdminAviso | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarAvisos() {
      try {
        const response = await fetch('/api/user/avisos', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        const avisosData = data.avisos || []
        setAvisos(avisosData)
        // Popup: primeiro aviso com mostrar_popup que o usuário ainda não viu
        const avisoPopup = avisosData.find((a: AdminAviso) => a.mostrar_popup && !a.read)
        if (avisoPopup) setPopupAviso(avisoPopup)
      } catch (error) {
        console.error('Erro ao carregar avisos:', error)
      } finally {
        setLoading(false)
      }
    }
    carregarAvisos()
  }, [])

  const handleFecharPopup = async () => {
    if (!popupAviso) return
    try {
      await fetch('/api/user/avisos/marcar-visto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avisoId: popupAviso.id }),
      })
    } catch (error) {
      console.error('Erro ao marcar aviso como visto:', error)
    }
    setPopupAviso(null)
  }

  const tipoConfig = {
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-400/30' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-400/30' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-400/30' },
    success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-400/30' },
  }

  if (loading) return null

  return (
    <>
      {popupAviso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`bg-[#1e1e1e] dark:bg-[#161616] rounded-2xl shadow-2xl border ${tipoConfig[popupAviso.tipo].border} max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200`}
            role="dialog"
            aria-labelledby="aviso-titulo"
            aria-modal="true"
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className={`shrink-0 p-2.5 rounded-xl ${tipoConfig[popupAviso.tipo].bg}`}>
                  {(() => {
                    const Icon = tipoConfig[popupAviso.tipo].icon
                    return <Icon size={22} className={tipoConfig[popupAviso.tipo].color} />
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 id="aviso-titulo" className="text-base font-semibold text-white dark:text-gray-100 mb-1.5">
                    {popupAviso.titulo}
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-300 leading-relaxed">
                    {popupAviso.mensagem}
                  </p>
                </div>
                <button
                  onClick={handleFecharPopup}
                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
              <button
                onClick={handleFecharPopup}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-brand-aqua text-brand-midnight font-semibold hover:opacity-95 transition-opacity"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

