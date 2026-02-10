import { NextResponse } from 'next/server'
import { getStats } from '@/lib/visitor-store'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Estatísticas por IP único: cada pessoa (IP) conta uma vez.
 * Visitantes Hoje e Visitantes Online ficam em sincronia (mesmo critério de unicidade).
 */
export async function GET() {
  try {
    const supabase = createAdminClient()
    if (supabase) {
      const { data: rpcRows, error } = await supabase.rpc('get_visitor_stats_by_ip')
      if (!error && rpcRows && rpcRows.length > 0) {
        const row = rpcRows[0]
        const total = Number(row?.total ?? 0)
        const online = Number(row?.online ?? 0)
        const hoje = Number(row?.hoje ?? 0)
        const semana = Number(row?.semana ?? 0)
        const mes = Number(row?.mes ?? 0)
        return NextResponse.json({ total, online, hoje, semana, mes })
      }

      const now = new Date()
      const nowMs = now.getTime()
      const startOfToday = new Date(now)
      startOfToday.setHours(0, 0, 0, 0)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const twoMinAgo = new Date(nowMs - 2 * 60 * 1000)
      const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000)
      const isoToday = startOfToday.toISOString()
      const isoMonth = startOfMonth.toISOString()
      const isoTwoMin = twoMinAgo.toISOString()
      const isoWeek = sevenDaysAgo.toISOString()

      const [totalRes, onlineRes, hojeRes, semanaRes, mesRes] = await Promise.all([
        supabase.from('visitor_hits').select('id', { count: 'exact', head: true }),
        supabase.from('visitor_hits').select('id', { count: 'exact', head: true }).gte('ts', isoTwoMin),
        supabase.from('visitor_hits').select('id', { count: 'exact', head: true }).gte('ts', isoToday),
        supabase.from('visitor_hits').select('id', { count: 'exact', head: true }).gte('ts', isoWeek),
        supabase.from('visitor_hits').select('id', { count: 'exact', head: true }).gte('ts', isoMonth),
      ])

      const total = totalRes.count ?? 0
      const online = onlineRes.count ?? 0
      const hoje = hojeRes.count ?? 0
      const semana = semanaRes.count ?? 0
      const mes = mesRes.count ?? 0
      return NextResponse.json({ total, online, hoje, semana, mes })
    }
  } catch (err) {
    console.error('❌ [VISITOR] Erro ao buscar stats do Supabase:', err)
  }

  try {
    const stats = getStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('❌ [VISITOR] Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { total: 0, online: 0, hoje: 0, semana: 0, mes: 0 },
      { status: 200 }
    )
  }
}
