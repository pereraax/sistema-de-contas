/**
 * Envio de mensagem pela extensão CRM (por telefone).
 * Autenticação: header Authorization: Bearer {EXTENSION_CRM_API_KEY} ou X-API-Key: {EXTENSION_CRM_API_KEY}
 */
import { NextResponse } from 'next/server'
import { getOrCreateContactByPhone } from '@/lib/crm/contacts'
import { findOrCreateConversationForContact, updateConversation } from '@/lib/crm/conversations'
import { createMessage } from '@/lib/crm/messages'
import { touchContactLastInteraction } from '@/lib/crm/contacts'
import { sendWhatsAppMessageWithResult } from '@/lib/whatsapp/sender'

const EXTENSION_KEY = process.env.EXTENSION_CRM_API_KEY

function getApiKey(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return request.headers.get('X-API-Key')?.trim() ?? null
}

export async function POST(request: Request) {
  if (!EXTENSION_KEY) {
    return NextResponse.json(
      { success: false, error: 'Extensão não configurada no servidor (EXTENSION_CRM_API_KEY)' },
      { status: 503 }
    )
  }
  const key = getApiKey(request)
  if (!key || key !== EXTENSION_KEY) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  let body: { phone?: string; text?: string; buttons?: unknown[] }
  try {
    const raw = await request.text()
    if (!raw?.trim()) {
      return NextResponse.json({ success: false, error: 'Envie JSON com phone e text' }, { status: 400 })
    }
    body = JSON.parse(raw) as { phone?: string; text?: string; buttons?: unknown[] }
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido' }, { status: 400 })
  }

  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!phone) return NextResponse.json({ success: false, error: 'phone é obrigatório' }, { status: 400 })
  if (!text) return NextResponse.json({ success: false, error: 'text é obrigatório' }, { status: 400 })

  try {
    const contact = await getOrCreateContactByPhone(phone)
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Não foi possível obter/criar contato' }, { status: 500 })
    }

    const conv = await findOrCreateConversationForContact(contact.id)
    if (!conv) {
      return NextResponse.json({ success: false, error: 'Conversa não encontrada' }, { status: 500 })
    }

    const result = await sendWhatsAppMessageWithResult(contact.id, text)
    const statusEnvio = result.success ? 'sent' : 'falha'

    await createMessage({
      contact_id: contact.id,
      conversation_id: conv.id,
      tipo: 'saida',
      mensagem: text,
      origem: 'whatsapp',
      status_envio: statusEnvio,
      zapi_message_id: result.messageId ?? undefined,
      message_type: 'text',
    })
    await updateConversation(conv.id, {
      ultima_mensagem: text,
      status_conversa: 'em_atendimento',
    })
    await touchContactLastInteraction(contact.id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? 'Falha ao enviar' },
        { status: 200 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[whatsapp/send-custom-extension] POST:', err)
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Erro interno' },
      { status: 500 }
    )
  }
}
