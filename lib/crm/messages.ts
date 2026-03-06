import { createAdminClient } from '@/lib/supabase/server'

export type MessageTipo = 'entrada' | 'saida'
export type MessageOrigem = 'whatsapp' | 'sistema' | 'automacao'

export interface CrmMessage {
  id: string
  contact_id: string
  conversation_id: string | null
  tipo: MessageTipo
  mensagem: string
  timestamp: string
  origem: MessageOrigem
  status_envio: string | null
  created_at: string
}

export interface CrmMessageInsert {
  contact_id: string
  conversation_id?: string | null
  tipo: MessageTipo
  mensagem: string
  origem?: MessageOrigem
  status_envio?: string | null
}

export async function createMessage(input: CrmMessageInsert): Promise<CrmMessage | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('crm_messages')
    .insert({
      contact_id: input.contact_id,
      conversation_id: input.conversation_id ?? null,
      tipo: input.tipo,
      mensagem: input.mensagem,
      origem: input.origem ?? 'whatsapp',
      status_envio: input.status_envio ?? null,
    })
    .select()
    .single()
  if (error) {
    console.error('[crm/messages] createMessage:', error)
    return null
  }
  return data as CrmMessage
}

export async function getMessagesByContactId(
  contactId: string,
  limit = 200
): Promise<CrmMessage[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('crm_messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('timestamp', { ascending: true })
    .range(0, limit - 1)
  if (error) return []
  return (data ?? []) as CrmMessage[]
}

export async function getLastMessageByContactId(contactId: string): Promise<CrmMessage | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('crm_messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as CrmMessage
}
