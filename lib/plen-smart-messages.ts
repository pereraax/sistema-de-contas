/**
 * Mensagens inteligentes da assistente Plen (AHA moments).
 * Eventos por tempo sem interação (10min, 1h, 24h) e por marcos (10 e 20 registros, categorias).
 * Anti-spam: no máximo uma mensagem automática por hora; cancelar se o usuário voltar a interagir.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { sendTextMessage as sendTextMessageZapi } from '@/lib/whatsapp-zapi'
import { sendTextMessage as sendTextMessageApifacil } from '@/lib/whatsapp-apifacil'
import { isZapiConfigured } from '@/lib/whatsapp-zapi'

export const EVENT_10MIN = '10min'
export const EVENT_1H = '1h'
export const EVENT_24H = '24h'
export const EVENT_10_REGISTROS = '10_registros'
export const EVENT_20_REGISTROS = '20_registros'
export const EVENT_CATEGORIA_PREFIX = 'categoria_'

/** Mínimo 1 hora entre duas mensagens inteligentes para o mesmo usuário (evita repetição na mesma conversa). */
export const MIN_INTERVAL_SMART_MS_MS = 60 * 60 * 1000

/** Intervalo aleatório entre cada envio no cron: 8–12 s (anti-spam). */
const DELAY_BETWEEN_SENDS_MS = { min: 8000, max: 12000 }

/** Atualiza last_message_at quando o usuário envia qualquer mensagem (cancelar envios automáticos). */
export async function updateLastActivity(supabase: SupabaseClient, accountOwnerId: string): Promise<void> {
  const now = new Date().toISOString()
  await supabase
    .from('plen_user_activity')
    .upsert(
      { account_owner_id: accountOwnerId, last_message_at: now, updated_at: now },
      { onConflict: 'account_owner_id' }
    )
}

function normalizePhone(phone: string): string {
  const limpo = String(phone ?? '').replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}

/**
 * Constrói a lista de atividades (account_owner_id + last_message_at) a partir do WhatsApp completo.
 * Fonte: whatsapp_contatos.last_message_at (atualizado em toda mensagem recebida).
 * Assim o intervalo é sempre "desde que o lead parou de responder" no WhatsApp.
 */
async function getActivitiesFromWhatsApp(supabase: SupabaseClient): Promise<{ account_owner_id: string; last_message_at: string }[]> {
  const { data: contatos } = await supabase
    .from('whatsapp_contatos')
    .select('phone, last_message_at')
    .not('last_message_at', 'is', null)
  if (!contatos?.length) return []

  const phones = (contatos as { phone: string; last_message_at: string }[]).map((r) => ({
    phone: normalizePhone(r.phone),
    last_message_at: r.last_message_at,
  }))

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, whatsapp')
    .not('whatsapp', 'is', null)
  const ownerByPhoneFromProfile = new Map<string, string>()
  for (const p of profiles ?? []) {
    const ph = normalizePhone((p as { whatsapp?: string }).whatsapp ?? '')
    if (ph.length >= 10) ownerByPhoneFromProfile.set(ph, (p as { id: string }).id)
  }

  const { data: sessions } = await supabase
    .from('whatsapp_sessions')
    .select('user_id, phone_number')
    .not('phone_number', 'is', null)
  for (const s of sessions ?? []) {
    const ph = normalizePhone((s as { phone_number?: string }).phone_number ?? '')
    if (ph.length >= 10) {
      const uid = (s as { user_id: string }).user_id
      if (!ownerByPhoneFromProfile.has(ph)) ownerByPhoneFromProfile.set(ph, uid)
    }
  }

  const ownerToLatestMessage = new Map<string, string>()
  for (const { phone, last_message_at } of phones) {
    const ownerId = ownerByPhoneFromProfile.get(phone)
    if (!ownerId) continue
    const current = ownerToLatestMessage.get(ownerId)
    if (!current || new Date(last_message_at) > new Date(current)) {
      ownerToLatestMessage.set(ownerId, last_message_at)
    }
  }

  return [...ownerToLatestMessage.entries()].map(([account_owner_id, last_message_at]) => ({
    account_owner_id,
    last_message_at,
  }))
}

/** Retorna o telefone do usuário (profiles.whatsapp ou whatsapp_sessions.phone_number). */
export async function getPhoneForUser(supabase: SupabaseClient, accountOwnerId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('whatsapp')
    .eq('id', accountOwnerId)
    .single()
  let phone = (profile?.whatsapp ?? '').trim().replace(/\D/g, '')
  if (phone.length >= 10) {
    return phone.startsWith('55') ? phone : `55${phone}`
  }
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('phone_number')
    .eq('user_id', accountOwnerId)
    .not('phone_number', 'is', null)
    .limit(1)
    .maybeSingle()
  phone = (session?.phone_number ?? '').trim().replace(/\D/g, '')
  if (phone.length >= 10) {
    return phone.startsWith('55') ? phone : `55${phone}`
  }
  return null
}

