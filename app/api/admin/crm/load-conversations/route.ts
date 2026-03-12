import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getInboxList } from '@/lib/crm/inbox'
import type { ContactStatus } from '@/lib/crm/contacts'

/**
 * Sincronização inicial: retorna as conversas já existentes no CRM (inbox).
 * Use após configurar o webhook para listar conversas que já têm mensagens no banco.
 */
export async function GET(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ContactStatus | null
    const limit = Math.min(Number(searchParams.get('limit')) || 500, 1000)

    const list = await getInboxList({
      ...(status && { status }),
      limit,
    })
    return NextResponse.json({
      conversations: list,
      message: 'Conversas carregadas do banco. Novas mensagens entram via webhook Z-API.',
    })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/load-conversations] GET:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}
