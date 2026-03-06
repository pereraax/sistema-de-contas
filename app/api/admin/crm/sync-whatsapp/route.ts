import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { evolutionSyncChats } from '@/lib/whatsapp/evolution-sync'
import { whatsappFullSync } from '@/lib/whatsapp/zapi-sync'

const hasEvolution = () =>
  !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_INSTANCE && process.env.EVOLUTION_API_KEY)

/**
 * Sincronização: com Evolution API busca todos os chats (findChats); com Z-API busca chats + histórico.
 * Assim o CRM mostra todas as conversas do WhatsApp.
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    if (hasEvolution()) {
      const result = await evolutionSyncChats({ importMessages: true, maxMessagesPerChat: 100 })
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
      }
      return NextResponse.json({
        ok: true,
        chatsFetched: result.chatsFetched,
        chatsSynced: result.chatsSynced,
        messagesSynced: result.messagesSynced,
        message: `Sincronizadas ${result.chatsSynced ?? 0} conversas e ${result.messagesSynced ?? 0} mensagens (Evolution API).`,
      })
    }

    const body = await request.json().catch(() => ({}))
    const maxPages = typeof body.maxPages === 'number' ? body.maxPages : 20
    const pageSize = typeof body.pageSize === 'number' ? body.pageSize : 100
    const messagesPerChat = typeof body.messagesPerChat === 'number' ? body.messagesPerChat : 100

    const result = await whatsappFullSync({
      maxPages: Math.min(maxPages, 50),
      pageSize: Math.min(pageSize, 100),
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
      message: `Sincronizadas ${result.chatsSynced ?? 0} conversas e ${result.messagesSynced ?? 0} mensagens (Z-API).`,
    })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/sync-whatsapp] POST:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: hasEvolution()
      ? 'Use POST para sincronizar. Com Evolution API: busca todos os chats (findChats). Com Z-API: configure Z_API_* e Z_API_CLIENT_TOKEN.'
      : 'Use POST para sincronização. Configure EVOLUTION_* ou Z_API_* no .env.',
  })
}
