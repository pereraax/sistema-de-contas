import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getMessagesByContactId, getMessagesByConversationId } from '@/lib/crm/messages'

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')
    const conversationId = searchParams.get('conversation_id')
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)

    if (conversationId) {
      const messages = await getMessagesByConversationId(conversationId, limit)
      return NextResponse.json({ messages })
    }
    if (contactId) {
      const messages = await getMessagesByContactId(contactId, limit)
      return NextResponse.json({ messages })
    }
    return NextResponse.json({ error: 'contact_id ou conversation_id obrigatório' }, { status: 400 })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/messages] GET:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}
