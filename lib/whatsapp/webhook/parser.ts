/**
 * Parser de webhook Z-API (e formatos similares).
 * Normaliza payload para { phone, text, fromMe }.
 */

export interface IncomingWebhookMessage {
  phone: string
  text: string
  fromMe: boolean
  senderName?: string
  messageId?: string
  timestamp?: string
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').trim()
}

/**
 * Z-API envia no body: phone, text.message (objeto!), fromMe, etc.
 * Documentação: https://developer.z-api.io/webhooks/on-message-received
 */
function extractText(b: Record<string, unknown>): string {
  const raw = b.text ?? b.message ?? b.body
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'message' in raw) {
    return String((raw as { message?: unknown }).message ?? '')
  }
  return ''
}

export function parseZApiPayload(body: unknown): IncomingWebhookMessage | null {
  if (!body || typeof body !== 'object') return null
  let b = body as Record<string, unknown>
  if (b.data && typeof b.data === 'object') b = b.data as Record<string, unknown>
  if (b.payload && typeof b.payload === 'object') b = b.payload as Record<string, unknown>
  let phone = b.phone ?? b.from ?? b.telefone ?? b.sender ?? b.participant
  if (phone && typeof phone === 'string' && phone.includes('@s.whatsapp.net')) {
    phone = phone.replace('@s.whatsapp.net', '').trim()
  }
  const text = extractText(b)
  const fromMe = Boolean(b.fromMe ?? b.from_me)
  if (!phone) return null
  const messageId = b.messageId ?? b.id ?? (b as any).message_id
  const ts = b.momment ?? b.timestamp ?? b.createdAt ?? b.date
  return {
    phone: normalizePhone(String(phone)),
    text: String(text).trim(),
    fromMe,
    senderName: b.senderName != null ? String(b.senderName) : (b.participantName != null ? String(b.participantName) : undefined),
    messageId: messageId != null ? String(messageId) : undefined,
    timestamp: ts != null ? (typeof ts === 'number' ? new Date(ts).toISOString() : String(ts)) : undefined,
  }
}
