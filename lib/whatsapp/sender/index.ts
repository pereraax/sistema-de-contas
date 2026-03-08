/**
 * WhatsApp — Envio via Z-API.
 * Usado pelo CRM e pela assistente PLEN. Configure ZAPI_INSTANCE_ID, ZAPI_TOKEN e (se exigido) ZAPI_CLIENT_TOKEN.
 */

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

function normalizePhone(phone: string): string {
  let n = phone.replace(/\D/g, '').trim()
  if (n.includes('@')) n = n.replace(/@s\.whatsapp\.net$/i, '').trim()
  if (n.length === 10 || n.length === 11) n = '55' + n
  return n
}

const ZAPI_BASE = 'https://api.z-api.io'

/**
 * Envia mensagem de texto via Z-API.
 * Variáveis: ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN (opcional)
 * Endpoint: POST https://api.z-api.io/instances/{instance}/token/{token}/send-text
 */
async function sendViaZApi(phone: string, message: string): Promise<SendResult> {
  const instanceId = process.env.ZAPI_INSTANCE_ID ?? process.env.Z_API_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN ?? process.env.Z_API_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN ?? process.env.Z_API_CLIENT_TOKEN

  if (!instanceId || !token) {
    return {
      success: false,
      error: 'Z-API não configurada (ZAPI_INSTANCE_ID e ZAPI_TOKEN obrigatórios)',
    }
  }

  const num = normalizePhone(phone)
  const url = `${ZAPI_BASE}/instances/${instanceId}/token/${token}/send-text`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (clientToken) headers['Client-Token'] = clientToken

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: num,
        message,
      }),
    })

    const data = await res.json().catch(() => ({})) as Record<string, unknown>

    if (res.ok) {
      const messageId =
        data?.messageId != null ? String(data.messageId) : data?.zaapId != null ? String(data.zaapId) : undefined
      return { success: true, messageId }
    }

    const errMsg =
      (data?.message as string) ||
      (data?.error as string) ||
      (data?.message as string) ||
      res.statusText ||
      'Erro Z-API'
    return { success: false, error: String(errMsg) }
  } catch (e: unknown) {
    const err = e as Error
    return { success: false, error: err?.message ?? 'Erro de rede' }
  }
}

/**
 * Envia mensagem de texto para um contato (por contact_id UUID).
 * Retorna resultado com messageId para gravar no CRM.
 */
export async function sendWhatsAppMessageWithResult(
  contactId: string,
  message: string
): Promise<SendResult> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  if (!supabase) return { success: false, error: 'Supabase indisponível' }
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('telefone, jid')
    .eq('id', contactId)
    .single()
  if (!contact?.telefone) return { success: false, error: 'Contato sem telefone' }
  const phone = (contact as { jid?: string | null }).jid?.trim()?.replace('@s.whatsapp.net', '') || (contact as { telefone: string }).telefone
  return sendViaZApi(phone, message)
}

/** @deprecated Use sendWhatsAppMessageWithResult para obter messageId e gravar no CRM. */
export async function sendWhatsAppMessage(contactId: string, message: string): Promise<boolean> {
  const result = await sendWhatsAppMessageWithResult(contactId, message)
  return result.success
}

/**
 * Envia mensagem por número de telefone (usado pelo webhook ao responder).
 */
export async function sendWhatsAppMessageByPhone(phone: string, message: string): Promise<SendResult> {
  return sendViaZApi(phone, message)
}

/**
 * Envia mensagem com botão de resposta (REPLY) via Z-API.
 * Quando o usuário clica, o WhatsApp envia o texto do label como mensagem.
 */
export async function sendWhatsAppButtonReply(
  contactId: string,
  message: string,
  buttonLabel: string
): Promise<SendResult> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  if (!supabase) return { success: false, error: 'Supabase indisponível' }
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('telefone, jid')
    .eq('id', contactId)
    .single()
  if (!contact?.telefone) return { success: false, error: 'Contato sem telefone' }
  const phone =
    (contact as { jid?: string | null }).jid?.trim()?.replace('@s.whatsapp.net', '') ||
    (contact as { telefone: string }).telefone
  return sendButtonReplyViaZApi(phone, message, buttonLabel)
}

const MAX_REPLY_BUTTONS_PER_MESSAGE = 3

async function sendButtonReplyViaZApi(
  phone: string,
  message: string,
  buttonLabel: string
): Promise<SendResult> {
  return sendButtonsViaZApi(phone, message, [buttonLabel])
}

