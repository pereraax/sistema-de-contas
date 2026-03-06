/**
 * Parser de webhook Z-API (e formatos similares).
 * Suporta texto, extended text, imagem (caption), áudio, vídeo, documento, sticker, contato, localização.
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

/**
 * Extrai o conteúdo legível da mensagem (texto ou legenda).
 * Ordem de prioridade: conversation → extendedTextMessage.text → imageMessage.caption → videoMessage.caption → formato plano Z-API.
 * Se não houver texto, retorna "[Mídia]" para mídia ou "" para vazio.
 */
export function extractMessageContent(message: unknown): string {
  if (message == null || typeof message !== 'object') return ''
  const m = message as Record<string, unknown>

  const msg = m.message != null && typeof m.message === 'object' ? (m.message as Record<string, unknown>) : null
  if (msg) {
    if (msg.conversation != null && typeof msg.conversation === 'string') return msg.conversation.trim()
    const ext = msg.extendedTextMessage
    if (ext != null && typeof ext === 'object' && (ext as Record<string, unknown>).text != null) {
      return String((ext as Record<string, unknown>).text).trim()
    }
    const imgMsg = msg.imageMessage
    if (imgMsg != null && typeof imgMsg === 'object') {
      const cap = (imgMsg as Record<string, unknown>).caption
      return cap != null ? String(cap).trim() : '[Imagem]'
    }
    const vidMsg = msg.videoMessage
    if (vidMsg != null && typeof vidMsg === 'object') {
      const cap = (vidMsg as Record<string, unknown>).caption
      return cap != null ? String(cap).trim() : '[Vídeo]'
    }
    if (msg.audioMessage != null) return '[Áudio]'
    const docMsg = msg.documentMessage
    if (docMsg != null && typeof docMsg === 'object') {
      const d = docMsg as Record<string, unknown>
      const title = d.title ?? d.fileName
      return title != null ? String(title).trim() : '[Documento]'
    }
    if (msg.stickerMessage != null) return '[Figurinha]'
    if (msg.contactMessage != null) return '[Contato]'
    if (msg.locationMessage != null) return '[Localização]'
  }

  const raw = m.text ?? m.body
  if (typeof raw === 'string') return raw === '[object Object]' ? '' : raw.trim()
  if (raw && typeof raw === 'object' && 'message' in raw) {
    return String((raw as { message?: unknown }).message ?? '').trim()
  }
  const obj = (key: string) => {
    const v = m[key]
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
  }
  const img = obj('image')
  if (img?.imageUrl) {
    const cap = img.caption
    return cap != null ? String(cap).trim() : '[Imagem]'
  }
  if (obj('audio')?.audioUrl) return '[Áudio]'
  const vid = obj('video')
  if (vid?.videoUrl) {
    const cap = vid.caption
    return cap != null ? String(cap).trim() : '[Vídeo]'
  }
  const doc = obj('document')
  if (doc?.documentUrl) {
    const name = doc.fileName ?? doc.title
    return name != null ? String(name).trim() : '[Documento]'
  }
  if (obj('sticker')?.stickerUrl) return '[Figurinha]'
  const contact = obj('contact')
  if (contact?.displayName) return `[Contato: ${String(contact.displayName)}]`
  const loc = obj('location')
  if (loc?.name || loc?.url) return String(loc.name ?? loc.address ?? loc.url ?? '[Localização]').trim()
  return ''
}

function extractTextLegacy(b: Record<string, unknown>): string {
  const raw = b.text ?? b.message ?? b.body
  if (typeof raw === 'string') return raw === '[object Object]' ? '' : raw
  if (raw && typeof raw === 'object' && 'message' in raw) {
    return String((raw as { message?: unknown }).message ?? '')
  }
  return ''
}

