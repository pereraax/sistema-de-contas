import { createAdminClient } from '@/lib/supabase/server'
import type { ContactStatus } from './contacts'

export interface InboxConversationItem {
  contact_id: string
  contact_telefone: string
  contact_nome: string | null
  contact_email: string | null
  contact_status: ContactStatus
  contact_ultima_interacao: string
  contact_avatar_url: string | null
  contact_last_seen_at: string | null
  contact_is_online: boolean | null
  contact_typing_until: string | null
  conversation_id: string
  conversation_status: string
  ultima_mensagem: string | null
  ultima_interacao: string
  unread_count: number
}

const toText = (v: unknown): string | null => {
  if (v == null) return null
  if (typeof v === 'string') return v === '[object Object]' ? null : v
  if (typeof v === 'object' && v !== null && 'message' in v) return String((v as { message?: unknown }).message ?? '')
  if (typeof v === 'object' && v !== null && 'text' in v) return String((v as { text?: unknown }).text ?? '')
  return null
}

/** Lista conversas a partir de crm_conversations (garante todas as conversas do sync). */
export async function getInboxList(options?: {
  status?: ContactStatus
  limit?: number
}): Promise<InboxConversationItem[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const limit = Math.min(options?.limit ?? 500, 1000)

  const { data: convs, error: convsError } = await supabase
    .from('crm_conversations')
    .select(
      `
      id,
      contact_id,
      status_conversa,
      ultima_mensagem,
      ultima_interacao,
      unread_count,
      crm_contacts (
        id,
        telefone,
        nome,
        email,
        status,
        ultima_interacao,
        avatar_url,
        last_seen_at,
        is_online,
        typing_until
      )
    `
    )
    .order('ultima_interacao', { ascending: false })
    .limit(limit)

  if (convsError) {
    console.error('[crm/inbox] getInboxList:', convsError)
    return await getInboxListFallback(options)
  }
  if (!convs?.length) return []

  const items: InboxConversationItem[] = convs.map((row: any) => {
    const c = row.crm_contacts ?? row.contact
    const contact = Array.isArray(c) ? c[0] : c
    const rawLast = row.ultima_mensagem ?? null
    const lastMsg = toText(rawLast)
    return {
      contact_id: contact?.id ?? row.contact_id,
      contact_telefone: contact?.telefone ?? '',
      contact_nome: contact?.nome ?? null,
      contact_email: contact?.email ?? null,
      contact_status: (contact?.status ?? 'novo_lead') as ContactStatus,
      contact_ultima_interacao: contact?.ultima_interacao ?? row.ultima_interacao,
      contact_avatar_url: contact?.avatar_url ?? null,
      contact_last_seen_at: contact?.last_seen_at ?? null,
      contact_is_online: contact?.is_online ?? null,
      contact_typing_until: contact?.typing_until ?? null,
      conversation_id: row.id,
      conversation_status: row.status_conversa ?? 'aberta',
      ultima_mensagem: lastMsg,
      ultima_interacao: row.ultima_interacao,
      unread_count: typeof row.unread_count === 'number' ? row.unread_count : 0,
    }
  })

  if (options?.status) {
    return items.filter((i) => i.contact_status === options.status)
  }
  return items
}

/** Fallback quando o join conversas+contacts falha (ex.: schema sem FK nomeada). */
async function getInboxListFallback(options?: { status?: ContactStatus; limit?: number }): Promise<InboxConversationItem[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const limit = Math.min(options?.limit ?? 500, 1000)
  let query = supabase
    .from('crm_contacts')
    .select('id, telefone, nome, email, status, ultima_interacao, avatar_url, last_seen_at, is_online, typing_until')
    .order('ultima_interacao', { ascending: false })
    .limit(limit)
  if (options?.status) query = query.eq('status', options.status)
  const { data: contacts, error: e1 } = await query
  if (e1 || !contacts?.length) return []
  const ids = contacts.map((c: { id: string }) => c.id)
  const { data: convs, error: e2 } = await supabase
    .from('crm_conversations')
    .select('id, contact_id, status_conversa, ultima_mensagem, ultima_interacao, unread_count')
    .in('contact_id', ids)
  if (e2) return []
  const byContact = new Map<string, (typeof convs)[0]>()
  for (const c of convs ?? []) {
    if (!byContact.has(c.contact_id)) byContact.set(c.contact_id, c)
  }
  const list: InboxConversationItem[] = contacts.map((c: any) => {
    const conv = byContact.get(c.id)
    return {
      contact_id: c.id,
      contact_telefone: c.telefone,
      contact_nome: c.nome ?? null,
      contact_email: c.email ?? null,
      contact_status: (c.status ?? 'novo_lead') as ContactStatus,
      contact_ultima_interacao: c.ultima_interacao,
      contact_avatar_url: c.avatar_url ?? null,
      contact_last_seen_at: c.last_seen_at ?? null,
      contact_is_online: c.is_online ?? null,
      contact_typing_until: c.typing_until ?? null,
      conversation_id: conv?.id ?? '',
      conversation_status: conv?.status_conversa ?? 'aberta',
      ultima_mensagem: toText(conv?.ultima_mensagem) ?? null,
      ultima_interacao: conv?.ultima_interacao ?? c.ultima_interacao,
      unread_count: typeof conv?.unread_count === 'number' ? conv.unread_count : 0,
    }
  })
  list.sort((a, b) => new Date(b.ultima_interacao).getTime() - new Date(a.ultima_interacao).getTime())
  return list
}
