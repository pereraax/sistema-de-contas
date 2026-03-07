/**
 * PLEN — Gerenciador de estado do usuário
 * Estados: NEW_LEAD | TEST_EXPENSE | WAITING_NAME | WAITING_EMAIL | WAITING_CODE | USER_ACTIVE
 */

import { createAdminClient } from '@/lib/supabase/server'

export type PlenState =
  | 'NEW_LEAD'
  | 'TEST_EXPENSE'
  | 'WAITING_NAME'
  | 'WAITING_EMAIL'
  | 'WAITING_CODE'
  | 'USER_ACTIVE'

export interface PlenUserStateRow {
  id: string
  contact_id: string
  state: PlenState
  payload: Record<string, unknown>
  consecutive_bot_replies: number
  last_user_message_at: string | null
  blocked_until: string | null
  created_at: string
  updated_at: string
}

const DEFAULT_STATE: PlenState = 'NEW_LEAD'

/** Retorna o estado atual do contato; cria linha com NEW_LEAD se não existir. */
export async function getOrCreatePlenState(contactId: string): Promise<PlenUserStateRow | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const { data: existing } = await supabase
    .from('plen_user_state')
    .select('*')
    .eq('contact_id', contactId)
    .maybeSingle()

  if (existing) return existing as PlenUserStateRow

  const { data: inserted, error } = await supabase
    .from('plen_user_state')
    .insert({
      contact_id: contactId,
      state: DEFAULT_STATE,
      payload: {},
      consecutive_bot_replies: 0,
    })
    .select()
    .single()

  if (error || !inserted) return null
  return inserted as PlenUserStateRow
}

/** Atualiza o estado e opcionalmente o payload. Zera consecutive_bot_replies ao atualizar estado. */
export async function setPlenState(
  contactId: string,
  state: PlenState,
  payload?: Record<string, unknown>
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false

  const updates: Record<string, unknown> = {
    state,
    updated_at: new Date().toISOString(),
    consecutive_bot_replies: 0,
  }
  if (payload !== undefined) updates.payload = payload

  const { error } = await supabase
    .from('plen_user_state')
    .update(updates)
    .eq('contact_id', contactId)

  return !error
}

/** Incrementa contador de respostas seguidas do bot (anti-loop). */
export async function incrementConsecutiveBotReplies(contactId: string): Promise<number | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const { data: row } = await supabase
    .from('plen_user_state')
    .select('consecutive_bot_replies')
    .eq('contact_id', contactId)
    .single()

  const next = ((row as { consecutive_bot_replies?: number })?.consecutive_bot_replies ?? 0) + 1

  await supabase
    .from('plen_user_state')
    .update({
      consecutive_bot_replies: next,
      updated_at: new Date().toISOString(),
    })
    .eq('contact_id', contactId)

  return next
}

/** Marca que o usuário enviou mensagem: zera consecutive_bot_replies e atualiza last_user_message_at. */
export async function markUserReplied(contactId: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('plen_user_state')
    .update({
      consecutive_bot_replies: 0,
      last_user_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('contact_id', contactId)

  return !error
}

/** Bloqueia envio para o contato até um horário (anti-loop: 3 respostas seguidas). */
export async function blockUntil(contactId: string, until: Date): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('plen_user_state')
    .update({
      blocked_until: until.toISOString(),
      consecutive_bot_replies: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('contact_id', contactId)

  return !error
}

/** Verifica se o contato está bloqueado (blocked_until no futuro). */
export function isBlocked(row: PlenUserStateRow | null): boolean {
  if (!row?.blocked_until) return false
  return new Date(row.blocked_until) > new Date()
}

/** Deve bloquear por anti-loop? (3 ou mais respostas seguidas do bot). */
export const CONSECUTIVE_BOT_REPLIES_LIMIT = 3
