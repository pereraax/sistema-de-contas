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
/** Extrai texto de resposta de botão. Z-API: message ou selectedButtonText; fallback buttonId (índice). */
function getFromBr(br: Record<string, unknown>): string {
  const t =
    br.selectedButtonText ?? // preferência para texto exato do botão
    br.message ?? // Z-API: buttonsResponseMessage.message
    br.text ??
    (typeof br.selectedButtonId === 'string' ? br.selectedButtonId : null) ??
    (typeof br.buttonId === 'string' ? br.buttonId : null) ??
    (br.buttonId != null && typeof br.buttonId === 'number' ? String(br.buttonId) : null)
  return t != null && typeof t === 'string' ? t.trim() : ''
}

/** Extrai opção escolhida em lista (Z-API listResponseMessage). Retorna title ou selectedRowId para o fluxo. */
function getFromListResponse(lr: Record<string, unknown>): string {
  const title = lr.title
  if (title != null && typeof title === 'string' && title.trim()) return title.trim()
  const id = lr.selectedRowId
  if (id != null && typeof id === 'string') return id.trim()
  const msg = lr.message
  return msg != null && typeof msg === 'string' ? msg.trim() : ''
}

function extractButtonResponseText(m: Record<string, unknown>): string {
  const msgData = m.messageData ?? m.data
  if (msgData != null && typeof msgData === 'object') {
    const md = msgData as Record<string, unknown>
    const br = md.buttonsResponseMessage ?? md.buttonResponseMessage
    if (br != null && typeof br === 'object') {
      const t = getFromBr(br as Record<string, unknown>)
      if (t) return t
    }
    const lr = md.listResponseMessage
    if (lr != null && typeof lr === 'object') {
      const t = getFromListResponse(lr as Record<string, unknown>)
      if (t) return t
    }
  }
  const br = m.buttonsResponseMessage ?? m.buttonResponseMessage
  if (br != null && typeof br === 'object') {
    const t = getFromBr(br as Record<string, unknown>)
    if (t) return t
  }
  const lr = m.listResponseMessage
  if (lr != null && typeof lr === 'object') {
    const t = getFromListResponse(lr as Record<string, unknown>)
    if (t) return t
  }
  return ''
}

/** Busca recursiva no payload por buttonsResponseMessage ou listResponseMessage (Z-API pode aninhar). */
export function extractButtonTextDeep(payload: unknown): string {
  if (payload == null) return ''
  if (typeof payload === 'string') return ''
  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      const t = extractButtonTextDeep(payload[i])
      if (t) return t
    }
    return ''
  }
  if (typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const br = o.buttonsResponseMessage ?? o.buttonResponseMessage
    if (br != null && typeof br === 'object') {
      const t = getFromBr(br as Record<string, unknown>)
      if (t) return t
    }
    const lr = o.listResponseMessage
    if (lr != null && typeof lr === 'object') {
      const t = getFromListResponse(lr as Record<string, unknown>)
      if (t) return t
    }
    for (const key of Object.keys(o)) {
      const t = extractButtonTextDeep(o[key])
      if (t) return t
    }
  }
  return ''
}

export function extractMessageContent(message: unknown): string {
  if (message == null || typeof message !== 'object') return ''
  const m = message as Record<string, unknown>

  const buttonText = extractButtonResponseText(m)
  if (buttonText) return buttonText

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
  if (!phone && b.senderData && typeof b.senderData === 'object') {
    const sd = b.senderData as Record<string, unknown>
    phone = sd.chatId ?? sd.sender ?? sd.participant
  }
  if (phone && typeof phone === 'string') {
    phone = phone.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '').trim()
  }
  if (!phone) return null
  const fromMe = Boolean(b.fromMe ?? b.from_me)
  const messageId = b.messageId ?? b.idMessage ?? b.id ?? (b as any).message_id
  const ts = b.momment ?? b.timestamp ?? b.createdAt ?? b.date
  const { messageType, mediaUrl, label } = detectTypeAndMedia(b)
  let content = extractMessageContent(b)
  if (!content.trim() && body != null) {
    const root = body as Record<string, unknown>
    content = extractButtonResponseText(root)
    if (!content.trim() && root.data && typeof root.data === 'object') content = extractButtonResponseText(root.data as Record<string, unknown>)
    if (!content.trim()) content = extractButtonTextDeep(body)
  }
  const text = content.trim() || label.trim() || (mediaUrl ? '[Mídia]' : '')
  return {
    phone: normalizePhone(String(phone)),
    text: String(text).trim() || (mediaUrl ? '[Mídia]' : ''),
    fromMe,
    senderName:
      b.senderName != null
        ? String(b.senderName)
        : (b.senderData && typeof b.senderData === 'object' && (b.senderData as Record<string, unknown>).senderName != null
            ? String((b.senderData as Record<string, unknown>).senderName)
            : b.participantName != null
              ? String(b.participantName)
              : undefined),
    messageId: messageId != null ? String(messageId) : undefined,
    timestamp: ts != null ? (typeof ts === 'number' ? new Date(ts).toISOString() : String(ts)) : undefined,
    messageType,
    mediaUrl,
  }
}

