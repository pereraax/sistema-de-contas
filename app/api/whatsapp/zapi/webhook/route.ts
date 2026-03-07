/**
 * Webhook Z-API: recebe mensagens do WhatsApp (e de anúncios).
 * Fluxo: Z-API → Webhook → CRM (contato/conversa/mensagem) → User State → Intent Router → Business Logic → Message Queue → Sender Z-API
 * IMPORTANTE: Primeira mensagem recebida é sempre tratada como novo lead (incluindo "Olá! Quero utilizar a Plenipay." de anúncios).
 */

import { NextResponse } from 'next/server'
import { parseZApiPayload } from '@/lib/whatsapp/webhook/parser'
import {
  getOrCreateContactByPhoneWithFlag,
  findContactByPhone,
  updateContact,
  touchContactLastInteraction,
} from '@/lib/crm/contacts'
import { isPlausiblePhone } from '@/lib/crm/phone'
import {
  findOrCreateConversationForContact,
  updateConversation,
  incrementConversationUnread,
} from '@/lib/crm/conversations'
import { createMessage } from '@/lib/crm/messages'
import { logInteraction } from '@/lib/crm/interaction-logs'
import { logWebhookEvent } from '@/lib/crm/webhook-logger'
import { handlePlenIncomingMessage } from '@/lib/plen/business/plen-handler'

const PAYLOAD_PREVIEW_MAX = 200

/** Detecta se a primeira mensagem parece vir de anúncio (ex.: "Olá! Quero utilizar a Plenipay."). */
function detectOrigemAnuncio(text: string): boolean {
  const t = text.trim().toLowerCase()
  const padroes = [
    /quero utilizar a plenipay/i,
    /quero usar a plenipay/i,
    /quero (utilizar|usar) o plenipay/i,
    /olá!?\s*quero/i,
    /oi!?\s*quero/i,
  ]
  return padroes.some((p) => p.test(t))
}

export async function POST(request: Request) {
  let body: unknown = null
  try {
    body = await request.json().catch(() => null)
    const payloadPreview = body ? JSON.stringify(body).slice(0, PAYLOAD_PREVIEW_MAX) : null
    const safeLog = (p: {
      status: 'success' | 'ignored' | 'error'
      detail?: string | null
      contact_id?: string | null
      payload_preview?: string | null
    }) => logWebhookEvent(p).catch(() => {})

    const parsed = parseZApiPayload(body)
    if (!parsed) {
      await safeLog({
        status: 'ignored',
        detail: 'Payload Z-API inválido',
        payload_preview: payloadPreview,
      })
      return NextResponse.json({ ok: true })
    }

    if (parsed.fromMe) {
      await safeLog({ status: 'ignored', detail: 'Mensagem enviada por nós', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true })
    }

    const hasText = parsed.messageType === 'text' ? !!parsed.text?.trim() : true
    if (!hasText && !parsed.mediaUrl) {
      await safeLog({ status: 'ignored', detail: 'Sem texto nem mídia', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true })
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[webhooks/zapi] MENSAGEM RECEBIDA', {
        phone: parsed.phone?.slice(-4),
        text: (parsed.text || '').slice(0, 40),
        messageType: parsed.messageType,
      })
    }

    const plausible = isPlausiblePhone(parsed.phone)
    let contact = await findContactByPhone(parsed.phone)
    let created = false
    let origem: 'whatsapp' | 'anuncio' = 'whatsapp'
    const primeiroTexto = (parsed.text || '').trim()

    if (!contact && plausible) {
      if (detectOrigemAnuncio(primeiroTexto)) origem = 'anuncio'
      const jid = `${parsed.phone}@s.whatsapp.net`
      const result = await getOrCreateContactByPhoneWithFlag(parsed.phone, {
        nome: parsed.senderName ?? undefined,
        origem,
        jid,
      })
      contact = result.contact
      created = result.created
    }

    if (!contact) {
      await safeLog({
        status: 'ignored',
        detail: 'Número inválido (não criar contato)',
        payload_preview: payloadPreview,
      })
      return NextResponse.json({ ok: true })
    }

    if (created) {
      await logInteraction({
        contact_id: contact.id,
        evento: 'novo_lead',
        detalhes: { origem, telefone: contact.telefone, primeiro_texto: primeiroTexto.slice(0, 100) },
      })
    }

    const conversation = await findOrCreateConversationForContact(contact.id)
    if (!conversation) {
      return NextResponse.json({ ok: false, error: 'Conversa' }, { status: 500 })
    }

    const mensagemTexto =
      parsed.messageType === 'text'
        ? (parsed.text || '').trim()
        : parsed.mediaUrl
          ? '[Mídia]'
          : (parsed.text || '').trim() || '[Mídia]'

    const msg = await createMessage({
      contact_id: contact.id,
      conversation_id: conversation.id,
      tipo: 'entrada',
      mensagem: mensagemTexto,
      origem: 'whatsapp',
      status_envio: null,
      zapi_message_id: parsed.messageId ?? undefined,
      message_type: parsed.messageType,
      media_url: parsed.mediaUrl ?? undefined,
    })

    await updateConversation(conversation.id, {
      ultima_mensagem: mensagemTexto,
      status_conversa: 'aberta',
    })
    await incrementConversationUnread(conversation.id)
    await logInteraction({
      contact_id: contact.id,
      evento: 'mensagem_recebida',
      detalhes: { origem: 'whatsapp', preview: mensagemTexto.slice(0, 100) },
    })
    await touchContactLastInteraction(contact.id)

    const textForPlen = parsed.messageType === 'text' ? (parsed.text || '').trim() : (parsed.text || '').trim() || '[Mídia]'
    if (textForPlen || parsed.mediaUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[webhooks/zapi] PLEN: processando', { contact_id: contact.id, text: textForPlen.slice(0, 50) })
      }
      handlePlenIncomingMessage(contact.id, textForPlen || '[Mídia]')
        .then((r) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[webhooks/zapi] PLEN: resultado', { replied: r.replied, reason: r.reason })
          }
        })
        .catch((err) => {
          console.error('[webhooks/zapi] PLEN handler ERRO:', (err as Error)?.message ?? err)
        })
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
    console.error('[webhooks/zapi] POST:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ webhook: 'zapi', status: 'ok' })
}
