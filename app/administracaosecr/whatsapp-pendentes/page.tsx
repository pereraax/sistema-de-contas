'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, RefreshCw, MessageCircle, Loader2 } from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'

interface Pendente {
  id: string
  phone: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
}

export default function AdminWhatsAppPendentesPage() {
  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  const fetchPendentes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-pendentes')
      if (!res.ok) {
        if (res.status === 401) {
          createNotification('Faça login no painel admin.', 'warning')
          return
        }
        createNotification('Erro ao carregar lista.', 'error')
        return
      }
      const data = await res.json()
      setPendentes(data.pendentes ?? [])
    } catch (e) {
      createNotification('Erro ao carregar pendentes.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPendentes()
    const interval = setInterval(fetchPendentes, 10_000)
    return () => clearInterval(interval)
  }, [fetchPendentes])

  const enviarBoasVindas = async (phone: string) => {
    if (sending) return
    setSending(phone)
    try {
      const res = await fetch('/api/admin/whatsapp-enviar-boas-vindas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (data.success) {
        createNotification(`3 mensagens enviadas para ${phone}`, 'success')
        setPendentes((prev) => prev.filter((p) => p.phone !== phone))
      } else {
        createNotification(data.error || 'Falha ao enviar', 'error')
      }
    } catch (e) {
      createNotification('Erro ao enviar.', 'error')
    } finally {
      setSending(null)
    }
  }

  const formatPhone = (p: string) => {
    const d = p.replace(/\D/g, '')
    if (d.length === 13 && d.startsWith('55')) return `+55 ${d.slice(2, 4)} ${d.slice(4, 8)} ${d.slice(8)}`
    if (d.length === 11 && d.startsWith('55')) return `+55 ${d.slice(2, 5)} ${d.slice(5)}`
    return p
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/15 rounded-xl">
          <MessageCircle size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Reenvio de boas-vindas WhatsApp</h1>
          <p className="text-sm text-white/70">
            Contatos que enviaram &quot;quero utilizar a plenipay&quot; e ainda não receberam as 3 mensagens. Atualiza a cada 10s.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-white/80 text-sm">
          {pendentes.length} contato(s) pendente(s)
        </span>
        <button
          type="button"
          onClick={() => { setLoading(true); fetchPendentes(); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15 text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {loading && pendentes.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-white/70">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : pendentes.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center text-white/70">
          Nenhum contato pendente. Quem enviar &quot;Olá, quero utilizar a plenipay&quot; e não receber as 3 mensagens aparecerá aqui.
        </div>
      ) : (
        <ul className="space-y-3">
          {pendentes.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-white font-semibold text-sm mb-1">
                  {formatPhone(item.phone)}
                </p>
                <p className="text-white/80 text-sm truncate" title={item.last_message ?? ''}>
                  {item.last_message || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => enviarBoasVindas(item.phone)}
                disabled={sending !== null}
                className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending === item.phone ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                Enviar 3 mensagens
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
