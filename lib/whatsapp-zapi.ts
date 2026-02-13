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
  try {
    const res = await fetch(`${base}/send-text`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ phone, message }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data?.message || data?.error || `Erro ${res.status}` }
    }
    return { success: true, messageId: data.messageId || data.id }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erro ao enviar' }
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
      return { success: false, error: data?.message || data?.error || `Erro ${res.status}` }
    }
    return { success: true, messageId: data.messageId || data.id }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Erro ao enviar botões' }
  }
}
