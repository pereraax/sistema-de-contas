/**
 * Parser de webhook Z-API (e formatos similares).
 * Suporta texto, imagem, áudio, vídeo, documento, sticker, contato, localização.
 */

export type WebhookMessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'contact' | 'location'

export interface IncomingWebhookMessage {
  phone: string
  text: string
  fromMe: boolean
  senderName?: string
  messageId?: string
  timestamp?: string
  messageType: WebhookMessageType
  mediaUrl?: string
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '').trim()
}

function extractText(b: Record<string, unknown>): string {
  const raw = b.text ?? b.message ?? b.body
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'message' in raw) {
    return String((raw as { message?: unknown }).message ?? '')
  }
  return ''
}

/** Detecta tipo e mídia do payload Z-API (image, audio, video, document, sticker, contact, location). */
function detectTypeAndMedia(b: Record<string, unknown>): { messageType: WebhookMessageType; mediaUrl?: string; label: string } {
  const text = extractText(b)
  const obj = (key: string) => {
    const v = b[key]
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
  }
  const img = obj('image')
  if (img?.imageUrl) {
    return { messageType: 'image', mediaUrl: String(img.imageUrl), label: String(img.caption ?? '').trim() || '[Imagem]' }
  }
  const aud = obj('audio')
  if (aud?.audioUrl) {
    return { messageType: 'audio', mediaUrl: String(aud.audioUrl), label: '[Áudio]' }
  }
  const vid = obj('video')
  if (vid?.videoUrl) {
    return { messageType: 'video', mediaUrl: String(vid.videoUrl), label: String(vid.caption ?? '').trim() || '[Vídeo]' }
  }
  const doc = obj('document')
  if (doc?.documentUrl) {
    const name = [doc.fileName, doc.title].find(Boolean)
    return { messageType: 'document', mediaUrl: String(doc.documentUrl), label: name ? String(name) : '[Documento]' }
  }
  const stk = obj('sticker')
  if (stk?.stickerUrl) {
    return { messageType: 'sticker', mediaUrl: String(stk.stickerUrl), label: '[Figurinha]' }
  }
  const contact = obj('contact')
  if (contact?.displayName) {
    return { messageType: 'contact', label: `[Contato: ${String(contact.displayName)}]` }
  }
  const loc = obj('location')
  if (loc?.name || loc?.url) {
    return { messageType: 'location', label: String(loc.name ?? loc.address ?? loc.url ?? '[Localização]') }
  }
  return { messageType: 'text', label: text }
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
  if (!phone) return null
  const fromMe = Boolean(b.fromMe ?? b.from_me)
  const messageId = b.messageId ?? b.id ?? (b as any).message_id
  const ts = b.momment ?? b.timestamp ?? b.createdAt ?? b.date
  const { messageType, mediaUrl, label } = detectTypeAndMedia(b)
  const text = label.trim() || (messageType === 'text' ? extractText(b) : label)
  return {
    phone: normalizePhone(String(phone)),
    text: String(text).trim() || (mediaUrl ? '[Mídia]' : ''),
    fromMe,
    senderName: b.senderName != null ? String(b.senderName) : (b.participantName != null ? String(b.participantName) : undefined),
    messageId: messageId != null ? String(messageId) : undefined,
    timestamp: ts != null ? (typeof ts === 'number' ? new Date(ts).toISOString() : String(ts)) : undefined,
    messageType,
    mediaUrl,
  }
}