/** Detecta tipo e mídia do payload Z-API (image, audio, video, document, sticker, contact, location). */
function detectTypeAndMedia(b: Record<string, unknown>): { messageType: WebhookMessageType; mediaUrl?: string; label: string } {
  const obj = (key: string) => {
    const v = b[key]
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
  }
  const img = obj('image')
  if (img?.imageUrl) {
    const caption = img.caption != null ? String(img.caption).trim() : ''
    return { messageType: 'image', mediaUrl: String(img.imageUrl), label: caption || '[Imagem]' }
  }
  const aud = obj('audio')
  if (aud?.audioUrl) {
    return { messageType: 'audio', mediaUrl: String(aud.audioUrl), label: '[Áudio]' }
  }
  const vid = obj('video')
  if (vid?.videoUrl) {
    const caption = vid.caption != null ? String(vid.caption).trim() : ''
    return { messageType: 'video', mediaUrl: String(vid.videoUrl), label: caption || '[Vídeo]' }
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
  const text = extractMessageContent(b) || extractTextLegacy(b)
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
  const content = extractMessageContent(b)
  const text = content.trim() || label.trim() || (mediaUrl ? '[Mídia]' : '')
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

/**
 * Payload Evolution API: { event, instance?, data: { key: { remoteJid, fromMe, id }, message?, pushName?, messageTimestamp? } }.
 * Eventos: MESSAGES_UPSERT, messages.upsert.
 */
function detectEvolutionTypeAndMedia(data: Record<string, unknown>): { messageType: WebhookMessageType; mediaUrl?: string; label: string } {
  const msg = data.message != null && typeof data.message === 'object' ? (data.message as Record<string, unknown>) : null
  if (!msg) return { messageType: 'text', label: '' }
  if (msg.conversation != null && typeof msg.conversation === 'string') return { messageType: 'text', label: String(msg.conversation).trim() }
  const ext = msg.extendedTextMessage
  if (ext != null && typeof ext === 'object' && (ext as Record<string, unknown>).text != null) {
    return { messageType: 'text', label: String((ext as Record<string, unknown>).text).trim() }
  }
  const img = msg.imageMessage
  if (img != null && typeof img === 'object') {
    const o = img as Record<string, unknown>
    const url = o.url ?? o.directPath
    const cap = o.caption
    return { messageType: 'image', mediaUrl: url != null ? String(url) : undefined, label: cap != null ? String(cap).trim() : '[Imagem]' }
  }
  const vid = msg.videoMessage
  if (vid != null && typeof vid === 'object') {
    const o = vid as Record<string, unknown>
    const cap = o.caption
    return { messageType: 'video', mediaUrl: o.url != null ? String(o.url) : undefined, label: cap != null ? String(cap).trim() : '[Vídeo]' }
  }
  if (msg.audioMessage != null) return { messageType: 'audio', label: '[Áudio]' }
  const doc = msg.documentMessage
  if (doc != null && typeof doc === 'object') {
    const o = doc as Record<string, unknown>
    const title = o.title ?? o.fileName
    return { messageType: 'document', label: title != null ? String(title).trim() : '[Documento]' }
  }
  if (msg.stickerMessage != null) return { messageType: 'sticker', label: '[Figurinha]' }
  if (msg.contactMessage != null) return { messageType: 'contact', label: '[Contato]' }
  if (msg.locationMessage != null) return { messageType: 'location', label: '[Localização]' }
  return { messageType: 'text', label: extractMessageContent(data) }
}

export function parseEvolutionPayload(body: unknown): IncomingWebhookMessage | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const event = (b.event ?? b.type ?? '') as string
  const isUpsert = /messages\.?upsert|MESSAGES_UPSERT/i.test(event)
  if (!isUpsert) return null
  const data = (b.data != null && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
  const key = data.key != null && typeof data.key === 'object' ? (data.key as Record<string, unknown>) : null
  if (!key) return null
  let remoteJid = key.remoteJid ?? key.remotejid
  if (remoteJid == null || typeof remoteJid !== 'string') return null
  if (remoteJid.endsWith('@g.us')) return null
  const phone = remoteJid.replace('@s.whatsapp.net', '').trim()
  if (!phone) return null
  const fromMe = Boolean(key.fromMe ?? key.from_me)
  const messageId = key.id != null ? String(key.id) : undefined
  const ts = data.messageTimestamp
  const timestamp = ts != null ? (typeof ts === 'number' ? new Date(ts * 1000).toISOString() : String(ts)) : undefined
  const { messageType, mediaUrl, label } = detectEvolutionTypeAndMedia(data)
  const content = extractMessageContent(data)
  const text = content.trim() || label.trim() || (messageType !== 'text' ? label : '') || (mediaUrl ? '[Mídia]' : '')
  return {
    phone: normalizePhone(phone),
    text: String(text).trim() || (mediaUrl || messageType !== 'text' ? (label || '[Mídia]') : ''),
    fromMe,
    senderName: data.pushName != null ? String(data.pushName) : undefined,
    messageId,
    timestamp,
    messageType,
    mediaUrl,
  }
}

/** Detecta o tipo de evento do webhook Evolution (MESSAGES_UPSERT, messages.update, etc.). */
export function getEvolutionEventType(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const event = String((body as Record<string, unknown>).event ?? (body as Record<string, unknown>).type ?? '')
  return event || null
}

/** Payload messages.update: atualização de status (sent, delivered, read). */
export function parseEvolutionMessageUpdate(body: unknown): { messageId: string; status: 'sent' | 'delivered' | 'read' } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const event = String(b.event ?? b.type ?? '')
  if (!/messages\.?update|MESSAGES_UPDATE/i.test(event)) return null
  const data = (b.data != null && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
  const key = data.key ?? data.keyId
  const keyObj = key != null && typeof key === 'object' ? (key as Record<string, unknown>) : data
  const id = keyObj?.id ?? keyObj?.messageId ?? data.update?.key?.id
  const rawStatus = (data.status ?? data.update?.status ?? keyObj?.status) as string | undefined
  if (id == null || typeof id !== 'string') return null
  let status: 'sent' | 'delivered' | 'read' | null = null
  if (rawStatus) {
    const s = String(rawStatus).toLowerCase()
    if (s === 'read' || s === 'READ') status = 'read'
    else if (s === 'delivered' || s === 'DELIVERED' || s === 'delivery') status = 'delivered'
    else if (s === 'sent' || s === 'SENT' || s === 'pending') status = 'sent'
  }
  if (!status) status = 'sent'
  return { messageId: String(id), status }
}

/** Payload presence.update: online, typing, lastSeen. */
export function parseEvolutionPresenceUpdate(body: unknown): { phone: string; presence: string; lastSeen?: string } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const event = String(b.event ?? b.type ?? '')
  if (!/presence\.?update|PRESENCE_UPDATE/i.test(event)) return null
  const data = (b.data != null && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
  const id = data.id ?? data.remoteJid ?? data.remotejid ?? data.jid
  const remoteJid = typeof id === 'string' ? id : (id != null && typeof id === 'object' && typeof (id as Record<string, unknown>).remoteJid === 'string' ? (id as { remoteJid: string }).remoteJid : null)
  if (!remoteJid || remoteJid.endsWith('@g.us')) return null
  const phone = normalizePhone(remoteJid.replace('@s.whatsapp.net', '').trim())
  if (!phone) return null
  const presence = String(data.presence ?? data.lastKnownPresence ?? 'unavailable').toLowerCase()
  const lastSeenRaw = data.lastSeen ?? data.last_seen
  const lastSeen = lastSeenRaw != null ? (typeof lastSeenRaw === 'number' ? new Date(lastSeenRaw * 1000).toISOString() : String(lastSeenRaw)) : undefined
  return { phone, presence, lastSeen }
}

/** Payload contacts.update: nome e foto do contato. */
export function parseEvolutionContactsUpdate(body: unknown): { phone: string; name?: string; profilePicUrl?: string } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const event = String(b.event ?? b.type ?? '')
  if (!/contacts\.?update|CONTACTS_UPDATE/i.test(event)) return null
  const data = (b.data != null && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
  const id = data.id ?? data.jid ?? data.remoteJid
  const jid = typeof id === 'string' ? id : (id != null && typeof id === 'object' && typeof (id as Record<string, unknown>).id === 'string' ? (id as { id: string }).id : null)
  if (!jid || jid.endsWith('@g.us')) return null
  const phone = normalizePhone(jid.replace('@s.whatsapp.net', '').trim())
  if (!phone) return null
  const name = data.pushName ?? data.name ?? data.notifyName
  const profilePicUrl = data.profilePictureUrl ?? data.profilePicUrl ?? data.pictureUrl
  return {
    phone,
    name: name != null ? String(name) : undefined,
    profilePicUrl: profilePicUrl != null ? String(profilePicUrl) : undefined,
  }
}
