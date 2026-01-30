import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    return NextResponse.json({ ok: true, email: admin.email })
  } catch (err: any) {
    console.error('[api/admin/verify] Erro:', err)
    return NextResponse.json({ error: 'Erro ao verificar token' }, { status: 401 })
  }
}
