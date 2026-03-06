import { NextResponse } from 'next/server'
import { parseZApiPayload } from '@/lib/whatsapp/webhook/parser'
import { getOrCreateContactByPhoneWithFlag } from '@/lib/crm/contacts'
import { findOrCreateConversationForContact, updateConversation } from '@/lib/crm/conversations'
import { createMessage } from '@/lib/crm/messages'
import { logInteraction } from '@/lib/crm/interaction-logs'
import { logWebhookEvent } from '@/lib/crm/webhook-logger'

const PAYLOAD_PREVIEW_MAX = 200

/**
 * Webhook Z-API: recebe mensagens recebidas no WhatsApp.
 * Funciona com a mesma URL em produção (domínio) ou em localhost (via túnel).
 */
export async function POST(request: Request) {
  let body: unknown = null
  try {
    body = await request.json().catch(() => null)
    const b = body as Record<string, unknown> | null
    const payloadPreview = body ? JSON.stringify(body).slice(0, PAYLOAD_PREVIEW_MAX) : null

    const safeLog = (p: Parameters<typeof logWebhookEvent>[0]) => logWebhookEvent(p).catch(() => {})

    if (b?.isGroup) {
      await safeLog({ status: 'ignored', detail: 'isGroup', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true, ignored: 'isGroup' })
    }
    const parsed = parseZApiPayload(body)
    if (!parsed) {
      await safeLog({ status: 'error', detail: 'Payload inválido', payload_preview: payloadPreview })
      console.error('[webhook/zapi] Payload inválido. Body:', JSON.stringify(body)?.slice(0, 300))
      return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 })
    }
    if (parsed.fromMe) {
      await safeLog({ status: 'ignored', detail: 'fromMe', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true, ignored: 'fromMe' })
    }
    if (parsed.messageType === 'text' && !parsed.text) {
      await safeLog({ status: 'ignored', detail: 'empty text', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true, ignored: 'empty text' })
    }

    const { contact, created } = await getOrCreateContactByPhoneWithFlag(parsed.phone, {
      nome: parsed.senderName,
      origem: 'whatsapp',
    })
    if (!contact) {
      await safeLog({ status: 'error', detail: 'Falha ao criar contato', payload_preview: payloadPreview })
      console.error('[webhook/zapi] Falha ao obter/criar contato:', parsed.phone)
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
      console.error('[webhook/zapi] Falha ao obter/criar conversa:', contact.id)
      return NextResponse.json({ ok: false, error: 'Conversa' }, { status: 500 })
    }

    const mensagemTexto = parsed.text || (parsed.mediaUrl ? '[Mídia]' : '')
    await createMessage({
      contact_id: contact.id,
      conversation_id: conversation.id,
      tipo: 'entrada',
      mensagem: mensagemTexto,
      origem: 'whatsapp',
      zapi_message_id: parsed.messageId ?? undefined,
      message_type: parsed.messageType,
      media_url: parsed.mediaUrl ?? undefined,
    })
    await updateConversation(conversation.id, {
      ultima_mensagem: mensagemTexto,
      status_conversa: 'aberta',
    })
    const { touchContactLastInteraction } = await import('@/lib/crm/contacts')
    await touchContactLastInteraction(contact.id)
    await logInteraction({
      contact_id: contact.id,
      evento: 'mensagem_recebida',
      detalhes: { origem: 'whatsapp', preview: mensagemTexto.slice(0, 100) },
    })

    await safeLog({
      status: 'success',
      detail: created ? 'novo_lead + mensagem' : 'mensagem',
      contact_id: contact.id,
      payload_preview: body ? JSON.stringify(body).slice(0, PAYLOAD_PREVIEW_MAX) : null,
    })
    return NextResponse.json({ ok: true, contact_id: contact.id })
  } catch (e: any) {
    const payloadPreview = body ? JSON.stringify(body).slice(0, PAYLOAD_PREVIEW_MAX) : null
    await logWebhookEvent({
      status: 'error',
      detail: e?.message ?? 'Erro',
      payload_preview: payloadPreview,
    }).catch(() => {})
    console.error('[webhook/zapi] POST:', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ webhook: 'zapi', status: 'ok' })
}
