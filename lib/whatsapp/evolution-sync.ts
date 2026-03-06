/**
 * Sincronização Evolution API → CRM (estilo WhatsApp Web).
 * - findChats: lista todas as conversas, cria contatos/conversas.
 * - findMessages: importa histórico de mensagens por chat.
 * Evita duplicação por messageId (zapi_message_id).
 */

import { getOrCreateContactByPhoneWithFlag } from '@/lib/crm/contacts'
import { findOrCreateConversationForContact, updateConversation } from '@/lib/crm/conversations'
import { createMessage, findMessageByZapiId } from '@/lib/crm/messages'

function getEvolutionConfig() {
  const baseUrl = (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, '')
  const instance = process.env.EVOLUTION_INSTANCE
  const apikey = process.env.EVOLUTION_API_KEY
  return { baseUrl, instance, apikey }
}

function normalizePhoneFromJid(remoteJid: string): string {
  if (!remoteJid || typeof remoteJid !== 'string') return ''
  const s = remoteJid.replace(/@s\.whatsapp\.net$/i, '').replace(/@.*$/, '').replace(/\D/g, '').trim()
  return s
}

export interface EvolutionSyncResult {
  ok: boolean
  error?: string
  chatsFetched?: number
  chatsSynced?: number
  messagesSynced?: number
}

/** Chat retornado pela Evolution API findChats (estrutura comum v1/v2). */
interface EvolutionChat {
  id?: string
  remoteJid?: string
  pushName?: string
  name?: string
  updatedAt?: number
  lastMessage?: unknown
  [key: string]: unknown
}

function parseChatsResponse(data: unknown): EvolutionChat[] {
  if (Array.isArray(data)) return data as EvolutionChat[]
  if (data && typeof data === 'object' && Array.isArray((data as { chats?: unknown }).chats)) {
    return (data as { chats: EvolutionChat[] }).chats
  }
  if (data && typeof data === 'object') return [data as EvolutionChat]
  return []
}

/**
 * Busca todos os chats da instância na Evolution API.
 * v1: GET /chat/findChats/{instance}
 * v2: POST /chat/findChats/{instance}
 */
async function fetchEvolutionChats(): Promise<EvolutionChat[]> {
  const { baseUrl, instance, apikey } = getEvolutionConfig()
  if (!baseUrl || !instance || !apikey) return []

  const url = `${baseUrl}/chat/findChats/${instance}`
  const headers = { apikey, 'Content-Type': 'application/json' }

  for (const method of ['GET', 'POST'] as const) {
    try {
      const res = await fetch(url, {
        method,
        headers: method === 'POST' ? headers : { apikey },
        ...(method === 'POST' ? { body: '{}' } : {}),
      })
      if (!res.ok) {
        if (res.status === 405) continue
        const text = await res.text()
        console.error('[evolution-sync] findChats', method, res.status, text)
        continue
      }
      const data = await res.json().catch(() => null)
      const chats = parseChatsResponse(data)
      if (chats.length > 0) return chats
    } catch (e) {
      if (method === 'POST') console.error('[evolution-sync] fetchEvolutionChats:', e)
    }
  }
  return []
}

/** Uma mensagem retornada pela Evolution findMessages (estrutura comum). */
interface EvolutionMessage {
  key?: { remoteJid?: string; fromMe?: boolean; id?: string }
  message?: Record<string, unknown>
  messageTimestamp?: number
  [key: string]: unknown
}

function extractMessageText(msg: EvolutionMessage): string {
  const m = msg.message
  if (!m || typeof m !== 'object') return '[Mídia]'
  if (typeof (m as { conversation?: string }).conversation === 'string') return (m as { conversation: string }).conversation
  if (typeof (m as { extendedTextMessage?: { text?: string } }).extendedTextMessage?.text === 'string') return (m as { extendedTextMessage: { text: string } }).extendedTextMessage.text
  if (typeof (m as { imageMessage?: { caption?: string } }).imageMessage?.caption === 'string') return (m as { imageMessage: { caption: string } }).imageMessage.caption
  return '[Mídia]'
}

function extractMessageType(msg: EvolutionMessage): string {
  const m = msg.message
  if (!m || typeof m !== 'object') return 'text'
  if ((m as Record<string, unknown>).conversation) return 'text'
  if ((m as Record<string, unknown>).imageMessage) return 'image'
  if ((m as Record<string, unknown>).videoMessage) return 'video'
  if ((m as Record<string, unknown>).audioMessage) return 'audio'
  if ((m as Record<string, unknown>).documentMessage) return 'document'
  if ((m as Record<string, unknown>).stickerMessage) return 'sticker'
  return 'text'
}

/**
 * Busca mensagens de um chat na Evolution API.
 * POST /chat/findMessages/{instance} body: { where: { key: { remoteJid } } }
 */
