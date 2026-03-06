import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { syncWhatsAppConversations } from '@/lib/whatsapp/zapi-sync'

/**
 * Sincroniza as conversas do WhatsApp conectado (Z-API) com o CRM.
 * Lista todos os chats e importa as mensagens recentes de cada um.
 * Requer Z_API_CLIENT_TOKEN no .env (token de segurança da conta).
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const maxChats = typeof body.maxChats === 'number' ? body.maxChats : 50
    const messagesPerChat = typeof body.messagesPerChat === 'number' ? body.messagesPerChat : 30

    const result = await syncWhatsAppConversations({
      maxChats: Math.min(maxChats, 100),
      messagesPerChat: Math.min(messagesPerChat, 100),
    })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      chatsFetched: result.chatsFetched,
      chatsSynced: result.chatsSynced,
      messagesSynced: result.messagesSynced,
      message: `Sincronizadas ${result.chatsSynced} conversas e ${result.messagesSynced} mensagens.`,
    })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/sync-whatsapp] POST:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para sincronizar. Configure Z_API_INSTANCE_ID, Z_API_TOKEN e Z_API_CLIENT_TOKEN.',
  })
}
