import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { data: rows, error } = await supabase
      .from('affiliate_withdrawal_requests')
      .select('id, user_id, amount, pix_key_type, pix_key_value, name, status, created_at, processed_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin/affiliate-withdrawals]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const userIds = [...new Set((rows || []).map((r: any) => r.user_id))]
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id, nome, email').in('id', userIds)
      : { data: [] }
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    const list = (rows || []).map((r: any) => {
      const p = profileMap.get(r.user_id)
      return {
        id: r.id,
        user_id: r.user_id,
        user_name: p?.nome ?? '—',
        user_email: p?.email ?? '—',
        amount: Number(r.amount),
        pix_key_type: r.pix_key_type,
        pix_key_value: r.pix_key_value,
        name: r.name,
        status: r.status,
        created_at: r.created_at,
        processed_at: r.processed_at,
      }
    })

    return NextResponse.json({ list })
  } catch (err) {
    console.error('[admin/affiliate-withdrawals]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
