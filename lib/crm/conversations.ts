import { createAdminClient } from '@/lib/supabase/server'

export type ConversationStatus = 'aberta' | 'em_atendimento' | 'fechada'

export interface CrmConversation {
  id: string
  contact_id: string
  status_conversa: ConversationStatus
  ultima_mensagem: string | null
  ultima_interacao: string
  responsavel: string | null
  unread_count?: number
  created_at: string
  updated_at: string
}

export async function findOrCreateConversationForContact(contactId: string): Promise<CrmConversation | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const { data: existing } = await supabase
    .from('crm_conversations')
    .select('*')
    .eq('contact_id', contactId)
    .order('ultima_interacao', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing as CrmConversation

  const { data: created, error } = await supabase
    .from('crm_conversations')
    .insert({ contact_id: contactId, status_conversa: 'aberta' })
    .select()
    .single()
  if (error) {
    console.error('[crm/conversations] findOrCreate:', error)
    return null
  }
  return created as CrmConversation
}

export async function updateConversation(
  id: string,
  updates: { status_conversa?: ConversationStatus; ultima_mensagem?: string; ultima_interacao?: string; responsavel?: string; unread_count?: number }
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    ultima_interacao: updates.ultima_interacao ?? new Date().toISOString(),
  }
  if (updates.status_conversa !== undefined) payload.status_conversa = updates.status_conversa
  if (updates.ultima_mensagem !== undefined) payload.ultima_mensagem = updates.ultima_mensagem
  if (updates.responsavel !== undefined) payload.responsavel = updates.responsavel
  if (updates.unread_count !== undefined) payload.unread_count = updates.unread_count

  const { error } = await supabase.from('crm_conversations').update(payload).eq('id', id)
  if (error) {
    console.error('[crm/conversations] update:', error)
    return false
  }
  return true
}

/** Incrementa contador de não lidas (mensagem de entrada). */
export async function incrementConversationUnread(conversationId: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { data: row } = await supabase
    .from('crm_conversations')
    .select('unread_count')
    .eq('id', conversationId)
    .single()
  const current = typeof row?.unread_count === 'number' ? row.unread_count : 0
  return updateConversation(conversationId, { unread_count: current + 1 })
}

export async function getConversationsByContactId(contactId: string): Promise<CrmConversation[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('crm_conversations')
    .select('*')
    .eq('contact_id', contactId)
    .order('ultima_interacao', { ascending: false })
  if (error) return []
  return (data ?? []) as CrmConversation[]
}
