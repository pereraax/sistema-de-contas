import { createAdminClient } from '@/lib/supabase/server'
import type { ContactStatus } from './contacts'

export interface InboxConversationItem {
  contact_id: string
  contact_telefone: string
  contact_nome: string | null
  contact_email: string | null
  contact_status: ContactStatus
  contact_ultima_interacao: string
  conversation_id: string
  conversation_status: string
  ultima_mensagem: string | null
  ultima_interacao: string
}

export async function getInboxList(options?: {
  status?: ContactStatus
  limit?: number
}): Promise<InboxConversationItem[]> {
  const supabase = createAdminClient()
  if (!supabase) return []

  let query = supabase
    .from('crm_contacts')
    .select(
      `
      id,
      telefone,
      nome,
      email,
      status,
      ultima_interacao
    `
    )
    .order('ultima_interacao', { ascending: false })
    .limit(options?.limit ?? 100)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  const { data: contacts, error: contactsError } = await query
  if (contactsError || !contacts?.length) return []

  const contactIds = contacts.map((c: { id: string }) => c.id)
  const { data: convs, error: convsError } = await supabase
    .from('crm_conversations')
    .select('id, contact_id, status_conversa, ultima_mensagem, ultima_interacao')
    .in('contact_id', contactIds)
    .order('ultima_interacao', { ascending: false })

  if (convsError) return []

  const convByContact = new Map<string, (typeof convs)[0]>()
  for (const c of convs ?? []) {
    if (!convByContact.has(c.contact_id)) {
      convByContact.set(c.contact_id, c)
    }
  }

  const toText = (v: unknown): string | null => {
    if (v == null) return null
    if (typeof v === 'string') return v === '[object Object]' ? null : v
    if (typeof v === 'object' && v !== null && 'message' in v) return String((v as { message?: unknown }).message ?? '')
    if (typeof v === 'object' && v !== null && 'text' in v) return String((v as { text?: unknown }).text ?? '')
    return null
  }

  const items: InboxConversationItem[] = contacts.map((c: any) => {
    const conv = convByContact.get(c.id)
    const rawLast = conv?.ultima_mensagem ?? null
    const lastMsg = toText(rawLast)
    return {
      contact_id: c.id,
      contact_telefone: c.telefone,
      contact_nome: c.nome ?? null,
      contact_email: c.email ?? null,
      contact_status: c.status,
      contact_ultima_interacao: c.ultima_interacao,
      conversation_id: conv?.id ?? '',
      conversation_status: conv?.status_conversa ?? 'aberta',
      ultima_mensagem: lastMsg,
      ultima_interacao: conv?.ultima_interacao ?? c.ultima_interacao,
    }
  })

  items.sort((a, b) => new Date(b.ultima_interacao).getTime() - new Date(a.ultima_interacao).getTime())
  return items
}
