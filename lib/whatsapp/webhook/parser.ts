/**
 * Parser de webhook Z-API (e formatos similares).
 * Normaliza payload para { phone, text, fromMe }.
 */

export interface IncomingWebhookMessage {
  phone: string
  text: string
  fromMe: boolean
  senderName?: string
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').trim()
}

/**
 * Z-API envia no body: text, phone, fromMe, etc.
 * Documentação: https://developer.z-api.io
 */
export function parseZApiPayload(body: unknown): IncomingWebhookMessage | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const phone = b.phone ?? b.from ?? b.telefone ?? b.sender
  const text = b.text ?? b.message ?? b.body ?? ''
  const fromMe = Boolean(b.fromMe ?? b.from_me)
  if (!phone) return null
  return {
    phone: normalizePhone(String(phone)),
    text: String(text).trim(),
    fromMe,
    senderName: b.senderName != null ? String(b.senderName) : undefined,
  }
}
