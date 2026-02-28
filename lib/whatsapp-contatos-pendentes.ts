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

/** Verifica se a mensagem indica intenção de usar a Plenipay (fluxo de boas-vindas). Identifica "Olá, quero utilizar a plenipay" e variações. */
export function isQueroUtilizarPlenipay(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const t = text.toLowerCase().trim().replace(/\s+/g, ' ')
  const temPlenipay = /pleni\s*pay|plenipay/.test(t)
  const temIntencao = t.includes('quero utilizar') || t.includes('quero usar') || /olá\s*,?\s*quero|ola\s*,?\s*quero/.test(t)
  return temPlenipay && temIntencao
}

/** Mensagem de saudação automática "Olá, Bem vindo (a) a Plenipay" que NÃO conta como resposta do fluxo de 3. Quem só recebeu isso ainda é pendente. */
export function isMensagemSaudacaoBoasVindas(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const t = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .replace(/\s+/g, ' ')
  return (
    /ola\s*,?\s*bem\s*vindo\s*\(?\s*a\s*\)?\s*a\s*pleni\s*pay/.test(t) ||
    (t.includes('bem vindo') && (t.includes('plenipay') || t.includes('pleni pay')))
  )
}

export interface ContatoPendente {
  id: string
  phone: string
  last_message: string | null
  last_message_at: string | null
  created_at: string
}

const LAST_MESSAGE_MANUAL = 'Adicionado manualmente para reenvio'

/** Lista contatos que o sistema identifica como não tendo recebido o fluxo de boas-vindas: mensagem tipo "quero utilizar plenipay" e welcome_sent_at nulo, ou adicionados manualmente. */
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
  const list = (data || []) as ContatoPendente[]
  return list.filter(
    (row) =>
      row.last_message === LAST_MESSAGE_MANUAL || isQueroUtilizarPlenipay(row.last_message ?? '')
  )
}

/** Notificação vinda da API Fácil (listar notificações). */
export interface NotificacaoParaBackfill {
  origem: string
  mensagem: string
  created_at: string
}

/** Preenche whatsapp_contatos a partir de notificações MENSAGEM_RECEBIDA (ex.: histórico da API Fácil). Só insere/atualiza quem tem mensagem tipo "quero utilizar plenipay". Não sobrescreve welcome_sent_at. */
export async function backfillFromNotificacoes(
  notificacoes: NotificacaoParaBackfill[]
): Promise<{ importados: number; error?: string }> {
  const supabase = createAdminClient()
  if (!supabase) return { importados: 0, error: 'Supabase não configurado' }
  const filtradas = notificacoes.filter((n) => isQueroUtilizarPlenipay(n.mensagem ?? ''))
  const porPhone = new Map<string | null, NotificacaoParaBackfill>()
  for (const n of filtradas) {
    const p = normalizarPhone(n.origem)
    if (p.length < 10) continue
    const existente = porPhone.get(p)
    if (!existente || new Date(n.created_at) > new Date(existente.created_at)) {
      porPhone.set(p, n)
    }
  }
  let importados = 0
  const now = new Date().toISOString()
  for (const [, n] of porPhone) {
    const p = normalizarPhone(n.origem)
    if (p.length < 10) continue
    const { error } = await supabase.from(TABLE).upsert(
      {
        phone: p,
        last_message: (n.mensagem ?? '').slice(0, 2000),
        last_message_at: n.created_at,
        updated_at: now,
      },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
    if (!error) importados += 1
  }
  return { importados }
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
      last_message: LAST_MESSAGE_MANUAL,
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
