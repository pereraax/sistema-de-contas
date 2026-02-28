/**
 * Listar notificações (histórico de mensagens) da API Fácil para backfill de contatos pendentes.
 * Doc: GET /api/v1/whatsapp/notificacoes
 */

import { getApifacilConfig } from './whatsapp-apifacil'

export interface NotificacaoRecebida {
  id: number
  origem: string
  mensagem: string
  tipo_envio: string
  created_at: string
}

/** Busca notificações MENSAGEM_RECEBIDA na API Fácil (com paginação). dataInicial/dataFinal em YYYY-MM-DD. */
export async function listarNotificacoesRecebidas(
  dataInicial: string,
  dataFinal: string,
  perPage = 50
): Promise<{ notificacoes: NotificacaoRecebida[]; error?: string }> {
  const config = getApifacilConfig()
  if (!config) {
    return { notificacoes: [], error: 'API Fácil não configurada' }
  }
  const baseUrl = 'https://apifacil.dev/api/v1'
  const all: NotificacaoRecebida[] = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    const params: Record<string, string> = {
      data_inicial: dataInicial,
      data_final: dataFinal,
      tipo_envio: 'MENSAGEM_RECEBIDA',
      per_page: String(perPage),
      page: String(page),
    }
    if (config.instanceId) params.instancia_id = config.instanceId
    const url = `${baseUrl}/whatsapp/notificacoes?${new URLSearchParams(params)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: config.token.trim() },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        notificacoes: [],
        error: json.message || json.error || `Erro ${res.status} ao listar notificações`,
      }
    }
    const wrap = json.data ?? json
    const list = Array.isArray(wrap.data) ? wrap.data : Array.isArray(wrap) ? wrap : []
    const data = wrap
    for (const item of list) {
      const origem = item.origem ?? item.from ?? item.phone
      const mensagem = item.mensagem ?? item.text ?? item.message ?? ''
      if (origem && typeof mensagem === 'string') {
        all.push({
          id: item.id,
          origem: String(origem).replace(/\D/g, '').replace(/^(\d{10,11})$/, '55$1'),
          mensagem,
          tipo_envio: item.tipo_envio ?? 'MENSAGEM_RECEBIDA',
          created_at: item.created_at ?? item.createdAt ?? new Date().toISOString(),
        })
      }
    }
    const lastPage = typeof data.last_page === 'number' ? data.last_page : 1
    hasMore = page < lastPage && list.length >= perPage
    page += 1
  }
  return { notificacoes: all }
}
