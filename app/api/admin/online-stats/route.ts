import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Considerar "online" se last_seen_at nos últimos 60 segundos. */
const ONLINE_WITHIN_SECONDS = 60

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
    }

    const since = new Date(Date.now() - ONLINE_WITHIN_SECONDS * 1000).toISOString()

    const [totalRes, onlineRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('last_seen_at', since),
    ])

    const total = totalRes.count ?? 0
    const online = onlineRes.count ?? 0
    const offline = Math.max(0, total - online)

    return NextResponse.json(
      { online, offline, total },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err: unknown) {
    console.error('[admin/online-stats] Erro:', err)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
