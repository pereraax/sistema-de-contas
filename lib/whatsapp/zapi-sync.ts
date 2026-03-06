/**
 * Sincronização de conversas e mensagens da Z-API com o CRM.
 * Lista chats (GET /chats) e mensagens por chat (GET /chat-messages/{phone}).
 * Requer Z_API_INSTANCE_ID, Z_API_TOKEN e Z_API_CLIENT_TOKEN (token de segurança da conta).
 */

import { getOrCreateContactByPhoneWithFlag } from '@/lib/crm/contacts'
import { findOrCreateConversationForContact, updateConversation } from '@/lib/crm/conversations'
import { createMessage } from '@/lib/crm/messages'

const BASE = 'https://api.z-api.io'

function getConfig() {
  const instanceId = process.env.Z_API_INSTANCE_ID || process.env.ZAPI_INSTANCE_ID
  const token = process.env.Z_API_TOKEN || process.env.ZAPI_TOKEN
  const clientToken = process.env.Z_API_CLIENT_TOKEN || process.env.ZAPI_CLIENT_TOKEN
  return { instanceId, token, clientToken }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').trim()
}

export interface ZApiChat {
  phone: string
  name: string
  lastMessageTime: string
  isGroup: boolean
}

export interface SyncResult {
  ok: boolean
  error?: string
  chatsFetched?: number
  chatsSynced?: number
  messagesSynced?: number
}

/** Normaliza um item da resposta GET chat-messages para tipo + texto + media_url. */
function normalizeZApiMessage(msg: Record<string, unknown>): { messageType: string; text: string; mediaUrl?: string } {
  const getObj = (k: string) => {
    const v = msg[k]
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
  }
  const textObj = getObj('text')
  const textMsg = textObj?.message != null ? String(textObj.message) : ''
  const img = getObj('image')
  if (img?.imageUrl) {
    return { messageType: 'image', text: String(img.caption ?? '').trim() || '[Imagem]', mediaUrl: String(img.imageUrl) }
  }
  const aud = getObj('audio')
  if (aud?.audioUrl) {
    return { messageType: 'audio', text: '[Áudio]', mediaUrl: String(aud.audioUrl) }
  }
  const vid = getObj('video')
  if (vid?.videoUrl) {
    return { messageType: 'video', text: String(vid.caption ?? '').trim() || '[Vídeo]', mediaUrl: String(vid.videoUrl) }
  }
  const doc = getObj('document')
  if (doc?.documentUrl) {
    const name = [doc.fileName, doc.title].find(Boolean)
    return { messageType: 'document', text: name ? String(name) : '[Documento]', mediaUrl: String(doc.documentUrl) }
  }
  const stk = getObj('sticker')
  if (stk?.stickerUrl) {
    return { messageType: 'sticker', text: '[Figurinha]', mediaUrl: String(stk.stickerUrl) }
  }
  const contact = getObj('contact')
  if (contact?.displayName) {
    return { messageType: 'contact', text: `[Contato: ${String(contact.displayName)}]` }
  }
  return { messageType: 'text', text: textMsg }
}

