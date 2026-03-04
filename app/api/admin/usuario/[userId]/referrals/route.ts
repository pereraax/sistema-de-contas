import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getMyReferrals } from '@/lib/affiliates'

/** Lista indicações do usuário (pessoas que ele indicou) para o painel admin. */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { userId } = params
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const result = await getMyReferrals(userId)

    return NextResponse.json({
      total: result.referrals.length,
      totalEarned: result.totalEarned,
      totalWithdrawn: result.totalWithdrawn,
      availableBalance: result.availableBalance,
      referrals: result.referrals,
    })
  } catch (err) {
    console.error('[admin/usuario/referrals]', err)
    return NextResponse.json({ error: 'Erro ao buscar indicações' }, { status: 500 })
  }
}
