import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const status = body?.status

    if (status !== 'paid' && status !== 'cancelled') {
      return NextResponse.json({ error: 'Status deve ser paid ou cancelled' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const update: Record<string, unknown> = {
      status,
      processed_at: new Date().toISOString(),
      processed_by: admin.id,
    }

    const { data, error } = await supabase
      .from('affiliate_withdrawal_requests')
      .update(update)
      .eq('id', id)
      .select('id, status')
      .single()

    if (error) {
      console.error('[admin/affiliate-withdrawals PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[admin/affiliate-withdrawals PATCH]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
