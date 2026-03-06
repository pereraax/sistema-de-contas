import { NextResponse } from 'next/server'
import { parseZApiPayload } from '@/lib/whatsapp/webhook/parser'
import { getOrCreateContactByPhoneWithFlag } from '@/lib/crm/contacts'
import { findOrCreateConversationForContact, updateConversation } from '@/lib/crm/conversations'
import { createMessage } from '@/lib/crm/messages'
import { logInteraction } from '@/lib/crm/interaction-logs'
import { logWebhookEvent } from '@/lib/crm/webhook-logger'
import { touchContactLastInteraction } from '@/lib/crm/contacts'

const PAYLOAD_PREVIEW_MAX = 200

/**
 * Webhook unificado Z-API.
 * Eventos: message, messageReceived, messageSent, messageDelivered.
 * Cria contato/conversa, salva mensagem (dedupe por messageId), atualiza última mensagem.
 */
export async function POST(request: Request) {
  let body: unknown = null
  try {
    body = await request.json().catch(() => null)
    const b = body as Record<string, unknown> | null
    const payloadPreview = body ? JSON.stringify(body).slice(0, PAYLOAD_PREVIEW_MAX) : null
    const safeLog = (p: { status: 'success' | 'ignored' | 'error'; detail?: string | null; contact_id?: string | null; payload_preview?: string | null }) =>
      logWebhookEvent(p).catch(() => {})

    if (b?.isGroup) {
      await safeLog({ status: 'ignored', detail: 'isGroup', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true, ignored: 'isGroup' })
    }

    const parsed = parseZApiPayload(body)
    if (!parsed) {
      await safeLog({ status: 'error', detail: 'Payload inválido', payload_preview: payloadPreview })
      return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 })
    }

    if (!parsed.text) {
      await safeLog({ status: 'ignored', detail: 'empty text', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true, ignored: 'empty text' })
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
    const msg = await createMessage({
      contact_id: contact.id,
      conversation_id: conversation.id,
      tipo,
      mensagem: parsed.text,
      origem: 'whatsapp',
      status_envio: null,
      zapi_message_id: parsed.messageId ?? undefined,
      message_type: 'text',
    })

    if (msg) {
      await updateConversation(conversation.id, {
        ultima_mensagem: parsed.text,
        status_conversa: 'aberta',
      })
      await touchContactLastInteraction(contact.id)
      if (tipo === 'entrada') {
        await logInteraction({
          contact_id: contact.id,
          evento: 'mensagem_recebida',
          detalhes: { origem: 'whatsapp', preview: parsed.text.slice(0, 100) },
        })
      }
    }

    await safeLog({
      status: 'success',
      detail: msg ? (created ? 'novo_lead + mensagem' : 'mensagem') : 'duplicada',
      contact_id: contact.id,
      payload_preview: payloadPreview,
    })
    return NextResponse.json({ ok: true, contact_id: contact.id })
  } catch (e: any) {
    const payloadPreview = body ? JSON.stringify(body).slice(0, PAYLOAD_PREVIEW_MAX) : null
    await logWebhookEvent({
      status: 'error',
      detail: e?.message ?? 'Erro',
      payload_preview: payloadPreview,
    }).catch(() => {})
    console.error('[webhooks/zapi] POST:', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ webhook: 'zapi', status: 'ok' })
}
