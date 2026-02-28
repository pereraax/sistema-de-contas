/**
 * Contatos WhatsApp: gravar última mensagem e marcar quando as 3 mensagens de boas-vindas foram enviadas.
 * Usado para listar no admin quem ainda não foi respondido ("quero utilizar plenipay").
 */

import { createAdminClient } from '@/lib/supabase/server'

const TABLE = 'whatsapp_contatos'

function normalizarPhone(phone: string): string {
  const limpo = phone.replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}

/** Gravar ou atualizar contato com a última mensagem recebida. */
export async function recordIncomingMessage(phone: string, message: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    {
      phone: p,
      last_message: message?.slice(0, 2000) ?? null,
      last_message_at: now,
      updated_at: now,
    },
    { onConflict: 'phone', ignoreDuplicates: false }
  )
}

/** Marcar que as 3 mensagens de boas-vindas foram enviadas para este número. */
export async function markWelcomeSent(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    {
      phone: p,
      welcome_sent_at: now,
      updated_at: now,
    },
    { onConflict: 'phone', ignoreDuplicates: false }
  )
}

/** Verifica se a mensagem é do tipo "quero utilizar (a) plenipay". */
export function isQueroUtilizarPlenipay(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const t = text.toLowerCase().trim().replace(/\s+/g, ' ')
  return (
    (t.includes('quero utilizar') && t.includes('plenipay')) ||
    (t.includes('quero usar') && t.includes('plenipay'))
  )
}

export interface ContatoPendente {
  id: string
  phone: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
}

/** Listar contatos que ainda não receberam as 3 boas-vindas (welcome_sent_at nulo). Inclui quem enviou qualquer mensagem e quem foi adicionado manualmente. */
export async function listPendentes(): Promise<ContatoPendente[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, phone, last_message, last_message_at, created_at')
    .is('welcome_sent_at', null)
    .order('last_message_at', { ascending: false })
  if (error) {
    console.error('[whatsapp-contatos-pendentes] listPendentes error:', error)
    return []
  }
  return (data || []) as ContatoPendente[]
}

/** Adicionar contato manualmente para reenvio (ex.: número que não aparece porque escreveu antes do deploy). */
export async function addPendenteManualmente(phone: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  if (!supabase) return { ok: false, error: 'Supabase não configurado' }
  const p = normalizarPhone(phone)
  if (p.length < 10) return { ok: false, error: 'Número inválido' }
  const now = new Date().toISOString()
  const { error } = await supabase.from(TABLE).upsert(
    {
      phone: p,
      last_message: 'Adicionado manualmente para reenvio',
      last_message_at: now,
      welcome_sent_at: null,
      updated_at: now,
    },
    { onConflict: 'phone', ignoreDuplicates: false }
  )
  if (error) {
    console.error('[whatsapp-contatos-pendentes] addPendenteManualmente error:', error)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}
