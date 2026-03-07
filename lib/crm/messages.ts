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
  zapi_message_id?: string | null
  message_type?: string | null
  media_url?: string | null
  created_at: string
}

export interface CrmMessageInsert {
  contact_id: string
  conversation_id?: string | null
  tipo: MessageTipo
  mensagem: string
  origem?: MessageOrigem
  status_envio?: string | null
  zapi_message_id?: string | null
  message_type?: string | null
  media_url?: string | null
  /** Quando da mensagem (importação); se omitido usa NOW() */
  timestamp?: string | null
}

export async function findMessageByZapiId(zapiMessageId: string): Promise<CrmMessage | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('crm_messages')
    .select('*')
    .eq('zapi_message_id', zapiMessageId)
    .maybeSingle()
  if (error || !data) return null
  return data as CrmMessage
}

export async function createMessage(input: CrmMessageInsert): Promise<CrmMessage | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  if (input.zapi_message_id) {
    const existing = await findMessageByZapiId(input.zapi_message_id)
    if (existing) return existing
  }
  const row: Record<string, unknown> = {
    contact_id: input.contact_id,
    conversation_id: input.conversation_id ?? null,
    tipo: input.tipo,
    mensagem: input.mensagem,
    origem: input.origem ?? 'whatsapp',
    status_envio: input.status_envio ?? null,
    zapi_message_id: input.zapi_message_id ?? null,
    message_type: input.message_type ?? 'text',
    media_url: input.media_url ?? null,
  }
  if (input.timestamp) row.timestamp = input.timestamp
  const { data, error } = await supabase
    .from('crm_messages')
    .insert(row)
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return null
    console.error('[crm/messages] createMessage:', error)
    return null
  }
  return data as CrmMessage
}

/** Retorna Set dos zapi_message_id já existentes para um contato (sync em lote). */
export async function getExistingZapiMessageIdsByContact(contactId: string): Promise<Set<string>> {
  const supabase = createAdminClient()
  if (!supabase) return new Set()
  const { data, error } = await supabase
    .from('crm_messages')
    .select('zapi_message_id')
    .eq('contact_id', contactId)
    .not('zapi_message_id', 'is', null)
  if (error) return new Set()
  const set = new Set<string>()
  for (const row of data ?? []) {
    const id = (row as { zapi_message_id?: string }).zapi_message_id
    if (id) set.add(id)
  }
  return set
}

const BATCH_INSERT_SIZE = 100

/** Insere várias mensagens de uma vez (sync otimizado). Retorna quantidade inserida. */
export async function createMessagesBatch(rows: CrmMessageInsert[]): Promise<number> {
  const supabase = createAdminClient()
  if (!supabase || !rows.length) return 0
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH_INSERT_SIZE) {
    const chunk = rows.slice(i, i + BATCH_INSERT_SIZE)
    const payload = chunk.map((input) => {
      const row: Record<string, unknown> = {
        contact_id: input.contact_id,
        conversation_id: input.conversation_id ?? null,
        tipo: input.tipo,
        mensagem: input.mensagem,
        origem: input.origem ?? 'whatsapp',
        status_envio: input.status_envio ?? null,
        zapi_message_id: input.zapi_message_id ?? null,
        message_type: input.message_type ?? 'text',
        media_url: input.media_url ?? null,
      }
      if (input.timestamp) row.timestamp = input.timestamp
      return row
    })
    const { data, error } = await supabase.from('crm_messages').insert(payload).select('id')
    if (!error && data?.length) inserted += data.length
  }
  return inserted
}

export async function getMessagesByContactId(
  contactId: string,
  limit = 2000
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

export async function getMessagesByConversationId(
  conversationId: string,
  limit = 2000
): Promise<CrmMessage[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('crm_messages')
    .select('*')
    .eq('conversation_id', conversationId)
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

/** Atualiza status da mensagem (sent, delivered, read) — Evolution messages.update */
export async function updateMessageStatus(
  messageId: string,
  status: 'sent' | 'delivered' | 'read'
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('crm_messages')
    .update({ status_envio: status })
    .eq('id', messageId)
  return !error
}

/** Atualiza status por zapi_message_id (ID externo Z-API) */
export async function updateMessageStatusByExternalId(
  externalMessageId: string,
  status: 'sent' | 'delivered' | 'read'
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('crm_messages')
    .update({ status_envio: status })
    .eq('zapi_message_id', externalMessageId)
  return !error
}
