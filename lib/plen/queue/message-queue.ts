/**
 * PLEN — Fila de mensagens (anti-spam)
 * Nenhuma mensagem é enviada diretamente; todas passam por esta fila.
 */

import { createAdminClient } from '@/lib/supabase/server'

export type QueueItemStatus = 'pending' | 'sending' | 'sent' | 'failed'

export type BotaoFila = { titulo: string; link?: string }

export interface PlenQueueItem {
  id: string
  contact_id: string
  mensagem: string
  status: QueueItemStatus
  send_after: string
  sent_at: string | null
  error_message: string | null
  created_at: string
  botoes?: BotaoFila[] | null
}

/** Delay curto para respostas mais rápidas (0,2 a 0,8 s). */
const DELAY_MIN_MS = 200
const DELAY_MAX_MS = 800
function randomDelayMs(): number {
  return DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS)
}

/** Janela para considerar mensagem duplicada (evita mesma resposta 2x quando Z-API reenvia webhook). */
const DEDUPE_WINDOW_SEC = 90

/** Adiciona mensagem à fila. Sem sendAfter usa delay curto 0,2–0,8s. botoes opcional: envia com botões quando o worker processar. */
export async function enqueuePlenMessage(
  contactId: string,
  mensagem: string,
  sendAfter?: Date,
  botoes?: BotaoFila[]
): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const since = new Date(Date.now() - DEDUPE_WINDOW_SEC * 1000).toISOString()
  const { data: existing } = await supabase
    .from('plen_message_queue')
    .select('id')
    .eq('contact_id', contactId)
    .eq('mensagem', mensagem)
    .gte('created_at', since)
    .limit(1)
    .maybeSingle()
  const existingId = existing != null ? (existing as { id?: string }).id : null
  if (existingId) return existingId

  const after = sendAfter ?? new Date(Date.now() + randomDelayMs())
  const send_after = after.toISOString()
  const botoesValidos = Array.isArray(botoes) ? botoes.filter((b) => (b?.titulo ?? '').trim().length > 0) : []
  const payload: Record<string, unknown> = {
    contact_id: contactId,
    mensagem,
    status: 'pending',
    send_after,
  }
  if (botoesValidos.length > 0) {
    payload.botoes = botoesValidos.map((b) => ({ titulo: (b.titulo ?? '').trim(), link: (b.link ?? '').trim() || undefined }))
  }

  const { data, error } = await supabase
    .from('plen_message_queue')
    .insert(payload)
    .select('id')
    .single()

  if (error || !data) return null
  return (data as { id: string }).id
}

/** Próximos itens pendentes (send_after <= agora), ordenados por send_after, limit. */
export async function getPendingQueueItems(limit = 10): Promise<PlenQueueItem[]> {
  const supabase = createAdminClient()
  if (!supabase) return []

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('plen_message_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('send_after', now)
    .order('send_after', { ascending: true })
    .limit(limit)

  if (error) return []
  return (data ?? []) as PlenQueueItem[]
}

/** Marca item como sending. */
export async function markQueueItemSending(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('plen_message_queue')
    .update({ status: 'sending' })
    .eq('id', id)
  return !error
}

/** Marca item como enviado. */
export async function markQueueItemSent(id: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('plen_message_queue')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

/** Marca item como falha. */
export async function markQueueItemFailed(id: string, errorMessage: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('plen_message_queue')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('id', id)
  return !error
}

/** Delay entre envio de cada mensagem na fila (segundos), para não saturar Z-API. */
export const QUEUE_DELAY_SECONDS = 1
