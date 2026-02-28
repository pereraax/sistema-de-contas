/**
 * Listar notificações (histórico de mensagens) da API Fácil para backfill de contatos pendentes.
 * Doc: GET /api/v1/whatsapp/notificacoes
 */

import { getApifacilConfig } from './whatsapp-apifacil'

function normalizarOrigem(origem: string): string {
  const limpo = String(origem).replace(/\D/g, '')
  return limpo.length >= 10 && !limpo.startsWith('55') ? `55${limpo}` : limpo
}

export interface NotificacaoRecebida {
  id: number
  origem: string
  mensagem: string
  tipo_envio: string
  created_at: string
}

/** Notificação de mensagem enviada por nós (destino = número que recebeu). mensagem opcional (API pode não retornar). */
export interface NotificacaoEnviada {
  destino: string
  created_at: string
  mensagem?: string
}

/** Busca notificações de um tipo (MENSAGEM_RECEBIDA ou MENSAGEM_ENVIADA) na API Fácil (com paginação). */
async function listarNotificacoes(
  dataInicial: string,
  dataFinal: string,
  tipoEnvio: 'MENSAGEM_RECEBIDA' | 'MENSAGEM_ENVIADA',
  perPage = 50,
  opts?: { omitirInstanciaId?: boolean }
): Promise<{ notificacoes: NotificacaoRecebida[] | NotificacaoEnviada[]; error?: string }> {
  const config = getApifacilConfig()
  if (!config) {
    return { notificacoes: [], error: 'API Fácil não configurada (APIFACIL_INSTANCE_ID e APIFACIL_TOKEN)' }
  }
  const baseUrl = 'https://apifacil.dev/api/v1'
  const all: NotificacaoRecebida[] | NotificacaoEnviada[] = []
  let page = 1
  let hasMore = true
  const useInstanciaId = !opts?.omitirInstanciaId && config.instanceId && String(config.instanceId).trim()
  while (hasMore) {
    const params: Record<string, string> = {
      data_inicial: dataInicial,
      data_final: dataFinal,
      tipo_envio: tipoEnvio,
      per_page: String(perPage),
      page: String(page),
    }
    if (useInstanciaId) {
      params.instancia_id = String(config.instanceId).trim()
    }
    const url = `${baseUrl}/whatsapp/notificacoes?${new URLSearchParams(params)}`
    const authHeader = config.token.trim()
    let res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    })
    if (res.status === 401 && !authHeader.startsWith('Bearer')) {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authHeader}`,
          Accept: 'application/json',
        },
      })
    }
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = json.message || json.error || json.msg || (typeof json === 'string' ? json : `Erro ${res.status}`)
      return {
        notificacoes: [],
        error: msg,
      }
    }
    if (json.error === true && json.message) {
      return { notificacoes: [], error: json.message }
    }
    const wrap = json.data ?? json
    const list = Array.isArray(wrap?.data)
      ? wrap.data
      : Array.isArray(wrap)
        ? wrap
        : Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.notificacoes)
            ? json.notificacoes
            : Array.isArray(json.mensagens)
              ? json.mensagens
              : []
    const data = typeof wrap === 'object' && wrap !== null ? wrap : {}
    for (const item of list) {
      const created_at = item.created_at ?? item.createdAt ?? new Date().toISOString()
      if (tipoEnvio === 'MENSAGEM_RECEBIDA') {
        const origem = item.origem ?? item.from ?? item.phone
        const mensagem = item.mensagem ?? item.text ?? item.message ?? ''
        if (origem && typeof mensagem === 'string') {
          (all as NotificacaoRecebida[]).push({
            id: item.id,
            origem: normalizarOrigem(String(origem)),
            mensagem,
            tipo_envio: item.tipo_envio ?? 'MENSAGEM_RECEBIDA',
            created_at,
          })
        }
      } else {
        const destino = item.destino ?? item.to ?? item.telefone ?? item.phone
        const mensagem = (item.mensagem ?? item.text ?? item.body ?? item.conteudo ?? item.content ?? '').trim()
        if (destino) {
          (all as NotificacaoEnviada[]).push({
            destino: normalizarOrigem(String(destino)),
            created_at,
            ...(mensagem ? { mensagem } : {}),
          })
        }
      }
    }
    const lastPage = typeof data.last_page === 'number' ? data.last_page : 1
    hasMore = page < lastPage && list.length >= perPage
    page += 1
  }
  return { notificacoes: all }
}

/** Busca notificações MENSAGEM_RECEBIDA na API Fácil (com paginação). dataInicial/dataFinal em YYYY-MM-DD. */
export async function listarNotificacoesRecebidas(
  dataInicial: string,
  dataFinal: string,
  perPage = 50,
  opts?: { omitirInstanciaId?: boolean }
): Promise<{ notificacoes: NotificacaoRecebida[]; error?: string }> {
  return listarNotificacoes(dataInicial, dataFinal, 'MENSAGEM_RECEBIDA', perPage, opts) as Promise<{
    notificacoes: NotificacaoRecebida[]
    error?: string
  }>
}

/** Busca notificações MENSAGEM_ENVIADA (respostas que a assistente enviou). destino = número que recebeu. */
export async function listarNotificacoesEnviadas(
  dataInicial: string,
  dataFinal: string,
  perPage = 50,
  opts?: { omitirInstanciaId?: boolean }
): Promise<{ notificacoes: NotificacaoEnviada[]; error?: string }> {
  return listarNotificacoes(dataInicial, dataFinal, 'MENSAGEM_ENVIADA', perPage, opts) as Promise<{
    notificacoes: NotificacaoEnviada[]
    error?: string
  }>
}
