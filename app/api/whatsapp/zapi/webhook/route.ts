/**
 * Webhook Z-API: recebe mensagens do WhatsApp (e de anúncios).
 * Fluxo: Z-API → Webhook → CRM (contato/conversa/mensagem) → Chatbot Builder (fluxo ativo) → Message Queue → Sender Z-API
 * Toda automação Plen vem apenas do Chatbot Builder (fluxo salvo com ativo = true).
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { parseZApiPayload, extractButtonTextDeep } from '@/lib/whatsapp/webhook/parser'
import {
  getOrCreateContactByPhoneWithFlag,
  findContactByPhone,
  touchContactLastInteraction,
  updateContact,
} from '@/lib/crm/contacts'
import { isPlausiblePhone } from '@/lib/crm/phone'
import {
  findOrCreateConversationForContact,
  updateConversation,
  incrementConversationUnread,
} from '@/lib/crm/conversations'
import { createMessage, findMessageByZapiId } from '@/lib/crm/messages'
import { logInteraction } from '@/lib/crm/interaction-logs'
import { logWebhookEvent } from '@/lib/crm/webhook-logger'
import { runChatbotFlow, clearChatbotFlowState } from '@/lib/plen/chatbot-flow-runner'
import { enqueuePlenMessage } from '@/lib/plen/queue/message-queue'
import { processPlenQueue } from '@/lib/plen/queue/queue-worker'

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

    if (parsed.messageId) {
      const jaProcessada = await findMessageByZapiId(parsed.messageId)
      if (jaProcessada) {
        await safeLog({ status: 'ignored', detail: 'Mensagem já processada (idempotência)', payload_preview: payloadPreview })
        return NextResponse.json({ ok: true })
      }
    }

    const plausible = isPlausiblePhone(parsed.phone)
    let contact = await findContactByPhone(parsed.phone)
    let created = false
    let origem: 'whatsapp' | 'anuncio' = 'whatsapp'
    const primeiroTextoRaw = (parsed.text ?? '').trim()

    if (!contact && plausible) {
      if (detectOrigemAnuncio(primeiroTextoRaw)) origem = 'anuncio'
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

    let effectiveText = primeiroTextoRaw
    if (!effectiveText && !parsed.mediaUrl) {
      const buttonText = extractButtonTextDeep(body)
      if (buttonText) effectiveText = buttonText
    }
    if (!effectiveText && !parsed.mediaUrl && contact.status === 'aguardando_codigo' && (contact.email ?? '').includes('@')) {
      effectiveText = 'Reenviar email'
    }
    const hasText = !!effectiveText || !!parsed.mediaUrl
    if (!hasText) {
      await safeLog({ status: 'ignored', detail: 'Sem texto nem mídia', payload_preview: payloadPreview })
      return NextResponse.json({ ok: true })
    }

    const primeiroTexto = effectiveText

    if (process.env.NODE_ENV === 'development') {
      console.log('[webhooks/zapi] MENSAGEM RECEBIDA', {
        phone: parsed.phone?.slice(-4),
        text: effectiveText.slice(0, 40),
        messageType: parsed.messageType,
      })
    }

    // Sempre manter o nome do contato = nome do perfil WhatsApp (para {nome} no Chatbot e no CRM)
    const senderName = (parsed.senderName ?? '').trim()
    if (senderName.length >= 2 && senderName !== (contact.nome ?? '').trim()) {
      await updateContact(contact.id, { nome: senderName })
      contact.nome = senderName
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

    const mensagemTexto = effectiveText || (parsed.mediaUrl ? '[Mídia]' : '[Mídia]')

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

    const textForPlen = effectiveText || (parsed.mediaUrl ? '[Mídia]' : '[Mídia]')
    const cmdReset = textForPlen && /^(reset|resetar)$/i.test(textForPlen.trim())

    if (cmdReset) {
      await clearChatbotFlowState(contact.id)
      await enqueuePlenMessage(contact.id, 'Conversa resetada. Envie qualquer mensagem para começar do zero.', new Date())
      await processPlenQueue(5).catch((err) => console.error('[webhooks/zapi] Fila após reset:', (err as Error)?.message ?? err))
      await safeLog({ status: 'success', detail: 'comando reset', contact_id: contact.id, payload_preview: payloadPreview })
      return NextResponse.json({ ok: true, contact_id: contact.id, reset: true })
    }

    if (textForPlen || parsed.mediaUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[webhooks/zapi] Chatbot Builder: processando', { contact_id: contact.id, isNewLead: created, text: textForPlen.slice(0, 50) })
      }
      runChatbotFlow(contact.id, textForPlen || '[Mídia]', created, parsed.senderName ?? undefined)
        .then((r) => {
          if (!r.replied && r.reason) {
            console.warn('[webhooks/zapi] Plen não respondeu:', { contact_id: contact.id, reason: r.reason })
          }
          if (process.env.NODE_ENV === 'development') {
            console.log('[webhooks/zapi] Chatbot Builder: resultado', { replied: r.replied, reason: r.reason })
            if (r.replied) {
              setTimeout(() => {
                processPlenQueue(5).then(({ sent, failed }) => {
                  console.log('[webhooks/zapi] PLEN fila (dev):', { sent, failed })
                }).catch((err) => {
                  console.error('[webhooks/zapi] PLEN fila (dev) ERRO:', (err as Error)?.message ?? err)
                })
              }, 6000)
            }
          }
        })
        .catch((err) => {
          console.error('[webhooks/zapi] Chatbot Builder ERRO:', (err as Error)?.message ?? err)
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