/** Mensagens por tipo de evento. */
function buildMessage(eventType: string, payload?: { total?: number; categoria?: string; categoriaLabel?: string }): string {
  switch (eventType) {
    case EVENT_10MIN:
      return `💡 Estava analisando seu primeiro registro.

Se continuar registrando seus gastos comigo, posso mostrar exatamente para onde seu dinheiro está indo.`
    case EVENT_1H:
      return `Uma curiosidade 👀

A maioria das pessoas não lembra onde gastou parte do dinheiro no final do mês.

Registrando seus gastos aqui comigo você sempre vai saber.`
    case EVENT_24H:
      return `💙 Ontem você começou a organizar seus gastos comigo.

Que tal registrar mais alguns hoje?

Mesmo pequenos valores ajudam a entender seus hábitos.`
    case EVENT_10_REGISTROS: {
      const total = payload?.total ?? 0
      const cat = payload?.categoriaLabel ?? payload?.categoria ?? 'diversos'
      const totalStr = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
      return `📊 Já registrei alguns gastos seus.

Até agora você gastou ${totalStr} em ${cat}.

Continuando assim posso gerar relatórios completos para você.`
    }
    case EVENT_20_REGISTROS:
      return `💙 Você já registrou vários gastos comigo.

Isso já é mais organização financeira do que a maioria das pessoas faz.`
    default:
      if (eventType.startsWith(EVENT_CATEGORIA_PREFIX)) {
        const cat = payload?.categoriaLabel ?? payload?.categoria ?? 'isso'
        const catKey = payload?.categoria ?? ''
        if (catKey === 'uber' || cat.toLowerCase() === 'uber') {
          return `💡 Notei que você usa bastante Uber.

Depois de alguns dias consigo te mostrar quanto está gastando com transporte.`
        }
        return `💡 Notei que você usa bastante ${cat}.

Depois de alguns dias consigo te mostrar quanto está gastando com isso.`
      }
      return ''
  }
}

/** Categorias que geram mensagem dinâmica (chave normalizada -> label para a mensagem). */
const CATEGORIA_LABELS: Record<string, string> = {
  uber: 'Uber',
  transporte: 'transporte',
  mercado: 'mercado',
  supermercado: 'supermercado',
  alimentação: 'alimentação',
  alimentacao: 'alimentação',
  outros: 'diversos',
}

export type EligibleSmartMessage = {
  userId: string
  eventType: string
  payload?: { total?: number; categoria?: string; categoriaLabel?: string }
}

/**
 * Retorna usuários elegíveis para exatamente uma mensagem inteligente cada (prioridade: 10min > 1h > 24h > 10_reg > 20_reg > categoria).
 * Respeita intervalo mínimo entre mensagens.
 * Atividade é construída a partir do WhatsApp (whatsapp_contatos), revisando todos os contatos e usando
 * last_message_at como "desde que o lead parou de responder".
 */
