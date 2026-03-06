import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { updateConversation } from '@/lib/crm/conversations'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { id } = await params
    const ok = await updateConversation(id, { status_conversa: 'fechada' })
    if (!ok) return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[crm/conversations/close] POST:', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