async function fetchEvolutionMessages(remoteJid: string): Promise<EvolutionMessage[]> {
  const { baseUrl, instance, apikey } = getEvolutionConfig()
  if (!baseUrl || !instance || !apikey) return []

  const url = `${baseUrl}/chat/findMessages/${instance}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { apikey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ where: { key: { remoteJid } } }),
    })
    if (!res.ok) return []
    const data = await res.json().catch(() => null)
    if (Array.isArray(data)) return data as EvolutionMessage[]
    if (data && Array.isArray((data as { messages?: unknown[] }).messages)) return (data as { messages: EvolutionMessage[] }).messages
    return []
  } catch (e) {
    console.error('[evolution-sync] fetchEvolutionMessages:', e)
    return []
  }
}

/**
 * Sincroniza a lista de chats da Evolution com o CRM: cria/atualiza contatos e conversas.
 * Só inclui chats 1:1 (ignora grupos).
 * Se importMessages for true, importa também o histórico de mensagens (findMessages por chat).
 */
export async function evolutionSyncChats(options?: { importMessages?: boolean; maxMessagesPerChat?: number }): Promise<EvolutionSyncResult> {
  const { baseUrl, instance, apikey } = getEvolutionConfig()
  if (!baseUrl || !instance || !apikey) {
    return { ok: false, error: 'Evolution API não configurada (EVOLUTION_API_URL, EVOLUTION_INSTANCE, EVOLUTION_API_KEY)' }
  }

  const importMessages = options?.importMessages !== false
  const maxPerChat = options?.maxMessagesPerChat ?? 100

  const chats = await fetchEvolutionChats()
  let chatsSynced = 0
  let messagesSynced = 0

  for (const chat of chats) {
    const remoteJid = (chat.remoteJid ?? chat.id ?? '') as string
    if (!remoteJid || remoteJid.includes('@g.us')) continue

    const phone = normalizePhoneFromJid(remoteJid)
    if (!phone) continue

    const name = (chat.pushName ?? chat.name ?? '') as string
    const avatarUrl = (chat.profilePicUrl ?? chat.pictureUrl ?? chat.avatarUrl) as string | undefined
    const { contact } = await getOrCreateContactByPhoneWithFlag(phone, {
      nome: name || undefined,
      origem: 'whatsapp',
      avatar_url: avatarUrl || undefined,
    })
    if (!contact) continue

    const conversation = await findOrCreateConversationForContact(contact.id)
    if (!conversation) continue

    chatsSynced++
    const updatedAt = chat.updatedAt
    const ultimaInteracao =
      typeof updatedAt === 'number'
        ? new Date(updatedAt * 1000).toISOString()
        : undefined
    const lastMsg = chat.lastMessage
    let ultimaMensagem: string | undefined
    if (lastMsg && typeof lastMsg === 'object' && lastMsg !== null) {
      const msg = lastMsg as Record<string, unknown>
      if (typeof msg.message === 'string') ultimaMensagem = msg.message
      if (typeof msg.text === 'string') ultimaMensagem = msg.text
      if (msg.conversation && typeof (msg.conversation as { conversation?: string }).conversation === 'string') {
        ultimaMensagem = (msg.conversation as { conversation: string }).conversation
      }
    }
    await updateConversation(conversation.id, {
      ...(ultimaInteracao && { ultima_interacao: ultimaInteracao }),
      ...(ultimaMensagem && { ultima_mensagem: ultimaMensagem }),
    })

    if (importMessages) {
      const evoMessages = await fetchEvolutionMessages(remoteJid)
      const toImport = evoMessages.slice(-maxPerChat)
      for (const evo of toImport) {
        const key = evo.key
        const fromMe = Boolean(key?.fromMe)
        const msgId = key?.id != null ? String(key.id) : undefined
        if (!msgId) continue
        const text = extractMessageText(evo)
        const messageType = extractMessageType(evo)
        const ts = evo.messageTimestamp
        const timestamp = ts != null ? new Date(typeof ts === 'number' ? ts * 1000 : ts).toISOString() : new Date().toISOString()
        const alreadyExists = await findMessageByZapiId(msgId)
        if (!alreadyExists) {
          const created = await createMessage({
            contact_id: contact.id,
            conversation_id: conversation.id,
            tipo: fromMe ? 'saida' : 'entrada',
            mensagem: text,
            origem: 'whatsapp',
            zapi_message_id: msgId,
            message_type: messageType,
            status_envio: fromMe ? 'sent' : null,
            timestamp,
          })
          if (created) messagesSynced++
        }
      }
    }
  }

  return {
    ok: true,
    chatsFetched: chats.length,
    chatsSynced,
    messagesSynced,
  }
}

/** Alias: sincronização completa (chats + histórico) — executar ao conectar ou ao clicar em Sincronizar */
export async function syncWhatsAppData(): Promise<EvolutionSyncResult> {
  return evolutionSyncChats({ importMessages: true, maxMessagesPerChat: 100 })
}
