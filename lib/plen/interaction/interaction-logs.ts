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

/**
 * Conta quantos registros de gasto/receita o contato já fez para o limite do plano gratuito (10).
 * Se sinceDate (ex.: data_cadastro do contato) for informada, só conta logs a partir dessa data,
 * para que contas novas tenham 0 e possam usar os 10 registros; evita contar testes/uso anterior ao cadastro.
 */
export async function getPlenRegistroCount(contactId: string, sinceDate?: string | null): Promise<number> {
  const supabase = createAdminClient()
  if (!supabase) return 0
  let query = supabase
    .from('plen_interaction_logs')
    .select('*', { count: 'exact', head: true })
    .eq('contact_id', contactId)
    .in('acao_executada', ['test_expense_ok', 'registro_gasto_ativo'])
  if (sinceDate && sinceDate.trim()) {
    query = query.gte('timestamp', sinceDate.trim())
  }
  const { count, error } = await query
  if (error || count == null) return 0
  return count
}