export async function getEligibleUsers(supabase: SupabaseClient): Promise<EligibleSmartMessage[]> {
  const now = new Date()
  const nowMs = now.getTime()

  const activities = await getActivitiesFromWhatsApp(supabase)
  if (!activities.length) return []

  const nowIso = now.toISOString()
  await supabase
    .from('plen_user_activity')
    .upsert(
      activities.map((act) => ({
        account_owner_id: act.account_owner_id,
        last_message_at: act.last_message_at,
        updated_at: nowIso,
      })),
      { onConflict: 'account_owner_id' }
    )
    .then(() => {})

  const { data: sentRows } = await supabase
    .from('plen_smart_messages_sent')
    .select('user_id, event_type, sent_at')
  const lastSentByUser = new Map<string, number>()
  const sentTypesByUser = new Map<string, Set<string>>()
  for (const r of sentRows ?? []) {
    const t = new Date(r.sent_at).getTime()
    if (!lastSentByUser.has(r.user_id) || t > lastSentByUser.get(r.user_id)!) {
      lastSentByUser.set(r.user_id, t)
    }
    if (!sentTypesByUser.has(r.user_id)) sentTypesByUser.set(r.user_id, new Set())
    sentTypesByUser.get(r.user_id)!.add(r.event_type)
  }

  const ownerIds = [...new Set(activities.map((a) => a.account_owner_id))]
  const { data: users } = await supabase.from('users').select('id, account_owner_id').in('account_owner_id', ownerIds)
  const userToOwner = new Map<string, string>()
  for (const u of users ?? []) {
    userToOwner.set(u.id, u.account_owner_id)
  }
  // Fallback: se não houver tabela/users, tratar account_owner_id como próprio user (contas com um único usuário)
  if (userToOwner.size === 0) {
    for (const id of ownerIds) userToOwner.set(id, id)
  }

  const { data: registros } = await supabase
    .from('registros')
    .select('user_id, valor, categoria, tipo')
    .eq('tipo', 'saida')
  const countByOwner = new Map<string, number>()
  const totalByOwner = new Map<string, number>()
  const categoriasByOwner = new Map<string, Map<string, number>>()
  for (const r of registros ?? []) {
    const owner = userToOwner.get(r.user_id)
    if (!owner) continue
    countByOwner.set(owner, (countByOwner.get(owner) ?? 0) + 1)
    totalByOwner.set(owner, (totalByOwner.get(owner) ?? 0) + Number(r.valor))
    const cat = (r.categoria ?? 'outros').trim().toLowerCase().replace(/\s+/g, '_')
    if (!categoriasByOwner.has(owner)) categoriasByOwner.set(owner, new Map())
    const m = categoriasByOwner.get(owner)!
    m.set(cat, (m.get(cat) ?? 0) + 1)
  }

  const result: EligibleSmartMessage[] = []
  for (const act of activities) {
    const userId = act.account_owner_id
    const lastMsg = new Date(act.last_message_at).getTime()
    const lastSent = lastSentByUser.get(userId) ?? 0
    if (nowMs - lastSent < MIN_INTERVAL_SMART_MS_MS) continue
    const sent = sentTypesByUser.get(userId) ?? new Set()
    const count = countByOwner.get(userId) ?? 0
    const total = totalByOwner.get(userId) ?? 0
    const topCat = categoriasByOwner.get(userId)
      ? [...categoriasByOwner.get(userId)!.entries()].sort((a, b) => b[1] - a[1])[0]
      : null

    const min10 = 10 * 60 * 1000
    const min60 = 60 * 60 * 1000
    const min24h = 24 * 60 * 60 * 1000
    const elapsed = nowMs - lastMsg

    // Janelas ampliadas para o cron não perder contatos (ex.: cron a cada 10–15 min)
    const window10 = 35 * 60 * 1000   // 10min até 45min de inatividade
    const window1h = 90 * 60 * 1000   // 1h até 2h30 de inatividade
    const window24h = 90 * 60 * 1000  // 24h até 25h30 de inatividade

    let chosen: { eventType: string; payload?: EligibleSmartMessage['payload'] } | null = null
    if (!sent.has(EVENT_10MIN) && count >= 1 && elapsed >= min10 && elapsed <= min10 + window10) {
      chosen = { eventType: EVENT_10MIN }
    } else if (!sent.has(EVENT_1H) && elapsed >= min60 && elapsed <= min60 + window1h) {
      chosen = { eventType: EVENT_1H }
    } else if (!sent.has(EVENT_24H) && elapsed >= min24h && elapsed <= min24h + window24h) {
      chosen = { eventType: EVENT_24H }
    } else if (!sent.has(EVENT_10_REGISTROS) && count >= 10) {
      const catName = topCat?.[0] ? (CATEGORIA_LABELS[topCat[0]] ?? topCat[0]) : 'diversos'
      chosen = { eventType: EVENT_10_REGISTROS, payload: { total, categoria: topCat?.[0], categoriaLabel: catName } }
    } else if (!sent.has(EVENT_20_REGISTROS) && count >= 20) {
      chosen = { eventType: EVENT_20_REGISTROS }
    } else if (topCat && topCat[1] >= 3) {
      const catKey = EVENT_CATEGORIA_PREFIX + topCat[0]
      if (!sent.has(catKey)) {
        const label = CATEGORIA_LABELS[topCat[0]] ?? topCat[0]
        chosen = { eventType: catKey, payload: { categoria: topCat[0], categoriaLabel: label } }
      }
    }
    if (chosen) {
      result.push({ userId, eventType: chosen.eventType, payload: chosen.payload })
    }
  }
  return result
}

/** Marca mensagem inteligente como enviada. */
export async function recordSmartMessageSent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  payload?: Record<string, unknown>
): Promise<void> {
  await supabase.from('plen_smart_messages_sent').upsert(
    { user_id: userId, event_type: eventType, sent_at: new Date().toISOString(), payload: payload ?? null },
    { onConflict: 'user_id,event_type' }
  )
}

/** Monta o texto da mensagem e envia por WhatsApp; registra envio. Delay aleatório 1–4s antes (opcional). */
export async function sendSmartMessage(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  payload?: { total?: number; categoria?: string; categoriaLabel?: string }
): Promise<{ success: boolean; error?: string }> {
  const phone = await getPhoneForUser(supabase, userId)
  if (!phone) {
    return { success: false, error: 'Telefone não encontrado' }
  }
  const text = buildMessage(eventType, payload)
  if (!text) {
    return { success: false, error: 'Mensagem vazia' }
  }
  const delayMs = DELAY_BETWEEN_SENDS_MS.min + Math.random() * (DELAY_BETWEEN_SENDS_MS.max - DELAY_BETWEEN_SENDS_MS.min)
  await new Promise((r) => setTimeout(r, delayMs))
  const sendTextMessage = isZapiConfigured() ? sendTextMessageZapi : sendTextMessageApifacil
  const result = await sendTextMessage(phone, text)
  if (result.success) {
    await recordSmartMessageSent(supabase, userId, eventType, payload as Record<string, unknown>)
  }
  return { success: result.success ?? false, error: result.error }
}

/** Exportar buildMessage para testes. */
export { buildMessage as _buildMessage }
