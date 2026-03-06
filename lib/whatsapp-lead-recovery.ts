/**
 * Recuperação de leads que abandonaram a conversa após o pedido de e-mail.
 * Sequência: 5min, 10min, 15h, 24h, 48h — mensagens naturais, sem repetição na mesma conversa.
 */

import { createAdminClient } from '@/lib/supabase/server'

const TABLE = 'whatsapp_lead_recovery'

export type StatusConversa = 'ativo' | 'aguardando_email' | 'follow_up' | 'cadastro_concluido'

function normalizarPhone(phone: string): string {
  const limpo = String(phone || '').replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}

// --- Conjuntos de mensagens por etapa (especificação) ---

const FOLLOWUP_1_MSGS = [
  'Oi! Só preciso do seu e-mail para continuar configurando tudo pra você 🙂',
  'Parece que a gente estava quase terminando. Me envia seu e-mail e eu finalizo aqui.',
  'Estou por aqui quando quiser continuar, é só enviar seu e-mail.',
  'Rapidinho: só preciso do seu e-mail para seguir com o processo.',
  'Estamos quase lá. Me manda seu e-mail que eu cuido do resto.',
  'Deixei seu progresso salvo aqui. É só enviar seu e-mail e continuamos.',
  'Sem pressa. Quando puder, me manda seu e-mail.',
  'Só aguardando seu e-mail para liberar o próximo passo.',
]

const FOLLOWUP_2_MSGS = [
  'Às vezes as mensagens se perdem 😅 Se ainda estiver por aqui, é só enviar seu e-mail.',
  'Deixei tudo pronto aqui. Só preciso do seu e-mail para continuar.',
  'Quando você enviar seu e-mail eu consigo finalizar essa parte.',
  'Guardei seu lugar aqui para continuarmos.',
  'Seu acesso está quase pronto, só falta seu e-mail.',
  'Estou pronto para continuar quando você quiser.',
  'É só enviar seu e-mail que eu sigo com tudo aqui.',
]

const FOLLOWUP_3_MSGS = [
  'Oi! Só passando para ver se você ainda quer continuar. É só enviar seu e-mail.',
  'Deixei tudo salvo aqui caso queira continuar depois.',
  'Se ainda quiser finalizar isso, me manda seu e-mail.',
  'Seu progresso continua salvo aqui 🙂',
  'Estou por aqui caso ainda queira continuar.',
]

const FOLLOWUP_4_MSGS = [
  'Oi! Ontem começamos algo aqui. Quer continuar?',
  'Ainda deixei tudo preparado para você aqui.',
  'Se quiser continuar, é só enviar seu e-mail.',
  'Seu progresso ainda está salvo caso queira finalizar.',
]

const FOLLOWUP_5_MSGS = [
  'Essa é minha última mensagem por aqui 🙂 Se ainda quiser continuar, é só enviar seu e-mail.',
  'Vou deixar isso aberto caso queira finalizar depois.',
  'Se ainda precisar de ajuda com isso, é só enviar seu e-mail.',
  'Sem pressa — quando quiser continuar é só mandar seu e-mail.',
]

const STAGE_MESSAGES: string[][] = [
  [],
  FOLLOWUP_1_MSGS,
  FOLLOWUP_2_MSGS,
  FOLLOWUP_3_MSGS,
  FOLLOWUP_4_MSGS,
  FOLLOWUP_5_MSGS,
]

/** Intervalos em ms: etapa 1=5min, 2=10min, 3=15h, 4=24h, 5=48h */
const STAGE_DELAYS_MS = [
  0,
  5 * 60 * 1000,                    // 5 min
  10 * 60 * 1000,                   // 10 min
  15 * 60 * 60 * 1000,              // 15 h
  24 * 60 * 60 * 1000,              // 24 h
  48 * 60 * 60 * 1000,              // 48 h
]

/**
 * Escolhe uma mensagem aleatória do estágio que ainda não foi enviada nesta conversa.
 * Se todas do estágio já foram enviadas, retorna null para não repetir na mesma conversa.
 */
