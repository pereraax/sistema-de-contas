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

/**
 * Envia mensagem com botões em duas etapas para maior compatibilidade com Z-API/WhatsApp:
 * 1) Envia o texto completo como mensagem normal.
 * 2) Envia uma segunda mensagem curta com os botões (REPLY ou URL).
 * Assim o usuário sempre vê o texto e, em seguida, uma bolha com botões.
 */
export async function sendWhatsAppMessageWithButtons(
  contactId: string,
  message: string,
  botoes: Array<{ titulo: string; link?: string }>
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

  // Etapa 1: enviar o texto completo (sempre funciona)
  const textResult = await sendViaZApi(phone, message)
  if (!textResult.success) return textResult

  const urlBotoes = botoes.filter((b) => (b.link ?? '').trim().length > 0).slice(0, 3)
  const replyBotoes = botoes.filter((b) => !(b.link ?? '').trim()).slice(0, MAX_REPLY_BUTTONS_PER_MESSAGE)

  // Etapa 2: enviar botões em mensagem separada (texto curto + botões)
  const shortMessage = 'Escolha uma opção abaixo:'
  if (urlBotoes.length > 0) {
    const actions: ButtonActionZApi[] = urlBotoes.map((b) => ({
      type: 'URL',
      label: (b.titulo || 'Link').trim().slice(0, 20),
      url: (b.link ?? '').trim().startsWith('http') ? (b.link ?? '').trim() : `https://${(b.link ?? '').trim()}`,
    }))
    const r = await sendButtonActionsViaZApi(phone, shortMessage, actions)
    if (!r.success) {
      console.warn('[whatsapp/sender] botões URL não enviados:', r.error)
      return { success: true, messageId: textResult.messageId }
    }
    if (replyBotoes.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      const r2 = await sendButtonActionsViaZApi(
        phone,
        'Ou escolha:',
        replyBotoes.map((b) => ({ type: 'REPLY' as const, label: (b.titulo || '').trim().slice(0, 20) }))
      )
      if (!r2.success) console.warn('[whatsapp/sender] botões REPLY não enviados:', r2.error)
    }
    return { success: true, messageId: textResult.messageId }
  }
  if (replyBotoes.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    const r = await sendButtonActionsViaZApi(
      phone,
      shortMessage,
      replyBotoes.map((b) => ({ type: 'REPLY' as const, label: (b.titulo || '').trim().slice(0, 20) }))
    )
    if (!r.success) {
      console.warn('[whatsapp/sender] botões REPLY não enviados:', r.error)
      return { success: true, messageId: textResult.messageId }
    }
  }
  return { success: true, messageId: textResult.messageId }
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

type ButtonActionZApi = { type: 'REPLY'; label: string } | { type: 'URL'; label: string; url: string }

async function sendButtonActionsViaZApi(
  phone: string,
  message: string,
  buttonActions: ButtonActionZApi[]
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
  const payload = buttonActions.map((a, i) => {
    const id = String(i + 1)
    if (a.type === 'REPLY') {
      return { id, type: 'REPLY' as const, label: a.label.trim().slice(0, 20) }
    }
    return {
      id,
      type: 'URL' as const,
      label: a.label.trim().slice(0, 20),
      url: a.url.trim().startsWith('http') ? a.url.trim() : `https://${a.url.trim()}`,
    }
  })
  if (payload.length === 0) return { success: false, error: 'Nenhum botão' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone: num, message, buttonActions: payload }),
    })
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (res.ok) {
      const messageId =
        data?.messageId != null ? String(data.messageId) : data?.zaapId != null ? String(data.zaapId) : undefined
      return { success: true, messageId }
    }
    const errMsg =
      (data?.message as string) || (data?.error as string) || res.statusText || 'Erro Z-API'
    console.warn('[whatsapp/sender] send-button-actions falhou:', errMsg, 'status:', res.status)
    return { success: false, error: String(errMsg) }
  } catch (e: unknown) {
    const err = (e as Error)?.message ?? 'Erro de rede'
    console.warn('[whatsapp/sender] send-button-actions exceção:', err)
    return { success: false, error: err }
  }
}

async function sendButtonsViaZApi(
  phone: string,
  message: string,
  labels: string[]
): Promise<SendResult> {
  const buttonActions: ButtonActionZApi[] = labels
    .slice(0, MAX_REPLY_BUTTONS_PER_MESSAGE)
    .map((label) => ({ type: 'REPLY' as const, label: label.trim().slice(0, 20) }))
  return sendButtonActionsViaZApi(phone, message, buttonActions)
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
