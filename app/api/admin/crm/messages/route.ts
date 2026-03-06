import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getMessagesByContactId, getMessagesByConversationId } from '@/lib/crm/messages'

function messageToText(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v === '[object Object]' ? '' : v
  if (typeof v === 'object' && v !== null && 'message' in v) return String((v as { message?: unknown }).message ?? '')
  if (typeof v === 'object' && v !== null && 'text' in v) return String((v as { text?: unknown }).text ?? '')
  return ''
}

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')
    const conversationId = searchParams.get('conversation_id')
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)

    const normalize = (list: Array<Record<string, unknown>>) =>
      list.map((m) => ({
        ...m,
        mensagem: messageToText(m.mensagem) || (m.media_url ? '[Mídia]' : ''),
        media_url: m.media_url != null ? String(m.media_url) : null,
      }))

    if (conversationId) {
      const messages = await getMessagesByConversationId(conversationId, limit)
      return NextResponse.json({ messages: normalize(messages as Array<Record<string, unknown>>) })
    }
    if (contactId) {
      const messages = await getMessagesByContactId(contactId, limit)
      return NextResponse.json({ messages: normalize(messages as Array<Record<string, unknown>>) })
    }
    return NextResponse.json({ error: 'contact_id ou conversation_id obrigatório' }, { status: 400 })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/messages] GET:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}
