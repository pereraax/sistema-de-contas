import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { listPendentes } from '@/lib/whatsapp-contatos-pendentes'

/** GET: lista contatos WhatsApp que enviaram "quero utilizar plenipay" e ainda não receberam as 3 mensagens de boas-vindas. */
export async function GET() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const list = await listPendentes()
  return NextResponse.json({ pendentes: list })
}
