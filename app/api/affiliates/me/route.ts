import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateAffiliateCode, getMyReferrals } from '@/lib/affiliates'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [codeResult, referralsResult] = await Promise.all([
      getOrCreateAffiliateCode(user.id),
      getMyReferrals(user.id),
    ])

    if (!codeResult) {
      return NextResponse.json({ error: 'Erro ao obter código de afiliado' }, { status: 500 })
    }

    return NextResponse.json({
      code: codeResult.code,
      link: codeResult.link,
      referrals: referralsResult.referrals,
      totalEarned: referralsResult.totalEarned,
      totalWithdrawn: referralsResult.totalWithdrawn,
      availableBalance: referralsResult.availableBalance,
      canWithdraw: referralsResult.canWithdraw,
      mission: referralsResult.mission,
    })
  } catch (err) {
    console.error('[affiliates/me]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
