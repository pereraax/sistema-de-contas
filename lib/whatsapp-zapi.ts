/**
 * Integração com Z-API (z-api.io) para WhatsApp com suporte a botões.
 */

export interface ZapiConfig {
  instanceId: string
  token: string
  clientToken?: string
}

function getBaseUrl(): string {
  const id = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  if (!id || !token) return ''
  return `https://api.z-api.io/instances/${id.trim()}/token/${token.trim()}`
}

export function getZapiConfig(): ZapiConfig | null {
  const instanceId = process.env.ZAPI_INSTANCE_ID?.trim()
  const token = process.env.ZAPI_TOKEN?.trim()
  if (!instanceId || !token) return null
  return {
    instanceId,
    token,
    clientToken: process.env.ZAPI_CLIENT_TOKEN?.trim(),
  }
}

export function isZapiConfigured(): boolean {
  return getZapiConfig() !== null
}

function cleanPhone(phone: string): string {
  let n = phone.replace(/\D/g, '')
  if (n.length === 10 || n.length === 11) n = '55' + n
  return n
}

function defaultHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const clientToken = process.env.ZAPI_CLIENT_TOKEN?.trim()
  if (clientToken) h['Client-Token'] = clientToken
  return h
}

/** Mensagem clara quando a Z-API exige Client-Token e não está configurado */
function normalizeZapiError(err: string | undefined): string {
  if (!err) return 'Erro ao enviar'
  const lower = err.toLowerCase()
  if (lower.includes('client-token') || lower.includes('client_token') || lower.includes('null not allowed')) {
    return 'Z-API exige Client-Token. Configure ZAPI_CLIENT_TOKEN no Railway (painel Z-API: Segurança → Token de segurança da conta).'
  }
  return err
}

/**
 * Enviar mensagem de texto.
 */
export async function sendTextMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const base = getBaseUrl()
  if (!base) return { success: false, error: 'Z-API não configurado (ZAPI_INSTANCE_ID e ZAPI_TOKEN)' }
  const phone = cleanPhone(phoneNumber)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${base}/send-text`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ phone, message }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.message || data?.error || `Erro ${res.status}`
      return { success: false, error: normalizeZapiError(msg) }
    }
    return { success: true, messageId: data.messageId || data.id }
  } catch (e: any) {
    clearTimeout(timeoutId)
    return { success: false, error: e?.name === 'AbortError' ? 'Timeout ao enviar (10s)' : (e?.message || 'Erro ao enviar') }
  }
}

/**
 * Enviar mensagem com botões de resposta (até 3).
 */
export async function sendButtonList(
  phoneNumber: string,
  message: string,
  buttons: { id: string; title: string }[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const base = getBaseUrl()
  if (!base) return { success: false, error: 'Z-API não configurado' }
  const phone = cleanPhone(phoneNumber)
  const buttonList = {
    buttons: buttons.slice(0, 3).map((b) => ({ id: b.id, label: b.title })),
  }
  try {
    const res = await fetch(`${base}/send-button-list`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ phone, message, buttonList }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.message || data?.error || `Erro ${res.status}`
      return { success: false, error: normalizeZapiError(msg) }
    }
    return { success: true, messageId: data.messageId || data.id }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erro ao enviar botões' }
  }
}

/** Ações de botão: URL (abre link), CALL (liga), REPLY (resposta). */
export type ButtonAction = { type: 'URL'; url: string; label: string; id?: string } | { type: 'CALL'; phone: string; label: string; id?: string } | { type: 'REPLY'; label: string; id?: string }

/**
 * Enviar mensagem com botões de ação (URL, CALL, REPLY).
 * Doc: https://developer.z-api.io/en/message/send-button-actions
 * Não misturar REPLY com URL/CALL na mesma mensagem (limitação do WhatsApp).
 */
export async function sendButtonActions(
  phoneNumber: string,
  message: string,
  buttonActions: ButtonAction[],
  options?: { title?: string; footer?: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const base = getBaseUrl()
  if (!base) return { success: false, error: 'Z-API não configurado' }
  const phone = cleanPhone(phoneNumber)
  const payload: Record<string, unknown> = {
    phone,
    message,
    buttonActions: buttonActions.slice(0, 3).map((b) => {
      const item: Record<string, string> = { type: b.type, label: b.label }
      if (b.id) item.id = b.id
      if (b.type === 'URL' && b.url) item.url = b.url
      if (b.type === 'CALL' && b.phone) item.phone = b.phone.replace(/\D/g, '')
      return item
    }),
  }
  if (options?.title) payload.title = options.title
  if (options?.footer) payload.footer = options.footer
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(`${base}/send-button-actions`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.message || data?.error || `Erro ${res.status}`
      return { success: false, error: normalizeZapiError(msg) }
    }
    return { success: true, messageId: data.messageId || data.id }
  } catch (e: any) {
    clearTimeout(timeoutId)
    return { success: false, error: e?.name === 'AbortError' ? 'Timeout ao enviar (10s)' : (e?.message || 'Erro ao enviar botões de ação') }
  }
}