/** Busca lista de chats na Z-API. */
export async function fetchZApiChats(page: number, pageSize: number): Promise<ZApiChat[]> {
  const { instanceId, token, clientToken } = getConfig()
  if (!instanceId || !token || !clientToken) return []
  const url = `${BASE}/instances/${instanceId}/token/${token}/chats?page=${page}&pageSize=${pageSize}`
  const res = await fetch(url, {
    headers: { 'Client-Token': clientToken },
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => [])
  const list = Array.isArray(data) ? data : []
  return list
    .filter((c: { isGroup?: boolean }) => !c.isGroup)
    .map((c: { phone?: string; name?: string; lastMessageTime?: string }) => ({
      phone: normalizePhone(String(c.phone ?? '')),
      name: String(c.name ?? c.phone ?? ''),
      lastMessageTime: String(c.lastMessageTime ?? '0'),
      isGroup: false,
    }))
}

/** Busca mensagens de um chat. */
export async function fetchZApiChatMessages(
  phone: string,
  amount: number,
  lastMessageId?: string
): Promise<Array<{ messageId: string; fromMe: boolean; momment: number; messageType: string; text: string; mediaUrl?: string }>> {
  const { instanceId, token, clientToken } = getConfig()
  if (!instanceId || !token || !clientToken) return []
  const num = normalizePhone(phone)
  if (!num) return []
  let url = `${BASE}/instances/${instanceId}/token/${token}/chat-messages/${num}?amount=${amount}`
  if (lastMessageId) url += `&lastMessageId=${encodeURIComponent(lastMessageId)}`
  const res = await fetch(url, { headers: { 'Client-Token': clientToken } })
  if (!res.ok) return []
  const data = await res.json().catch(() => [])
  const list = Array.isArray(data) ? data : []
  return list.map((m: Record<string, unknown>) => {
    const normalized = normalizeZApiMessage(m)
    const messageId = m.messageId != null ? String(m.messageId) : ''
    const fromMe = Boolean(m.fromMe ?? m.from_me)
    const momment = Number(m.momment ?? m.timestamp ?? 0)
    return {
      messageId,
      fromMe,
      momment,
      messageType: normalized.messageType,
      text: normalized.text,
      mediaUrl: normalized.mediaUrl,
    }
  })
}

/** Sincroniza todas as conversas do WhatsApp com o CRM (chats + mensagens recentes). */
export async function syncWhatsAppConversations(options?: {
  maxChats?: number
  messagesPerChat?: number
}): Promise<SyncResult> {
  const { instanceId, token, clientToken } = getConfig()
  if (!instanceId || !token) {
    return { ok: false, error: 'Z-API não configurada (Z_API_INSTANCE_ID, Z_API_TOKEN)' }
  }
  if (!clientToken) {
    return { ok: false, error: 'Z_API_CLIENT_TOKEN não configurado (token de segurança da conta no painel Z-API)' }
  }

  const pageSize = Math.min(options?.maxChats ?? 50, 100)
  const messagesPerChat = Math.min(options?.messagesPerChat ?? 30, 100)
  let chatsFetched = 0
  let chatsSynced = 0
  let messagesSynced = 0
  let page = 1
  const maxPages = 5

  for (let p = 0; p < maxPages; p++) {
    const chats = await fetchZApiChats(page, pageSize)
    if (chats.length === 0) break
    chatsFetched += chats.length
    for (const chat of chats) {
      if (!chat.phone) continue
      const { contact, created } = await getOrCreateContactByPhoneWithFlag(chat.phone, {
        nome: chat.name || undefined,
        origem: 'whatsapp',
      })
      if (!contact) continue
      const conversation = await findOrCreateConversationForContact(contact.id)
      if (!conversation) continue
      chatsSynced++
      const messages = await fetchZApiChatMessages(chat.phone, messagesPerChat)
      for (const msg of messages) {
        const tipo = msg.fromMe ? 'saida' : 'entrada'
        const createdMsg = await createMessage({
          contact_id: contact.id,
          conversation_id: conversation.id,
          tipo,
          mensagem: msg.text || '[Mídia]',
          origem: 'whatsapp',
          zapi_message_id: msg.messageId || undefined,
          message_type: msg.messageType,
          media_url: msg.mediaUrl,
        })
        if (createdMsg) messagesSynced++
      }
      if (messages.length > 0) {
        const last = messages[messages.length - 1]
        await updateConversation(conversation.id, {
          ultima_mensagem: last.text,
          status_conversa: 'aberta',
        })
      }
    }
    if (chats.length < pageSize) break
    page++
  }

  return {
    ok: true,
    chatsFetched,
    chatsSynced,
    messagesSynced,
  }
}
