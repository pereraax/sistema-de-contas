'use client'

import { useState, useEffect, useCallback } from 'react'
import { Send, RefreshCw, MessageCircle, Loader2, UserPlus, Download } from 'lucide-react'
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
  const [novoNumero, setNovoNumero] = useState('')
  const [adding, setAdding] = useState(false)
  const [importingWebhook, setImportingWebhook] = useState(false)

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

  // Importar direto do webhook (API Fácil) ao abrir a página, depois carregar a lista
  useEffect(() => {
    let cancelled = false
    async function importarEDepoisListar() {
      setImportingWebhook(true)
      try {
        const res = await fetch('/api/admin/whatsapp-importar-webhook', { method: 'POST' })
        if (cancelled) return
        const data = await res.json()
        if (res.ok && data.success) {
          if (data.importados > 0) {
            createNotification(`${data.importados} contato(s) importado(s) do webhook.`, 'success')
          } else if (data.mensagem) {
            createNotification(data.mensagem, 'info')
          }
        }
      } catch {
        if (!cancelled) createNotification('Erro ao importar do webhook.', 'error')
      } finally {
        if (!cancelled) setImportingWebhook(false)
      }
      if (!cancelled) fetchPendentes()
    }
    importarEDepoisListar()
    const interval = setInterval(fetchPendentes, 10_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
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

  const importarDoWebhook = async () => {
    setImportingWebhook(true)
    try {
      const res = await fetch('/api/admin/whatsapp-importar-webhook', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        const msg =
          data.importados > 0
            ? `${data.importados} contato(s) importado(s).`
            : data.mensagem ||
              `Nenhum contato com menos de 3 respostas no período. Recebidas: ${data.total_recebidas ?? '?'}, com "quero utilizar plenipay": ${data.total_quero_utilizar ?? '?'}.`
        createNotification(msg, data.importados > 0 ? 'success' : 'info')
        fetchPendentes()
      } else {
        const errMsg = data.error || 'Erro ao importar do webhook.'
        createNotification(errMsg, 'error')
      }
    } catch (e) {
      createNotification('Erro ao importar do webhook.', 'error')
    } finally {
      setImportingWebhook(false)
    }
  }

  const adicionarNumero = async () => {
    const num = novoNumero.trim().replace(/\D/g, '')
    if (num.length < 10) {
      createNotification('Digite um número com DDD (ex: 11999999999 ou 5511999999999)', 'warning')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/whatsapp-pendentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: num.length === 11 ? `55${num}` : num }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        createNotification('Número adicionado. Atualize a lista.', 'success')
        setNovoNumero('')
        fetchPendentes()
      } else {
        createNotification(data.error || 'Erro ao adicionar', 'error')
      }
    } catch (e) {
      createNotification('Erro ao adicionar número.', 'error')
    } finally {
      setAdding(false)
    }
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
            Aparecem aqui quem enviou &quot;Olá! Quero utilizar a Plenipay&quot; e ainda <strong>não recebeu o fluxo de 3 mensagens</strong>. A mensagem automática &quot;Olá, Bem vindo (a) a Plenipay&quot; não conta — quem só recebeu essa continua na lista para reenvio manual. Atualiza a cada 10s.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
        <p className="text-white/80 text-sm mb-2">Puxar do histórico da API Fácil (quem já enviou mensagem):</p>
        <button
          type="button"
          onClick={importarDoWebhook}
          disabled={importingWebhook}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm disabled:opacity-50 mb-3"
        >
          {importingWebhook ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Importar contatos do webhook (API Fácil)
        </button>
        <p className="text-white/60 text-xs mb-2">Busca nos últimos 7 dias quem enviou &quot;quero utilizar plenipay&quot; e coloca na lista.</p>
        <p className="text-white/80 text-sm mb-2">Ou adicionar número manualmente:</p>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="5511999999999 ou 11999999999"
            value={novoNumero}
            onChange={(e) => setNovoNumero(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionarNumero()}
            className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder-white/50 text-sm font-mono"
          />
          <button
            type="button"
            onClick={adicionarNumero}
            disabled={adding}
            className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm disabled:opacity-50"
          >
            {adding ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            Adicionar
          </button>
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
          <p className="mb-2">Nenhum contato pendente.</p>
          <p className="text-sm">Quem enviar &quot;Olá! Quero utilizar a Plenipay&quot; e ainda não receber o fluxo de 3 mensagens (a saudação automática não conta) será identificado aqui. Use &quot;Importar contatos do webhook&quot; ou adicione números manualmente.
          </p>
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
