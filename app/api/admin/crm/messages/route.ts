import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getMessagesByContactId } from '@/lib/crm/messages'

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')
    if (!contactId) {
      return NextResponse.json({ error: 'contact_id obrigatório' }, { status: 400 })
    }

    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500)
    const messages = await getMessagesByContactId(contactId, limit)
    return NextResponse.json({ messages })
  } catch (e: any) {
    console.error('[crm/messages] GET:', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