async function sendButtonsViaZApi(
  phone: string,
  message: string,
  labels: string[]
): Promise<SendResult> {
  const instanceId = process.env.ZAPI_INSTANCE_ID ?? process.env.Z_API_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN ?? process.env.Z_API_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN ?? process.env.Z_API_CLIENT_TOKEN
  if (!instanceId || !token) {
    return { success: false, error: 'Z-API não configurada' }
  }
  const num = normalizePhone(phone)
  const url = `${ZAPI_BASE}/instances/${instanceId}/token/${token}/send-button-actions`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (clientToken) headers['Client-Token'] = clientToken
  const buttonActions = labels
    .slice(0, MAX_REPLY_BUTTONS_PER_MESSAGE)
    .map((label) => ({ type: 'REPLY' as const, label: label.trim().slice(0, 20) }))
  if (buttonActions.length === 0) {
    return { success: false, error: 'Nenhum botão' }
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: num,
        message,
        buttonActions,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (res.ok) {
      const messageId =
        data?.messageId != null ? String(data.messageId) : data?.zaapId != null ? String(data.zaapId) : undefined
      return { success: true, messageId }
    }
    const errMsg =
      (data?.message as string) || (data?.error as string) || res.statusText || 'Erro Z-API'
    return { success: false, error: String(errMsg) }
  } catch (e: unknown) {
    return { success: false, error: (e as Error)?.message ?? 'Erro de rede' }
  }
}

/**
 * Envia menu em uma única mensagem com lista interativa (Z-API send-option-list).
 * O lead toca no botão e escolhe uma opção na lista. options: array de { id, title } (id usado no webhook).
 */
async function sendOptionListViaZApi(
  phone: string,
  message: string,
  options: { id: string; title: string; description?: string }[]
): Promise<SendResult> {
  const instanceId = process.env.ZAPI_INSTANCE_ID ?? process.env.Z_API_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN ?? process.env.Z_API_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN ?? process.env.Z_API_CLIENT_TOKEN
  if (!instanceId || !token) return { success: false, error: 'Z-API não configurada' }
  const num = normalizePhone(phone)
  const url = `${ZAPI_BASE}/instances/${instanceId}/token/${token}/send-option-list`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (clientToken) headers['Client-Token'] = clientToken
  const optionList = {
    title: 'Opções',
    buttonLabel: 'Ver opções',
    options: options.map((o) => ({
      id: String(o.id),
      title: (o.title || '').trim().slice(0, 24),
      description: (o.description ?? o.title ?? '').trim().slice(0, 72),
    })),
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: num, message, optionList }),
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (res.ok) {
      const messageId =
        data?.messageId != null ? String(data.messageId) : data?.zaapId != null ? String(data.zaapId) : undefined
      return { success: true, messageId }
    }
    const errMsg = (data?.message as string) || (data?.error as string) || res.statusText || 'Erro Z-API'
    return { success: false, error: String(errMsg) }
  } catch (e: unknown) {
    return { success: false, error: (e as Error)?.message ?? 'Erro de rede' }
  }
}

/**
 * Envia menu em uma única mensagem (lista interativa).
 * introMessage: texto amigável (ex.: "Você pode enviar MENU a qualquer momento... Toque abaixo para escolher.").
 * buttonLabels: textos das opções na ordem (serão usados como title; id será 1, 2, 3...).
 */
export async function sendWhatsAppMenuAsList(
  contactId: string,
  introMessage: string,
  buttonLabels: string[]
): Promise<SendResult> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  if (!supabase) return { success: false, error: 'Supabase indisponível' }
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('telefone, jid')
    .eq('id', contactId)
    .single()
  if (!contact?.telefone) return { success: false, error: 'Contato sem telefone' }
  const phone =
    (contact as { jid?: string | null }).jid?.trim()?.replace('@s.whatsapp.net', '') ||
    (contact as { telefone: string }).telefone
  const labels = buttonLabels.map((l) => (l || '').trim().replace(/^\d+\s*/, '')).filter(Boolean)
  if (labels.length === 0) return { success: false, error: 'Nenhuma opção' }
  const options = labels.map((title, i) => ({ id: String(i + 1), title, description: title }))
  return sendOptionListViaZApi(phone, introMessage, options)
}

/**
 * Envia menu com até 6 opções como botões (2 mensagens de até 3 botões cada).
 * Usado como fallback se lista interativa falhar.
 */
export async function sendWhatsAppMenuButtons(
  contactId: string,
  introMessage: string,
  buttonLabels: string[]
): Promise<SendResult> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  if (!supabase) return { success: false, error: 'Supabase indisponível' }
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('telefone, jid')
    .eq('id', contactId)
    .single()
  if (!contact?.telefone) return { success: false, error: 'Contato sem telefone' }
  const phone =
    (contact as { jid?: string | null }).jid?.trim()?.replace('@s.whatsapp.net', '') ||
    (contact as { telefone: string }).telefone
  const labels = buttonLabels.map((l) => (l || '').trim().replace(/^\d+\s*/, '')).filter(Boolean)
  const first = labels.slice(0, MAX_REPLY_BUTTONS_PER_MESSAGE)
  const result1 = await sendButtonsViaZApi(phone, introMessage, first)
  if (!result1.success) return result1
  const second = labels.slice(MAX_REPLY_BUTTONS_PER_MESSAGE, 6)
  if (second.length > 0) {
    const result2 = await sendButtonsViaZApi(phone, 'Ou escolha:', second)
    return result2
  }
  return result1
}
