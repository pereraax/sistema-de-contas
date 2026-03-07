/**
 * PLEN — Reengajamento: contatos com conversa parada (intervalos grandes e aleatórios).
 */

import { createAdminClient } from '@/lib/supabase/server'

/** Mínimo de horas sem mensagem do usuário para considerar parado. */
const INATIVIDADE_HORAS = 24
/** Não reengajar se já enviamos nos últimos N horas. */
const INTERVALO_MINIMO_REENGAJAMENTO_HORAS = 72

export interface ContactParaReengajar {
  contact_id: string
  nome: string | null
}

/**
 * Retorna contatos que estão parados no fluxo (não USER_ACTIVE) ou USER_ACTIVE inativos,
 * e que não receberam reengajamento recente.
 */
export async function getContactsParaReengajar(limit = 10): Promise<ContactParaReengajar[]> {
  const supabase = createAdminClient()
  if (!supabase) return []

  const cutoffMs = Date.now() - INATIVIDADE_HORAS * 60 * 60 * 1000
  const reengagementCutoffMs = Date.now() - INTERVALO_MINIMO_REENGAJAMENTO_HORAS * 60 * 60 * 1000

  const { data: states, error: errStates } = await supabase
    .from('plen_user_state')
    .select('contact_id, last_user_message_at, reengagement_sent_at')

  if (errStates || !states?.length) return []

  const contactIds = states
    .filter((s: { last_user_message_at: string | null; reengagement_sent_at?: string | null }) => {
      const last = s.last_user_message_at ? new Date(s.last_user_message_at).getTime() : 0
      const reeng = s.reengagement_sent_at ? new Date(s.reengagement_sent_at).getTime() : 0
      if (last > cutoffMs) return false
      if (reeng > reengagementCutoffMs) return false
      return true
    })
    .map((s: { contact_id: string }) => s.contact_id)
    .slice(0, limit)

  if (contactIds.length === 0) return []

  const { data: contacts, error: errContacts } = await supabase
    .from('crm_contacts')
    .select('id, nome')
    .in('id', contactIds)

  if (errContacts || !contacts?.length) return []
  return contacts.map((c: { id: string; nome: string | null }) => ({
    contact_id: c.id,
    nome: c.nome,
  }))
}
