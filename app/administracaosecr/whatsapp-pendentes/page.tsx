'use client'

import { useState, useCallback, useEffect } from 'react'
import { Send, RefreshCw, MessageCircle, Loader2, UserPlus, ExternalLink, List, MessageSquarePlus } from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'

interface Pendente {
  id: string
  phone: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
}

interface ContatoCRM {
  id: string
  phone: string
  last_message: string | null
  last_message_at: string | null
  welcome_sent_at: string | null
  created_at: string
}

interface MensagemConversa {
  from: 'us' | 'them'
  text: string
  date: string
}

/** Abre o chat com o número no WhatsApp Web (nova aba). */
function linkAbrirWhatsApp(phone: string): string {
  const p = phone.replace(/\D/g, '')
  const num = p.startsWith('55') ? p : `55${p}`
  return `https://web.whatsapp.com/send?phone=${num}`
}

function tempoAtras(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)
  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin} min`
  if (diffH < 24) return `${diffH}h`
  if (diffD < 7) return `${diffD}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

type AbaCRM = 'pendentes' | 'todas'

export default function AdminWhatsAppPendentesPage() {
  const [aba, setAba] = useState<AbaCRM>('todas')
  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [contatosCRM, setContatosCRM] = useState<ContatoCRM[]>([])
  const [selectedContact, setSelectedContact] = useState<ContatoCRM | null>(null)
  const [mensagensConversa, setMensagensConversa] = useState<MensagemConversa[]>([])
  const [loadingConversa, setLoadingConversa] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCRM, setLoadingCRM] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [novoNumero, setNovoNumero] = useState('')
  const [adding, setAdding] = useState(false)
  const [importingWebhook, setImportingWebhook] = useState(false)
  const [jaCarregouUmaVez, setJaCarregouUmaVez] = useState(false)
  const [sendingAll, setSendingAll] = useState(false)
  const [revisandoVacuo, setRevisandoVacuo] = useState(false)

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
      setJaCarregouUmaVez(true)
    } catch (e) {
      createNotification('Erro ao carregar pendentes.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const carregarContatosCRM = useCallback(async (silent = false) => {
    if (!silent) setLoadingCRM(true)
    try {
      // Sincronizar com o webhook (API Fácil) para trazer contatos/mensagens novas antes de listar
      try {
        await fetch('/api/admin/whatsapp-importar-webhook', { method: 'POST' })
      } catch {
        // ignora erro do import em background
      }
      const res = await fetch('/api/admin/whatsapp-contatos')
      if (!res.ok) {
        if (res.status === 401 && !silent) {
          createNotification('Faça login no painel admin.', 'warning')
          return
        }
        if (!silent) createNotification('Erro ao carregar contatos.', 'error')
        return
      }
      const data = await res.json()
      setContatosCRM(data.contatos ?? [])
    } catch (e) {
      if (!silent) createNotification('Erro ao carregar contatos.', 'error')
    } finally {
      setLoadingCRM(false)
    }
  }, [])

  const carregarConversa = useCallback(async (phone: string) => {
    setLoadingConversa(true)
    setMensagensConversa([])
    try {
      const res = await fetch(`/api/admin/whatsapp-conversa?phone=${encodeURIComponent(phone)}`)
      if (!res.ok) {
        createNotification('Erro ao carregar conversa.', 'error')
        return
      }
      const data = await res.json()
      setMensagensConversa(data.mensagens ?? [])
    } catch (e) {
      createNotification('Erro ao carregar conversa.', 'error')
    } finally {
      setLoadingConversa(false)
    }
  }, [])

  const selecionarContato = useCallback(
    (c: ContatoCRM) => {
      setSelectedContact(c)
      carregarConversa(c.phone)
    },
    [carregarConversa]
  )

  useEffect(() => {
    if (aba === 'todas' && contatosCRM.length === 0 && !loadingCRM) carregarContatosCRM()
  }, [aba, contatosCRM.length, loadingCRM, carregarContatosCRM])

  // Atualização ao vivo: lista e conversa a cada 2 minutos (em background, sem spinner)
  useEffect(() => {
    if (aba !== 'todas') return
    const interval = setInterval(() => {
      carregarContatosCRM(true)
      if (selectedContact) {
        fetch(`/api/admin/whatsapp-conversa?phone=${encodeURIComponent(selectedContact.phone)}`)
          .then((r) => r.json())
          .then((d) => setMensagensConversa(d.mensagens ?? []))
          .catch(() => {})
      }
    }, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [aba, carregarContatosCRM, selectedContact?.phone])

  /** Carrega contatos que ainda não receberam o fluxo de 3 mensagens: sincroniza com o webhook (API Fácil) e depois busca a lista filtrada. */
  const carregarPendentes = useCallback(async () => {
    setLoading(true)
    setImportingWebhook(true)
    try {
      const resImport = await fetch('/api/admin/whatsapp-importar-webhook', { method: 'POST' })
      const dataImport = await resImport.json()
      if (resImport.ok && dataImport.success) {
        if (dataImport.importados > 0) {
          createNotification(`${dataImport.importados} contato(s) importado(s) do webhook.`, 'success')
        }
      }
    } catch {
      createNotification('Erro ao sincronizar com o webhook.', 'error')
    } finally {
      setImportingWebhook(false)
    }
    await fetchPendentes()
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
        setContatosCRM((prev) =>
          prev.map((c) => (c.phone === phone ? { ...c, welcome_sent_at: new Date().toISOString() } : c))
        )
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

  /** Envia as 3 mensagens para TODOS os pendentes (backfill da API Fácil + envio em lote). */
  const enviarTodosPendentes = async () => {
    if (sendingAll) return
    setSendingAll(true)
    try {
      const res = await fetch('/api/admin/whatsapp-enviar-todos-pendentes', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        createNotification(
          `Concluído: ${data.processed}/${data.total} contatos receberam as 3 mensagens.${data.backfillImported ? ` ${data.backfillImported} importado(s) do histórico.` : ''}`,
          'success'
        )
        if (data.errors?.length) {
          createNotification(`Alguns falharam: ${data.errors.slice(0, 2).join('; ')}${data.errors.length > 2 ? '…' : ''}`, 'warning')
        }
        await fetchPendentes()
        carregarContatosCRM(true)
      } else {
        createNotification(data.error || 'Falha ao enviar para todos', 'error')
      }
    } catch (e) {
      createNotification('Erro ao enviar para todos.', 'error')
    } finally {
      setSendingAll(false)
    }
  }

  /** Dispara revisão de leads no vácuo (quem enviou e não recebeu resposta). Responde cada um com a mesma lógica do assistente. */
  const revisarVacuo = async () => {
    if (revisandoVacuo) return
    setRevisandoVacuo(true)
    try {
      const res = await fetch('/api/admin/whatsapp-revisao-vacuo', { method: 'POST' })
      const data = await res.json()
      if (data.success !== false) {
        createNotification(
          `Revisão concluída: ${data.processed ?? 0} lead(s) respondido(s).${(data.errors?.length ?? 0) > 0 ? ` ${data.errors.length} falha(s).` : ''}`,
          (data.errors?.length ?? 0) > 0 ? 'warning' : 'success'
        )
        carregarContatosCRM(true)
      } else {
        createNotification(data.error || 'Falha na revisão', 'error')
      }
    } catch (e) {
      createNotification('Erro ao rodar revisão.', 'error')
    } finally {
      setRevisandoVacuo(false)
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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/15 rounded-xl">
          <MessageCircle size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">WhatsApp — CRM e Reenvio</h1>
          <p className="text-sm text-white/70">
            Veja todas as conversas, abra no WhatsApp e envie as 3 mensagens de boas-vindas para quem ainda não recebeu.
          </p>
          <p className="text-xs text-white/50 mt-1">
            💡 Extensão Chrome: use a pasta <code className="bg-white/10 px-1 rounded">extension-crm-whatsapp</code> e defina <code className="bg-white/10 px-1 rounded">EXTENSION_CRM_API_KEY</code> no servidor para enviar as 3 mensagens direto no WhatsApp Web. Veja o README da pasta.
          </p>
        </div>
      </div>

      {/* Abas: Pendentes | Todas as conversas */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setAba('pendentes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${aba === 'pendentes' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}
        >
          <Send size={18} />
          Pendentes (sem 3 msgs)
        </button>
        <button
          type="button"
          onClick={() => setAba('todas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${aba === 'todas' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}
        >
          <List size={18} />
          Todas as conversas
        </button>
      </div>

      {/* Conteúdo da aba Todas as conversas — layout tipo WhatsApp (atualiza a cada 2 min) */}
      {aba === 'todas' && (
        <div className="flex rounded-xl border border-white/10 bg-white/5 overflow-hidden min-h-[320px] max-h-[70vh]">
          {/* Coluna esquerda: lista de contatos (recentes no topo, altura reduzida) */}
          <div className="w-72 shrink-0 flex flex-col border-r border-white/10 max-h-[70vh]">
            <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
              <span className="text-white/80 text-xs font-medium">Conversas (atualiza a cada 2 min)</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={revisarVacuo}
                  disabled={revisandoVacuo}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/90 bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50"
                  title="Responder quem ficou no vácuo (última msg foi deles e não respondemos)"
                >
                  {revisandoVacuo ? <Loader2 size={12} className="animate-spin" /> : <MessageSquarePlus size={12} />}
                  Revisar vácuo
                </button>
                <button
                  type="button"
                  onClick={carregarContatosCRM}
                  disabled={loadingCRM}
                  className="p-1 rounded text-white/80 hover:bg-white/10 disabled:opacity-50"
                  title="Atualizar agora"
                >
                  <RefreshCw size={14} className={loadingCRM ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingCRM && contatosCRM.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-white/60 gap-1">
                  <Loader2 size={22} className="animate-spin" />
                  <p className="text-[11px]">Carregando…</p>
                </div>
              ) : contatosCRM.length === 0 ? (
                <p className="p-3 text-white/50 text-xs text-center">Nenhum contato ainda.</p>
              ) : (
                contatosCRM.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => selecionarContato(item)}
                    className={`w-full text-left px-2.5 py-1.5 border-b border-white/5 hover:bg-white/10 transition ${selectedContact?.phone === item.phone ? 'bg-white/15' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-white font-medium text-xs truncate">
                        {formatPhone(item.phone)}
                      </span>
                      <span className="text-white/40 text-[10px] shrink-0">
                        {item.last_message_at ? tempoAtras(item.last_message_at) : ''}
                      </span>
                    </div>
                    <p className="text-white/55 text-[11px] truncate mt-0.5">
                      {item.last_message || '—'}
                    </p>
                    {!item.welcome_sent_at && (
                      <span className="inline-block mt-0.5 px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px]">
                        Pendente
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
          {/* Coluna direita: conversa aberta ou placeholder */}
          <div className="flex-1 flex flex-col min-w-0 bg-white/[0.02]">
            {!selectedContact ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8">
                <MessageCircle size={48} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">Selecione uma conversa</p>
                <p className="text-xs mt-1">Clique em um contato à esquerda para ver o histórico e enviar as 3 mensagens.</p>
              </div>
            ) : (
              <>
                <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div>
                    <p className="font-mono text-white font-semibold text-xs">{formatPhone(selectedContact.phone)}</p>
                    <p className="text-white/50 text-[11px]">
                      {selectedContact.welcome_sent_at ? 'Respondido' : 'Pendente — envie as 3 mensagens'}
                    </p>
                  </div>
                  <a
                    href={linkAbrirWhatsApp(selectedContact.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                  >
                    <ExternalLink size={14} />
                    Abrir no WhatsApp
                  </a>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
                  {loadingConversa ? (
                    <div className="flex justify-center py-8">
                      <Loader2 size={24} className="animate-spin text-white/50" />
                    </div>
                  ) : mensagensConversa.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-6">Nenhuma mensagem no histórico (últimos 30 dias).</p>
                  ) : (
                    mensagensConversa.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.from === 'us' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            msg.from === 'us'
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white/15 text-white rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text || '—'}</p>
                          <p className={`text-[10px] mt-1 ${msg.from === 'us' ? 'text-emerald-200' : 'text-white/50'}`}>
                            {formatarHora(msg.date)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedContact && !selectedContact.welcome_sent_at && (
                  <div className="px-2.5 py-2 border-t border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => enviarBoasVindas(selectedContact.phone)}
                      disabled={sending !== null}
                      className="flex items-center gap-2 w-full justify-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {sending === selectedContact.phone ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      Enviar 3 mensagens de boas-vindas
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da aba Pendentes */}
      {aba === 'pendentes' && (
        <>
      {/* Botão principal: carregar contatos pendentes (sincroniza webhook + busca filtrados) */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
        <button
          type="button"
          onClick={carregarPendentes}
          disabled={loading}
          className="flex items-center gap-2 w-full justify-center px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Carregando… (sincronizando webhook e filtrando)
            </>
          ) : (
            <>
              <RefreshCw size={20} />
              Carregar contatos que não receberam as 3 mensagens
            </>
          )}
        </button>
        <p className="text-white/60 text-xs mt-2 text-center">
          Sincroniza com a API Fácil (histórico do webhook), filtra quem recebeu menos de 3 respostas nossas e mostra aqui.
        </p>
      </div>

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 mb-4">
        <p className="text-white/90 text-sm font-medium mb-2">Garantir que todos recebam as 3 mensagens</p>
        <p className="text-white/60 text-xs mb-3">
          Busca no histórico da API Fácil quem enviou &quot;quero utilizar Plenipay&quot; (últimas 48h), adiciona na fila e envia as 3 mensagens para todos que ainda não receberam (últimos 7 dias).
        </p>
        <button
          type="button"
          onClick={enviarTodosPendentes}
          disabled={sendingAll}
          className="flex items-center gap-2 w-full justify-center px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingAll ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Enviando para todos… (pode levar 1–2 min)
            </>
          ) : (
            <>
              <Send size={20} />
              Enviar para todos os pendentes agora
            </>
          )}
        </button>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
        <p className="text-white/80 text-sm mb-2">Adicionar número manualmente (para reenvio):</p>
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
        <div className="flex flex-col items-center justify-center py-12 text-white/70 gap-3">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Sincronizando com o webhook e filtrando contatos…</p>
        </div>
      ) : !jaCarregouUmaVez ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center text-white/70">
          <p className="mb-2">Lista ainda não carregada.</p>
          <p className="text-sm">Clique no botão <strong className="text-white/90">Carregar contatos que não receberam as 3 mensagens</strong> acima para buscar no webhook (API Fácil) e exibir aqui só quem ainda não recebeu o fluxo completo.</p>
        </div>
      ) : pendentes.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-8 text-center text-white/70">
          <p className="mb-2">Nenhum contato pendente.</p>
          <p className="text-sm">Todos que enviaram &quot;quero utilizar Plenipay&quot; já receberam as 3 mensagens, ou ainda não há contatos no período. Clique em &quot;Carregar&quot; de novo para atualizar ou adicione um número manualmente.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {pendentes.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-white font-semibold text-sm mb-1">
                  {formatPhone(item.phone)}
                </p>
                <p className="text-white/80 text-sm truncate" title={item.last_message ?? ''}>
                  {item.last_message || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={linkAbrirWhatsApp(item.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 text-sm"
                >
                  <ExternalLink size={16} />
                  Abrir no WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => enviarBoasVindas(item.phone)}
                  disabled={sending !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending === item.phone ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  Enviar 3 mensagens
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
        </>
      )}
    </div>
  )
}
