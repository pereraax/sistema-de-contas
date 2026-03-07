/**
 * PLEN — Logs de interação (mensagem recebida, estado, intent, ação, resposta)
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface PlenInteractionLogInsert {
  contact_id: string
  mensagem_recebida: string | null
  estado_usuario: string | null
  intent_detectada: string | null
  acao_executada: string | null
  resposta_enviada: string | null
}

export async function logPlenInteraction(input: PlenInteractionLogInsert): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  await supabase.from('plen_interaction_logs').insert({
    contact_id: input.contact_id,
    mensagem_recebida: input.mensagem_recebida ?? null,
    estado_usuario: input.estado_usuario ?? null,
    intent_detectada: input.intent_detectada ?? null,
    acao_executada: input.acao_executada ?? null,
    resposta_enviada: input.resposta_enviada ?? null,
  })
}

/** Conta quantos registros de gasto/receita o contato já fez (teste + USER_ACTIVE). Usado para limite do plano gratuito (10). */
export async function getPlenRegistroCount(contactId: string): Promise<number> {
  const supabase = createAdminClient()
  if (!supabase) return 0
  const { count, error } = await supabase
    .from('plen_interaction_logs')
    .select('*', { count: 'exact', head: true })
    .eq('contact_id', contactId)
    .in('acao_executada', ['test_expense_ok', 'registro_gasto_ativo'])
  if (error || count == null) return 0
  return count
}
