import { NextResponse } from 'next/server'
import {
  getEvolutionEventType,
  parseEvolutionPayload,
  parseEvolutionMessageUpdate,
  parseEvolutionPresenceUpdate,
  parseEvolutionContactsUpdate,
} from '@/lib/whatsapp/webhook/parser'
import { getOrCreateContactByPhoneWithFlag, findContactByPhone, updateContact, updateContactPresence } from '@/lib/crm/contacts'
import { findOrCreateConversationForContact, updateConversation, incrementConversationUnread } from '@/lib/crm/conversations'
import { createMessage, updateMessageStatusByExternalId } from '@/lib/crm/messages'
import { logInteraction } from '@/lib/crm/interaction-logs'
import { logWebhookEvent } from '@/lib/crm/webhook-logger'
import { touchContactLastInteraction } from '@/lib/crm/contacts'

const PAYLOAD_PREVIEW_MAX = 200

/**
 * Webhook Evolution API: messages.upsert, messages.update, presence.update, contacts.update.
 * URL: https://SEU_DOMINIO/api/webhooks/evolution
 */
export async function POST(request: Request) {
  let body: unknown = null
  try {
    body = await request.json().catch(() => null)
    const payloadPreview = body ? JSON.stringify(body).slice(0, PAYLOAD_PREVIEW_MAX) : null
    const safeLog = (p: { status: 'success' | 'ignored' | 'error'; detail?: string | null; contact_id?: string | null; payload_preview?: string | null }) =>
      logWebhookEvent(p).catch(() => {})

    const event = getEvolutionEventType(body)

    // messages.update → status da mensagem (sent, delivered, read)
    if (event && /messages\.?update|MESSAGES_UPDATE/i.test(event)) {
      const parsed = parseEvolutionMessageUpdate(body)
      if (parsed) {
        await updateMessageStatusByExternalId(parsed.messageId, parsed.status)
      }
      return NextResponse.json({ ok: true })
    }

    // presence.update → online, digitando, last seen
    if (event && /presence\.?update|PRESENCE_UPDATE/i.test(event)) {
      const parsed = parseEvolutionPresenceUpdate(body)
      if (parsed) {
        const contact = await findContactByPhone(parsed.phone)
        if (contact) {
          const isOnline = parsed.presence === 'available' || parsed.presence === 'composing' || parsed.presence === 'recording'
          const typingUntil = parsed.presence === 'composing' || parsed.presence === 'recording'
            ? new Date(Date.now() + 15_000).toISOString()
            : null
          await updateContactPresence(contact.id, {
            is_online: isOnline,
            last_seen_at: parsed.lastSeen ?? null,
            typing_until: typingUntil,
          })
        }
      }
      return NextResponse.json({ ok: true })
    }

    // contacts.update → nome e foto
    if (event && /contacts\.?update|CONTACTS_UPDATE/i.test(event)) {
      const parsed = parseEvolutionContactsUpdate(body)
      if (parsed) {
        const contact = await findContactByPhone(parsed.phone)
        if (contact) {
          const updates: Parameters<typeof updateContact>[1] = {}
          if (parsed.name) updates.nome = parsed.name
          if (parsed.profilePicUrl) updates.avatar_url = parsed.profilePicUrl
          if (Object.keys(updates).length) await updateContact(contact.id, updates)
        }
      }
      return NextResponse.json({ ok: true })
    }

    // messages.upsert → nova mensagem (fluxo existente)
    const parsed = parseEvolutionPayload(body)
    if (!parsed) {
      await safeLog({ status: 'ignored', detail: 'Payload não é MESSAGES_UPSERT ou inválido', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true })
    }

    if (parsed.messageType === 'text' && !parsed.text) {
      await safeLog({ status: 'ignored', detail: 'empty text', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true })
    }

    const { contact, created } = await getOrCreateContactByPhoneWithFlag(parsed.phone, {
      nome: parsed.senderName,
      origem: 'whatsapp',
    })
    if (!contact) {
      await safeLog({ status: 'error', detail: 'Falha ao criar contato', payload_preview: payloadPreview })
      return NextResponse.json({ ok: false, error: 'Contato' }, { status: 500 })
    }

    if (created) {
      await logInteraction({
        contact_id: contact.id,
        evento: 'novo_lead',
        detalhes: { origem: 'whatsapp', telefone: contact.telefone },
      })
    }

    const conversation = await findOrCreateConversationForContact(contact.id)
    if (!conversation) {
      return NextResponse.json({ ok: false, error: 'Conversa' }, { status: 500 })
    }

    const tipo = parsed.fromMe ? 'saida' : 'entrada'
    const mensagemTexto = parsed.text || (parsed.mediaUrl ? '[Mídia]' : '')
    const msg = await createMessage({
      contact_id: contact.id,
      conversation_id: conversation.id,
      tipo,
      mensagem: mensagemTexto,
      origem: 'whatsapp',
      status_envio: null,
      zapi_message_id: parsed.messageId ?? undefined,
      message_type: parsed.messageType,
      media_url: parsed.mediaUrl ?? undefined,
    })

    if (msg) {
      await updateConversation(conversation.id, {
        ultima_mensagem: mensagemTexto,
        status_conversa: 'aberta',
      })
      if (tipo === 'entrada') {
        await incrementConversationUnread(conversation.id)
        await logInteraction({
          contact_id: contact.id,
          evento: 'mensagem_recebida',
          detalhes: { origem: 'whatsapp', preview: mensagemTexto.slice(0, 100) },
        })
      }
      await touchContactLastInteraction(contact.id)
    }

    await safeLog({
      status: 'success',
      detail: msg ? (created ? 'novo_lead + mensagem' : 'mensagem') : 'duplicada',
      contact_id: contact.id,
      payload_preview: payloadPreview,
    })
    return NextResponse.json({ ok: true, contact_id: contact.id })
  } catch (e: unknown) {
    const err = e as Error
    const payloadPreview = body ? JSON.stringify(body).slice(0, PAYLOAD_PREVIEW_MAX) : null
    await logWebhookEvent({
      status: 'error',
      detail: err?.message ?? 'Erro',
      payload_preview: payloadPreview,
    }).catch(() => {})
    console.error('[webhooks/evolution] POST:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ webhook: 'evolution', status: 'ok' })
}