export function pickRandomMessageForStage(
  stage: 1 | 2 | 3 | 4 | 5,
  alreadySent: string[]
): string | null {
  const pool = STAGE_MESSAGES[stage]
  if (!pool?.length) return null
  const available = pool.filter((m) => !alreadySent.includes(m))
  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

// --- Estado ---

export interface LeadRecoveryRow {
  phone: string
  status_conversa: StatusConversa
  email_requested_at: string
  timestamp_ultima_mensagem_usuario: string | null
  etapa_followup: number
  mensagens_followup_enviadas: string[]
  cadastro_finalizado: boolean
  email_recebido: boolean
  created_at: string
  updated_at: string
}

/**
 * Inicia o estado de recuperação quando a assistente envia "Qual seu e-mail?".
 * Chamar logo após setSignupStepEmail e envio da mensagem.
 * Requer tabela whatsapp_lead_recovery (migration 20260306100000_whatsapp_lead_recovery.sql).
 */
export async function initLeadRecovery(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) {
    console.warn('[lead-recovery] initLeadRecovery: Supabase admin não disponível')
    return
  }
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  const { error } = await supabase.from(TABLE).upsert(
    {
      phone: p,
      status_conversa: 'aguardando_email',
      email_requested_at: now,
      timestamp_ultima_mensagem_usuario: null,
      etapa_followup: 0,
      mensagens_followup_enviadas: [],
      cadastro_finalizado: false,
      email_recebido: false,
      updated_at: now,
    },
    { onConflict: 'phone' }
  )
  if (error) {
    console.error('[lead-recovery] initLeadRecovery falhou para', p, '—', error.message, '| Aplique a migration whatsapp_lead_recovery se a tabela não existir.')
  }
}

/**
 * Cancela follow-ups quando o usuário responde (qualquer mensagem).
 * Chamar no webhook ao processar mensagem recebida do lead.
 */
export async function cancelLeadRecoveryOnUserReply(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase
    .from(TABLE)
    .update({
      status_conversa: 'ativo',
      timestamp_ultima_mensagem_usuario: now,
      updated_at: now,
    })
    .eq('phone', p)
}

/**
 * Marca que o lead enviou o e-mail (antes de criar conta). Cancela follow-ups.
 */
export async function markLeadRecoveryEmailReceived(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase
    .from(TABLE)
    .update({
      email_recebido: true,
      status_conversa: 'ativo',
      updated_at: now,
    })
    .eq('phone', p)
}

/**
 * Marca que o cadastro foi concluído (conta criada). Cancela follow-ups.
 */
export async function markLeadRecoveryCadastroConcluido(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase
    .from(TABLE)
    .update({
      cadastro_finalizado: true,
      status_conversa: 'cadastro_concluido',
      updated_at: now,
    })
    .eq('phone', p)
}

/**
 * Retorna a linha de recuperação para o telefone, ou null.
 */
export async function getLeadRecovery(phone: string): Promise<LeadRecoveryRow | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const p = normalizarPhone(phone)
  if (p.length < 10) return null
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('phone', p)
    .maybeSingle()
  if (error || !data) return null
  return {
    ...data,
    mensagens_followup_enviadas: Array.isArray(data.mensagens_followup_enviadas)
      ? data.mensagens_followup_enviadas
      : [],
  } as LeadRecoveryRow
}

/**
 * Lista leads elegíveis para o próximo follow-up.
 * Regras: status aguardando_email ou follow_up; cadastro_finalizado e email_recebido false;
 * última mensagem do usuário anterior ao pedido de e-mail (não respondeu depois);
 * tempo desde email_requested_at >= delay da próxima etapa.
 */
export async function listLeadsDueForFollowUp(): Promise<
  { phone: string; stage: 1 | 2 | 3 | 4 | 5; message: string }[]
> {
  const supabase = createAdminClient()
  if (!supabase) {
    throw new Error('Supabase admin não disponível (SUPABASE_SERVICE_ROLE_KEY?)')
  }

  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('phone, status_conversa, email_requested_at, etapa_followup, mensagens_followup_enviadas')
    .in('status_conversa', ['aguardando_email', 'follow_up'])
    .eq('cadastro_finalizado', false)
    .eq('email_recebido', false)

  if (error) throw new Error(`whatsapp_lead_recovery: ${error.message}`)
  if (!rows?.length) return []

  const phones = (rows as { phone: string }[]).map((r) => r.phone).filter(Boolean)
  const { data: contatos } = await supabase
    .from('whatsapp_contatos')
    .select('phone, last_message_at')
    .in('phone', phones)
  const lastMessageByPhone = new Map<string, string>()
  for (const c of contatos || []) {
    const p = (c as { phone: string; last_message_at?: string }).phone
    const at = (c as { last_message_at?: string }).last_message_at
    if (p && at) lastMessageByPhone.set(p, at)
  }

  const now = Date.now()
  const result: { phone: string; stage: 1 | 2 | 3 | 4 | 5; message: string }[] = []

  for (const row of rows as (LeadRecoveryRow & { mensagens_followup_enviadas?: string[] })[]) {
    const emailRequestedAt = new Date(row.email_requested_at).getTime()
    const lastMsgAt = lastMessageByPhone.get(row.phone)
    if (lastMsgAt && new Date(lastMsgAt).getTime() > emailRequestedAt) continue

    const nextStage = (Math.min(5, (row.etapa_followup ?? 0) + 1)) as 1 | 2 | 3 | 4 | 5
    const requiredDelay = STAGE_DELAYS_MS[nextStage]
    if (now - emailRequestedAt < requiredDelay) continue

    const sent = Array.isArray(row.mensagens_followup_enviadas) ? row.mensagens_followup_enviadas : []
    const message = pickRandomMessageForStage(nextStage, sent)
    if (!message) continue

    result.push({ phone: row.phone, stage: nextStage, message })
  }

  return result
}

