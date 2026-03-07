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
