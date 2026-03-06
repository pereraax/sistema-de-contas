import { createAdminClient } from '@/lib/supabase/server'

export type ContactStatus =
  | 'novo_lead'
  | 'aguardando_email'
  | 'aguardando_codigo'
  | 'usuario_ativo'
  | 'cliente_pago'
  | 'inativo'

export interface CrmContact {
  id: string
  telefone: string
  nome: string | null
  email: string | null
  status: ContactStatus
  origem: string | null
  data_primeiro_contato: string
  ultima_interacao: string
  usuario_cadastrado: boolean
  data_cadastro: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface CrmContactInsert {
  telefone: string
  nome?: string | null
  email?: string | null
  status?: ContactStatus
  origem?: string
  usuario_cadastrado?: boolean
  data_cadastro?: string | null
  observacoes?: string | null
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

export async function createContact(input: CrmContactInsert): Promise<CrmContact | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const telefone = normalizePhone(input.telefone)
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert({
      telefone,
      nome: input.nome ?? null,
      email: input.email ?? null,
      status: input.status ?? 'novo_lead',
      origem: input.origem ?? 'whatsapp',
      usuario_cadastrado: input.usuario_cadastrado ?? false,
      data_cadastro: input.data_cadastro ?? null,
      observacoes: input.observacoes ?? null,
    })
    .select()
    .single()
  if (error) {
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
  return createContact({
    telefone: phone,
    nome: options?.nome ?? null,
    origem: options?.origem ?? 'whatsapp',
  })
}

export async function updateContact(
  id: string,
  updates: Partial<Pick<CrmContact, 'nome' | 'email' | 'status' | 'observacoes' | 'usuario_cadastrado' | 'data_cadastro'>>
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('crm_contacts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      ...(updates.status !== undefined ? {} : {}),
    })
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
