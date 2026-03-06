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
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { contact_id, message } = body as { contact_id?: string; message?: string }
    if (!contact_id || !message?.trim()) {
      return NextResponse.json({ error: 'contact_id e message são obrigatórios' }, { status: 400 })
    }

    const conv = await findOrCreateConversationForContact(contact_id)
    if (!conv) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    const result = await sendWhatsAppMessageWithResult(contact_id, message.trim())
    const origem = 'whatsapp' as const
    const statusEnvio = result.success ? 'enviado' : 'falha'

    await createMessage({
      contact_id,
      conversation_id: conv.id,
      tipo: 'saida',
      mensagem: message.trim(),
      origem,
      status_envio: statusEnvio,
      zapi_message_id: result.messageId ?? undefined,
      message_type: 'text',
    })
    await updateConversation(conv.id, { ultima_mensagem: message.trim(), status_conversa: 'em_atendimento' })
    await touchContactLastInteraction(contact_id)

    return NextResponse.json({
      ok: result.success,
      status_envio: statusEnvio,
      message: result.success ? 'Mensagem enviada e registrada.' : 'Mensagem registrada mas envio pode ter falhado.',
    })
  } catch (e: any) {
    console.error('[crm/send] POST:', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
