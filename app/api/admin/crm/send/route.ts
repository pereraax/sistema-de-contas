import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createMessage } from '@/lib/crm/messages'
import { findOrCreateConversationForContact, updateConversation } from '@/lib/crm/conversations'
import { touchContactLastInteraction } from '@/lib/crm/contacts'
import { sendWhatsAppMessageWithResult } from '@/lib/whatsapp/sender'

// Segurança: só enviar mensagem manual após interação do usuário (resposta no CRM).
// Não permite envio em massa nem automático sem contexto.

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })

    let body: { contact_id?: string; contactId?: string; message?: string }
    try {
      const raw = await request.text()
      if (!raw?.trim()) {
        return NextResponse.json({ ok: false, error: 'Envie JSON com contact_id e message' })
      }
      body = JSON.parse(raw) as { contact_id?: string; contactId?: string; message?: string }
    } catch {
      return NextResponse.json({ ok: false, error: 'Corpo inválido. Envie JSON: { "contact_id": "...", "message": "..." }' })
    }
    const contact_id = body?.contact_id ?? body?.contactId
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    if (!contact_id || typeof contact_id !== 'string') {
      return NextResponse.json({ ok: false, error: 'contact_id é obrigatório' })
    }
    if (!message) {
      return NextResponse.json({ ok: false, error: 'message é obrigatório' })
    }

    const conv = await findOrCreateConversationForContact(contact_id)
    if (!conv) {
      return NextResponse.json({ ok: false, error: 'Conversa não encontrada para este contato' })
    }

    const result = await sendWhatsAppMessageWithResult(contact_id, message)
    const origem = 'whatsapp' as const
    const statusEnvio = result.success ? 'sent' : 'falha'

    await createMessage({
      contact_id,
      conversation_id: conv.id,
      tipo: 'saida',
      mensagem: message,
      origem,
      status_envio: statusEnvio,
      zapi_message_id: result.messageId ?? undefined,
      message_type: 'text',
    })
    await updateConversation(conv.id, { ultima_mensagem: message, status_conversa: 'em_atendimento' })
    await touchContactLastInteraction(contact_id)

    if (!result.success) {
      const err = result.error || 'Falha ao enviar. Verifique Z-API (ZAPI_INSTANCE_ID, ZAPI_TOKEN) e número com DDI (ex: 5511999999999).'
      return NextResponse.json(
        { ok: false, error: err },
        { status: 200 }
      )
    }
    return NextResponse.json({
      ok: true,
      status_envio: statusEnvio,
      message: 'Mensagem enviada e registrada.',
    })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/send] POST:', err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro interno' }, { status: 500 })
  }
}
