import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getInboxList } from '@/lib/crm/inbox'
import type { ContactStatus } from '@/lib/crm/contacts'

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ContactStatus | null
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

    const list = await getInboxList({
      ...(status && { status }),
      limit,
    })
    return NextResponse.json({ conversations: list })
  } catch (e: any) {
    console.error('[crm/inbox] GET:', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
