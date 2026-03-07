/**
 * PLEN — Fila de mensagens (anti-spam)
 * Nenhuma mensagem é enviada diretamente; todas passam por esta fila.
 */

import { createAdminClient } from '@/lib/supabase/server'

export type QueueItemStatus = 'pending' | 'sending' | 'sent' | 'failed'

export interface PlenQueueItem {
  id: string
  contact_id: string
  mensagem: string
  status: QueueItemStatus
  send_after: string
  sent_at: string | null
  error_message: string | null
  created_at: string
}

/** Delay humano: 1.5 a 5 segundos (aleatório). */
const DELAY_MIN_MS = 1500
const DELAY_MAX_MS = 5000
function randomDelayMs(): number {
  return DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS)
}

/** Adiciona mensagem à fila. Sem sendAfter usa delay aleatório 1.5–5s (resposta humanizada). */
export async function enqueuePlenMessage(
  contactId: string,
  mensagem: string,
  sendAfter?: Date
): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const after = sendAfter ?? new Date(Date.now() + randomDelayMs())
  const send_after = after.toISOString()

  const { data, error } = await supabase
    .from('plen_message_queue')
    .insert({
      contact_id: contactId,
      mensagem,
      status: 'pending',
      send_after,
    })
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
export const QUEUE_DELAY_SECONDS = 2
