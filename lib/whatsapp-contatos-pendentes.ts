/**
 * Contatos WhatsApp: gravar última mensagem e marcar quando as 3 mensagens de boas-vindas foram enviadas.
 * Usado para listar no admin quem ainda não foi respondido ("quero utilizar plenipay").
 */

import { createAdminClient } from '@/lib/supabase/server'

const TABLE = 'whatsapp_contatos'

/** Normalização única para phone (usar ao gravar e ao marcar welcome_sent). */
export function normalizarPhone(phone: string): string {
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

/** Marcar que enviamos uma resposta para este número (evita marcar como "no vácuo" no cron de revisão). */
export async function markReplySent(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase
    .from(TABLE)
    .update({ last_reply_at: now, updated_at: now })
    .eq('phone', p)
    .then(() => {})
    .catch(() => {})
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

/** Retorna true se este número já recebeu as 3 mensagens de boas-vindas (não pular contato novo). */
export async function hasReceivedWelcome(phone: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const p = normalizarPhone(phone)
  if (p.length < 10) return false
  const { data, error } = await supabase
    .from(TABLE)
    .select('welcome_sent_at')
    .eq('phone', p)
    .maybeSingle()
  if (error) return false
  return data?.welcome_sent_at != null
}

/** Retorna true se já enviamos a mensagem inicial do modo teste ("Me diga algo que você gastou hoje"). */
export async function hasReceivedTestIntro(phone: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const p = normalizarPhone(phone)
  if (p.length < 10) return false
  const { data, error } = await supabase
    .from(TABLE)
    .select('test_intro_sent_at')
    .eq('phone', p)
    .maybeSingle()
  if (error) return false
  return (data as { test_intro_sent_at?: string } | null)?.test_intro_sent_at != null
}

/** Marca que a mensagem inicial do modo teste foi enviada para este número. */
export async function markTestIntroSent(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    { phone: p, test_intro_sent_at: now, updated_at: now },
    { onConflict: 'phone', ignoreDuplicates: false }
  )
}

/** Marca que enviamos "Enviei um link para confirmar seu email" para este número (cadastro WhatsApp). */
export async function markEmailConfirmLinkSent(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    { phone: p, email_confirm_link_sent_at: now, updated_at: now },
    { onConflict: 'phone', ignoreDuplicates: false }
  ).catch(() => {})
}

const EMAIL_CONFIRM_SENT_TTL_MS = 48 * 60 * 60 * 1000 // 48h

/** Retorna true se enviamos o link de confirmação de email para este número recentemente (últimas 48h). */
export async function wasEmailConfirmLinkSentRecently(phone: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const p = normalizarPhone(phone)
  if (p.length < 10) return false
  const { data, error } = await supabase
    .from(TABLE)
    .select('email_confirm_link_sent_at')
    .eq('phone', p)
    .maybeSingle()
  if (error || !data) return false
  const sentAt = (data as { email_confirm_link_sent_at?: string } | null)?.email_confirm_link_sent_at
  if (!sentAt) return false
  const ts = new Date(sentAt).getTime()
  return Date.now() - ts < EMAIL_CONFIRM_SENT_TTL_MS
}

/** Limpa a marca de "link de confirmação enviado" para este número (após reconhecer "pronto/verifiquei"). */
export async function clearEmailConfirmLinkSent(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  await supabase.from(TABLE).update({ email_confirm_link_sent_at: null, updated_at: new Date().toISOString() }).eq('phone', p).then(() => {}).catch(() => {})
}

/** True se a mensagem parece confirmação de que o lead verificou/confirmou o email (pronto, verifiquei, cliquei no link, etc.). */
export function isConfirmacaoEmailMessage(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const t = text.toLowerCase().trim().replace(/\s+/g, ' ')
  const ok = /^(pronto|verifiquei|deu\s+certo\??|confirmei|j[aá]\s*confirmei|ok\s*verifiquei|pronto\s*verifiquei|verifiquei\s*pronto|confirmei\s*o\s*e? ?mail|verifiquei\s*o\s*e? ?mail)$/i.test(t) ||
    /pronto\s*verifiquei|verifiquei\s*pronto|deu\s+certo/i.test(t) ||
    /(eu\s+)?cliquei\s+(no\s+)?link|cliquei\s+no\s+link|j[aá]\s+cliquei|link\s+clicado/i.test(t) ||
    (t === 'pronto' || t === 'verifiquei' || t === 'deu certo' || t === 'deu certo?' || t === 'confirmei')
  return ok
}

/** Retorna true se este número já tem cadastro (conta no sistema: sessão WhatsApp vinculada a um user_id). */
export async function hasCadastro(phone: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const p = normalizarPhone(phone)
  if (p.length < 10) return false
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('user_id')
    .eq('phone_number', p)
    .maybeSingle()
  if (error) return false
  return (data as { user_id?: string } | null)?.user_id != null
}

