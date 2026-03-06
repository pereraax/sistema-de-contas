import { NextResponse } from 'next/server'
import { parseZApiPayload } from '@/lib/whatsapp/webhook/parser'
import { getOrCreateContactByPhone } from '@/lib/crm/contacts'
import { findOrCreateConversationForContact, updateConversation } from '@/lib/crm/conversations'
import { createMessage } from '@/lib/crm/messages'
import { logInteraction } from '@/lib/crm/interaction-logs'

/**
 * Webhook Z-API: recebe mensagens recebidas no WhatsApp.
 * 1) Verifica/cria contato
 * 2) Cria/atualiza conversa
 * 3) Salva mensagem (entrada)
 * 4) Atualiza ultima_interacao do contato
 * Não envia respostas automáticas em massa (segurança).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseZApiPayload(body)
    if (!parsed) {
      return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 })
    }
    if (parsed.fromMe) {
      return NextResponse.json({ ok: true, ignored: 'fromMe' })
    }
    if (!parsed.text) {
      return NextResponse.json({ ok: true, ignored: 'empty text' })
    }

    const contact = await getOrCreateContactByPhone(parsed.phone, {
      nome: parsed.senderName,
      origem: 'whatsapp',
    })
    if (!contact) {
      console.error('[webhook/zapi] Falha ao obter/criar contato:', parsed.phone)
      return NextResponse.json({ ok: false, error: 'Contato' }, { status: 500 })
    }

    const conversation = await findOrCreateConversationForContact(contact.id)
    if (!conversation) {
      console.error('[webhook/zapi] Falha ao obter/criar conversa:', contact.id)
      return NextResponse.json({ ok: false, error: 'Conversa' }, { status: 500 })
    }

    await createMessage({
      contact_id: contact.id,
      conversation_id: conversation.id,
      tipo: 'entrada',
      mensagem: parsed.text,
      origem: 'whatsapp',
    })
    await updateConversation(conversation.id, {
      ultima_mensagem: parsed.text,
      status_conversa: 'aberta',
    })
    const { touchContactLastInteraction } = await import('@/lib/crm/contacts')
    await touchContactLastInteraction(contact.id)
    await logInteraction({
      contact_id: contact.id,
      evento: 'mensagem_recebida',
      detalhes: { origem: 'whatsapp', preview: parsed.text.slice(0, 100) },
    })

    return NextResponse.json({ ok: true, contact_id: contact.id })
  } catch (e: any) {
    console.error('[webhook/zapi] POST:', e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ webhook: 'zapi', status: 'ok' })
}
