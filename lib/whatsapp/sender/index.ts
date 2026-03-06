/**
 * WhatsApp — Envio (Z-API ou API Fácil)
 * Usado pelo CRM para envio manual; não envia em massa.
 */

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

function normalizePhone(phone: string): string {
  let n = phone.replace(/\D/g, '').trim()
  if (n.length === 10 || n.length === 11) n = '55' + n
  return n
}

/**
 * Envia mensagem via Z-API.
 * Variáveis: Z_API_INSTANCE_ID, Z_API_TOKEN
 */
async function sendViaZApi(phone: string, message: string): Promise<SendResult> {
  const instanceId = process.env.Z_API_INSTANCE_ID
  const token = process.env.Z_API_TOKEN
  if (!instanceId || !token) {
    return { success: false, error: 'Z-API não configurada (Z_API_INSTANCE_ID, Z_API_TOKEN)' }
  }
  const num = normalizePhone(phone)
  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: num, message }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: (data as any)?.message || res.statusText || 'Erro Z-API' }
    }
    return { success: true, messageId: (data as any)?.messageId }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Erro de rede' }
  }
}

/**
 * Envia mensagem de texto para um contato (por contact_id UUID).
 * O telefone é obtido do CRM. Usa Z-API (Z_API_INSTANCE_ID + Z_API_TOKEN).
 */
export async function sendWhatsAppMessage(
  contactId: string,
  message: string
): Promise<boolean> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabase = createAdminClient()
  if (!supabase) return false
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('telefone')
    .eq('id', contactId)
    .single()
  if (!contact?.telefone) return false
  const result = await sendViaZApi(contact.telefone, message)
  return result.success
}

/**
 * Envia mensagem por número de telefone (usado pelo webhook ao responder).
 */
export async function sendWhatsAppMessageByPhone(
  phone: string,
  message: string
): Promise<SendResult> {
  return sendViaZApi(phone, message)
}
