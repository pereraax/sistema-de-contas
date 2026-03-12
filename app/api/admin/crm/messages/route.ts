import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getMessagesByContactId, getMessagesByConversationId } from '@/lib/crm/messages'

function messageToText(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') {
    if (v === '[object Object]') return ''
    try {
      const parsed = JSON.parse(v) as unknown
      if (parsed && typeof parsed === 'object' && 'message' in parsed) return String((parsed as { message?: unknown }).message ?? '')
      if (parsed && typeof parsed === 'object' && 'text' in parsed) return String((parsed as { text?: unknown }).text ?? '')
    } catch {
      // não é JSON, usa como texto
    }
    return v
  }
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
    const limit = Math.min(Number(searchParams.get('limit')) || 5000, 10000)

    const mediaLabel = (type: unknown) => {
      if (type === 'image') return '[Imagem]'
      if (type === 'audio') return '[Áudio]'
      if (type === 'video') return '[Vídeo]'
      if (type === 'document') return '[Documento]'
      if (type === 'sticker') return '[Figurinha]'
      if (type === 'contact') return '[Contato]'
      if (type === 'location') return '[Localização]'
      return '[Mídia]'
    }
    const normalize = (list: Array<Record<string, unknown>>) =>
      list.map((m) => {
        const text = messageToText(m.mensagem)
        const fallback = m.media_url || m.message_type ? (mediaLabel(m.message_type) || '[Mídia]') : '[Mensagem]'
        return {
          ...m,
          mensagem: text.trim() || fallback,
          media_url: m.media_url != null ? String(m.media_url) : null,
        }
      })

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