/** Normaliza texto para detecção "quero utilizar Plenipay": remove espaços extras, pontuação e caracteres invisíveis. */
function normalizeForQueroPlenipay(text: string): string {
  return text
    .replace(/\u200B|\uFEFF|\u00AD/g, '')
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Verifica se a mensagem indica intenção de usar a Plenipay (fluxo de boas-vindas). Identifica "Olá! Quero utilizar a plenipay" e variações. */
export function isQueroUtilizarPlenipay(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const t = normalizeForQueroPlenipay(text)
  if (!t || t.length > 300) return false
  // Frase exata (com pequenas variações): "olá! quero utilizar a plenipay"
  const fraseExata =
    /^(ol[aá]\s*!?\s*)?quero\s+utilizar\s+(a\s+)?pleni\s*pay\.?$/i.test(t) ||
    /^(ol[aá]\s*!?\s*)?quero\s+usar\s+(a\s+)?pleni\s*pay\.?$/i.test(t) ||
    t === 'ola! quero utilizar a plenipay' ||
    t === 'olá! quero utilizar a plenipay' ||
    t === 'ola quero utilizar a plenipay' ||
    t === 'olá quero utilizar a plenipay'
  if (fraseExata) return true
  const temPlenipay = /pleni\s*pay|plenipay/.test(t)
  const temIntencao =
    t.includes('quero utilizar') ||
    t.includes('quero usar') ||
    /utilizar\s+(a\s+)?pleni\s*pay|usar\s+(a\s+)?pleni\s*pay/.test(t) ||
    /ol[aá]\s*,?\s*quero|ola\s*,?\s*quero/.test(t)
  return !!(temPlenipay && temIntencao)
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

/**
 * Lista números que mandaram "Olá! Quero utilizar a Plenipay." e ainda NÃO receberam a mensagem de intro (test_intro_sent_at null).
 * Usado pelo cron a cada 2 min para reenviar a intro quando o envio no webhook falhou.
 * @param maxAgeHours janela da última mensagem (default 48h)
 */
export async function listPhonesIntroNaoRespondidos(maxAgeHours: number = 48): Promise<{ phone: string }[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const since = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from(TABLE)
    .select('phone, last_message')
    .is('test_intro_sent_at', null)
    .not('last_message_at', 'is', null)
    .gte('last_message_at', since)
    .order('last_message_at', { ascending: false })
  if (error) {
    console.error('[whatsapp-contatos-pendentes] listPhonesIntroNaoRespondidos error:', error)
    return []
  }
  const rows = (data || []) as { phone: string; last_message: string | null }[]
  return rows
    .filter((r) => isQueroUtilizarPlenipay(r.last_message ?? ''))
    .map((r) => ({ phone: r.phone }))
}

/**
 * Lista números que ainda não receberam as 3 mensagens de boas-vindas, para a checagem periódica (cron).
 * Retorna apenas contatos com última mensagem nos últimos maxAgeHours (evita enviar para números muito antigos).
 * @param maxAgeHours default 168 (7 dias)
 */
export async function listPhonesPendentesParaCron(maxAgeHours: number = 168): Promise<{ phone: string }[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const since = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from(TABLE)
    .select('phone')
    .is('welcome_sent_at', null)
    .not('last_message_at', 'is', null)
    .gte('last_message_at', since)
    .order('last_message_at', { ascending: false })
  if (error) {
    console.error('[whatsapp-contatos-pendentes] listPhonesPendentesParaCron error:', error)
    return []
  }
  return (data || []).map((r) => ({ phone: r.phone as string }))
}

/**
 * Lista contatos que ficaram "no vácuo": última mensagem é do lead e não respondemos (ou respondemos antes da última mensagem).
 * Usado pelo cron de revisão a cada 2 min para responder quem não recebeu resposta.
 * @param minAgeMinutes só considera mensagens com pelo menos este tempo (ex.: 2 = não responder na hora, dar 2 min de margem)
 * @param maxAgeHours só considera mensagens dos últimos X horas (ex.: 48 = não pegar conversas antigas)
 */
export async function listContatosNoVacuo(
  minAgeMinutes: number = 2,
  maxAgeHours: number = 48
): Promise<{ phone: string; last_message: string | null }[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const since = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
  const minAgeAt = new Date(Date.now() - minAgeMinutes * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from(TABLE)
    .select('phone, last_message, last_message_at, last_reply_at')
    .not('last_message_at', 'is', null)
    .lt('last_message_at', minAgeAt)
    .gte('last_message_at', since)
    .order('last_message_at', { ascending: true })
  if (error) {
    console.error('[whatsapp-contatos-pendentes] listContatosNoVacuo error:', error)
    return []
  }
  const rows = (data || []) as { phone: string; last_message: string | null; last_message_at: string; last_reply_at: string | null }[]
  return rows
    .filter((r) => r.last_reply_at == null || new Date(r.last_message_at) > new Date(r.last_reply_at))
    .map((r) => ({ phone: r.phone, last_message: r.last_message }))
}

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

/** Preenche whatsapp_contatos (last_message, last_message_at). NÃO mexe em welcome_sent_at — quem já recebeu as 3 foi marcado pelo webhook e deve continuar fora da lista. Só novos contatos (insert) ficam com welcome_sent_at null e aparecem. */
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

/** Lista leads no fluxo de teste (receberam intro) que estão inativos há 10–50 min e ainda não têm cadastro. Para envio da mensagem estratégica de follow-up. */
export async function listLeadsInativosParaFollowUp10Min(): Promise<{ phone: string }[]> {
  const supabase = createAdminClient()
  if (!supabase) return []
  const now = new Date()
  const min10 = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
  const min50 = new Date(now.getTime() - 50 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from(TABLE)
    .select('phone, test_intro_sent_at, welcome_sent_at, lead_followup_10min_sent_at')
    .or('test_intro_sent_at.not.is.null,welcome_sent_at.not.is.null')
    .is('lead_followup_10min_sent_at', null)
    .lte('last_message_at', min10)
    .gte('last_message_at', min50)
  if (error) {
    console.error('[whatsapp-contatos-pendentes] listLeadsInativosParaFollowUp10Min error:', error)
    return []
  }
  const rows = (data || []) as { phone: string; lead_followup_10min_sent_at?: string | null }[]
  const result: { phone: string }[] = []
  for (const r of rows) {
    const p = (r.phone ?? '').trim()
    if (p.length < 10) continue
    if (await hasCadastro(p).catch(() => true)) continue
    result.push({ phone: p })
  }
  return result
}

/** Marca que enviamos a mensagem de follow-up 10min para este lead (evita reenviar). */
export async function markLeadFollowup10minSent(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase.from(TABLE).update({ lead_followup_10min_sent_at: now, updated_at: now }).eq('phone', p).then(() => {}).catch(() => {})
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

// --- Aguardando humano (várias "não entendi" seguidas → parar respostas automáticas) ---

/** Retorna o timestamp até quando este número está em "aguardando humano", ou null se não está ou já expirou. */
export async function getAguardandoHumanoAte(phone: string): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const p = normalizarPhone(phone)
  if (p.length < 10) return null
  const { data, error } = await supabase
    .from(TABLE)
    .select('aguardando_humano_ate')
    .eq('phone', p)
    .maybeSingle()
  if (error || !data) return null
  const ate = (data as { aguardando_humano_ate?: string | null }).aguardando_humano_ate
  if (!ate) return null
  if (new Date(ate) <= new Date()) {
    await clearAguardandoHumano(p)
    return null
  }
  return ate
}

/** Marca que este número está aguardando humano até now + 24h. Para de enviar respostas automáticas. */
export async function setAguardandoHumano(phone: string, horas: number = 24): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const until = new Date(Date.now() + horas * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    { phone: p, aguardando_humano_ate: until, consecutive_nao_entendi: 0, updated_at: now },
    { onConflict: 'phone', ignoreDuplicates: false }
  )
}

/** Limpa o estado "aguardando humano" e zera o contador de "não entendi". */
export async function clearAguardandoHumano(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    { phone: p, aguardando_humano_ate: null, consecutive_nao_entendi: 0, updated_at: now },
    { onConflict: 'phone', ignoreDuplicates: false }
  )
}

/** Incrementa o contador de "não entendi" e retorna o novo valor. */
export async function incrementConsecutiveNaoEntendi(phone: string): Promise<number> {
  const supabase = createAdminClient()
  if (!supabase) return 0
  const p = normalizarPhone(phone)
  if (p.length < 10) return 0
  const now = new Date().toISOString()
  const { data: row } = await supabase.from(TABLE).select('consecutive_nao_entendi').eq('phone', p).maybeSingle()
  const current = Math.max(0, Number((row as { consecutive_nao_entendi?: number } | null)?.consecutive_nao_entendi ?? 0))
  const next = current + 1
  await supabase.from(TABLE).upsert(
    { phone: p, consecutive_nao_entendi: next, updated_at: now },
    { onConflict: 'phone', ignoreDuplicates: false }
  )
  return next
}

/** Zera o contador de "não entendi" quando o assistente entendeu a mensagem. */
export async function resetConsecutiveNaoEntendi(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    { phone: p, consecutive_nao_entendi: 0, updated_at: now },
    { onConflict: 'phone', ignoreDuplicates: false }
  )
}

/** Verifica se a mensagem do usuário pede para voltar a falar com o assistente (sair do modo "aguardando humano"). */
export function isPedidoVoltarAssistente(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  const t = text.toLowerCase().trim().replace(/\s+/g, ' ')
  return (
    /voltar\s*(a\s*falar\s*com\s*)?(a\s*)?(plen|assistente)/i.test(t) ||
    /assistente\s*plen|plen\s*assistente/i.test(t) ||
    /^(plen|assistente)$/.test(t) ||
    /quero\s*falar\s*com\s*(o\s*)?(assistente|plen)/i.test(t) ||
    /chamar\s*(o\s*)?(assistente|plen)/i.test(t)
  )
}
