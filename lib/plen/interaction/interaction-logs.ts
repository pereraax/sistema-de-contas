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
