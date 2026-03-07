import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const order = searchParams.get('order') || 'ultima'
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

    const orderBy = order === 'chegada' ? 'data_primeiro_contato' : 'ultima_interacao'
    let query = supabase
      .from('crm_contacts')
      .select('*')
      .order(orderBy, { ascending: false })
      .limit(limit)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) {
      console.error('[crm/contacts] GET:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ contacts: data ?? [] })
  } catch (e: any) {
    console.error('[crm/contacts] GET:', e)
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 })
  }
}