/**
 * Obtém last_message_at do contato (quando o usuário mandou a última mensagem).
 * Se last_message_at > email_requested_at, o usuário respondeu depois do pedido de e-mail → não enviar follow-up.
 */
export async function userRepliedAfterEmailRequest(phone: string, emailRequestedAt: Date): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return true
  const p = normalizarPhone(phone)
  if (p.length < 10) return true
  const { data } = await supabase
    .from('whatsapp_contatos')
    .select('last_message_at')
    .eq('phone', p)
    .maybeSingle()
  const lastAt = (data as { last_message_at?: string } | null)?.last_message_at
  if (!lastAt) return false
  return new Date(lastAt) > emailRequestedAt
}

/**
 * Registra o envio de um follow-up e atualiza etapa e mensagens enviadas.
 */
export async function recordFollowUpSent(
  phone: string,
  stage: 1 | 2 | 3 | 4 | 5,
  messageText: string
): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const { data: row } = await supabase
    .from(TABLE)
    .select('mensagens_followup_enviadas')
    .eq('phone', p)
    .maybeSingle()
  const current = Array.isArray((row as { mensagens_followup_enviadas?: string[] })?.mensagens_followup_enviadas)
    ? ((row as { mensagens_followup_enviadas: string[] }).mensagens_followup_enviadas)
    : []
  const updated = [...current, messageText]
  const now = new Date().toISOString()
  await supabase
    .from(TABLE)
    .update({
      etapa_followup: stage,
      mensagens_followup_enviadas: updated,
      status_conversa: 'follow_up',
      updated_at: now,
    })
    .eq('phone', p)
}

export interface RunLeadRecoveryResult {
  ok: boolean
  sent: number
  total: number
  errors?: string[]
  /** Preenchido quando a listagem de leads devido falha (ex.: tabela ausente, Supabase indisponível). */
  listError?: string
}

/**
 * Executa o envio dos follow-ups de recuperação (5m, 10m, 15h, 24h, 48h).
 * Deve ser chamado pelo cron (ex.: a cada 2–5 min).
 * Verifica para cada lead: ainda step=email sem email, sem cadastro; envia mensagem e registra.
 */
export async function runLeadRecoveryFollowUps(sendTextMessage: (phone: string, text: string) => Promise<{ success: boolean; error?: string }>): Promise<RunLeadRecoveryResult> {
  const { getSignupPending } = await import('@/lib/whatsapp-signup-flow')
  const { hasCadastro } = await import('@/lib/whatsapp-contatos-pendentes')

  let due: { phone: string; stage: 1 | 2 | 3 | 4 | 5; message: string }[]
  try {
    due = await listLeadsDueForFollowUp()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[lead-recovery] listLeadsDueForFollowUp falhou:', msg)
    return { ok: false, sent: 0, total: 0, listError: msg }
  }

  const errors: string[] = []
  let sent = 0

  const delayBetweenMs = () => 8000 + Math.random() * 4000
  for (let i = 0; i < due.length; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayBetweenMs()))
    }
    const { phone, stage, message } = due[i]
    const signup = await getSignupPending(phone).catch(() => null)
    if (!signup || signup.step !== 'email' || signup.email != null) continue
    if (await hasCadastro(phone).catch(() => true)) continue

    try {
      const result = await sendTextMessage(phone, message)
      if (result.success) {
        await recordFollowUpSent(phone, stage, message)
        sent += 1
      } else {
        errors.push(`${phone} etapa ${stage}: ${result.error ?? 'erro ao enviar'}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${phone} etapa ${stage}: ${msg}`)
    }
  }

  return {
    ok: true,
    sent,
    total: due.length,
    errors: errors.length ? errors : undefined,
  }
}
