import { createAdminClient } from '@/lib/supabase/server'

export type ContactStatus =
  | 'novo_lead'
  | 'aguardando_email'
  | 'aguardando_codigo'
  | 'usuario_ativo'
  | 'cliente_pago'
  | 'inativo'
  | 'aguardando_atendente'

export interface CrmContact {
  id: string
  telefone: string
  jid?: string | null
  nome: string | null
  email: string | null
  status: ContactStatus
  origem: string | null
  data_primeiro_contato: string
  ultima_interacao: string
  usuario_cadastrado: boolean
  data_cadastro: string | null
  observacoes: string | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
}

export interface CrmContactInsert {
  telefone: string
  jid?: string | null
  nome?: string | null
  email?: string | null
  status?: ContactStatus
  origem?: string
  usuario_cadastrado?: boolean
  data_cadastro?: string | null
  observacoes?: string | null
  avatar_url?: string | null
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').trim()
}

export async function findContactByPhone(phone: string): Promise<CrmContact | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const normalized = normalizePhone(phone)
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('telefone', normalized)
    .maybeSingle()
  if (error || !data) return null
  return data as CrmContact
}

export async function getContactById(id: string): Promise<CrmContact | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return data as CrmContact
}

/** Busca contato por email (case-insensitive). Usado para enriquecer lista admin. */
export async function findContactByEmail(email: string): Promise<CrmContact | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const norm = email.trim().toLowerCase()
  if (!norm || !norm.includes('@')) return null
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .ilike('email', norm)
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return data as CrmContact
}

/** Lista todos os contatos (id, nome, telefone). Para reparo de números. */
export async function listContactsForRepair(): Promise<Pick<CrmContact, 'id' | 'nome' | 'telefone'>[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('id, nome, telefone')
  if (error) return []
  return (data ?? []) as Pick<CrmContact, 'id' | 'nome' | 'telefone'>[]
}

export async function createContact(input: CrmContactInsert): Promise<CrmContact | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const telefone = normalizePhone(input.telefone)
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert({
      telefone,
      jid: input.jid ?? null,
      nome: input.nome ?? null,
      email: input.email ?? null,
      status: input.status ?? 'novo_lead',
      origem: input.origem ?? 'whatsapp',
      usuario_cadastrado: input.usuario_cadastrado ?? false,
      data_cadastro: input.data_cadastro ?? null,
      observacoes: input.observacoes ?? null,
      avatar_url: input.avatar_url ?? null,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505' && typeof error.details === 'string' && error.details.includes('telefone')) {
      const existing = await findContactByPhone(input.telefone)
      if (existing) return existing
    }
    console.error('[crm/contacts] createContact:', error)
    return null
  }
  return data as CrmContact
}

export async function getOrCreateContactByPhone(
  phone: string,
  options?: { nome?: string; origem?: string }
): Promise<CrmContact | null> {
  const existing = await findContactByPhone(phone)
  if (existing) {
    if (options?.nome && !existing.nome) {
      await updateContact(existing.id, { nome: options.nome })
      return findContactByPhone(phone) as Promise<CrmContact | null>
    }
    return existing
  }
  const created = await createContact({
    telefone: phone,
    nome: options?.nome ?? null,
    origem: options?.origem ?? 'whatsapp',
  })
  if (created) return created
  return findContactByPhone(phone)
}

/** Retorna o contato e se acabou de ser criado (novo lead). */
export async function getOrCreateContactByPhoneWithFlag(
  phone: string,
  options?: { nome?: string; origem?: string; avatar_url?: string | null; jid?: string | null }
): Promise<{ contact: CrmContact | null; created: boolean }> {
  const existing = await findContactByPhone(phone)
  if (existing) {
    const updates: Parameters<typeof updateContact>[1] = {}
    if (options?.nome && !existing.nome) updates.nome = options.nome
    if (options?.avatar_url !== undefined) updates.avatar_url = options.avatar_url
    if (options?.jid !== undefined && options.jid) updates.jid = options.jid
    if (Object.keys(updates).length) {
      await updateContact(existing.id, updates)
      const updated = await findContactByPhone(phone)
      return { contact: updated, created: false }
    }
    return { contact: existing, created: false }
  }
  const contact = await createContact({
    telefone: phone,
    jid: options?.jid ?? null,
    nome: options?.nome ?? null,
    origem: options?.origem ?? 'whatsapp',
    avatar_url: options?.avatar_url ?? null,
  })
  if (contact) return { contact, created: true }
  const fallback = await findContactByPhone(phone)
  return { contact: fallback, created: false }
}

export async function updateContact(
  id: string,
  updates: Partial<Pick<CrmContact, 'nome' | 'email' | 'status' | 'observacoes' | 'usuario_cadastrado' | 'data_cadastro' | 'avatar_url' | 'telefone' | 'jid'>>
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
  if (updates.telefone !== undefined) payload.telefone = normalizePhone(String(updates.telefone))
  const { error } = await supabase
    .from('crm_contacts')
    .update(payload)
    .eq('id', id)
  if (error) {
    console.error('[crm/contacts] updateContact:', error)
    return false
  }
  return true
}

export async function touchContactLastInteraction(contactId: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  await supabase
    .from('crm_contacts')
    .update({ ultima_interacao: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', contactId)
}

/** Atualiza presença (online, last_seen, digitando) para estilo WhatsApp Web. */
export async function updateContactPresence(
  contactId: string,
  updates: { is_online?: boolean; last_seen_at?: string | null; typing_until?: string | null }
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.is_online !== undefined) payload.is_online = updates.is_online
  if (updates.last_seen_at !== undefined) payload.last_seen_at = updates.last_seen_at
  if (updates.typing_until !== undefined) payload.typing_until = updates.typing_until
  const { error } = await supabase.from('crm_contacts').update(payload).eq('id', contactId)
  return !error
}
