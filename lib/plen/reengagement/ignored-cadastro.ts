/**
 * Follow-up para cadastro ignorado: usuário parou em "Qual é o seu nome?" ou "Me diga seu email"
 * e não respondeu. Após 5 min a 1 h, enviamos mensagem incentivando a terminar o cadastro.
 */

import { createAdminClient } from '@/lib/supabase/server'

const MS_5MIN = 5 * 60 * 1000
const MS_1H = 60 * 60 * 1000

/** Nós do fluxo em que o usuário pode ter "ignorado" (esperamos nome ou email). */
const NODES_AGUARDANDO_RESPOSTA = ['oficial-pedir-nome', 'oficial-pedir-email']

export interface ContactIgnoradoCadastro {
  contact_id: string
  flow_id: string
  current_node_id: string
  context: Record<string, unknown>
  updated_at: string
}

const MSG_FOLLOWUP =
  'Vamos terminar seu cadastro? Ter um controle do seu dinheiro fará uma grande diferença lá no futuro, e eu vou te ajudar...'

/**
 * Retorna a mensagem de follow-up para cadastro ignorado.
 */
export function getMensagemCadastroIgnorado(): string {
  return MSG_FOLLOWUP
}

/**
 * Busca contatos que estão parados em "pedir nome" ou "pedir email" há entre 5 min e 1 h,
 * e ainda não receberam o follow-up de cadastro ignorado.
 */
export async function getContactsComCadastroIgnorado(limit = 20): Promise<ContactIgnoradoCadastro[]> {
  const supabase = createAdminClient()
  if (!supabase) return []

  const now = Date.now()
  const oneHourAgo = new Date(now - MS_1H).toISOString()
  const fiveMinAgo = new Date(now - MS_5MIN).toISOString()

  const { data: rows, error } = await supabase
    .from('chatbot_flow_state')
    .select('contact_id, flow_id, current_node_id, context, updated_at')
    .in('current_node_id', NODES_AGUARDANDO_RESPOSTA)
    .lte('updated_at', fiveMinAgo)
    .gte('updated_at', oneHourAgo)
    .limit(limit * 2)

  if (error || !rows?.length) return []

  const results: ContactIgnoradoCadastro[] = []
  for (const row of rows as Array<{
    contact_id: string
    flow_id: string
    current_node_id: string
    context: unknown
    updated_at: string
  }>) {
    const ctx = (row.context ?? {}) as Record<string, unknown>
    if (ctx.ignored_cadastro_followup_sent_at != null) continue
    results.push({
      contact_id: row.contact_id,
      flow_id: row.flow_id,
      current_node_id: row.current_node_id,
      context: ctx,
      updated_at: row.updated_at,
    })
    if (results.length >= limit) break
  }
  return results
}

/**
 * Marca que enviamos o follow-up de cadastro ignorado para este contato (no context do fluxo).
 */
export async function markIgnoredCadastroFollowupSent(contactId: string, flowId: string, currentNodeId: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const ctx = { ignored_cadastro_followup_sent_at: new Date().toISOString() }
  const { data: existing } = await supabase
    .from('chatbot_flow_state')
    .select('context')
    .eq('contact_id', contactId)
    .maybeSingle()
  const existingCtx = ((existing as { context?: Record<string, unknown> } | null)?.context ?? {}) as Record<string, unknown>
  const newContext = { ...existingCtx, ...ctx }
  const { error } = await supabase
    .from('chatbot_flow_state')
    .update({
      context: newContext,
      updated_at: new Date().toISOString(),
    })
    .eq('contact_id', contactId)
  return !error
}
