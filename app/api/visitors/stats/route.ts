import { NextResponse } from 'next/server'
import { getStats } from '@/lib/visitor-store'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Início do dia de hoje em horário de Brasília (UTC-3), em ISO para comparar com ts no Supabase. */
function getStartOfTodayBrasiliaISO(): string {
  const now = new Date()
  const utcMs = now.getTime()
  const brtOffsetMs = 3 * 60 * 60 * 1000
  const brtNow = new Date(utcMs - brtOffsetMs)
  const y = brtNow.getUTCFullYear()
  const m = brtNow.getUTCMonth()
  const d = brtNow.getUTCDate()
  const startOfDayBRT = new Date(Date.UTC(y, m, d, 3, 0, 0, 0))
  return startOfDayBRT.toISOString()
}

/**
 * Estatísticas de visitantes: "Visitantes Hoje" = desde 0h (Brasília), em tempo real.
 * Preferência: RPC get_visitor_stats_by_ip (conta por IP único + linhas sem IP). Fallback: contagem por linhas.
 */
export async function GET() {
  try {
    const supabase = createAdminClient()
    if (supabase) {
      const now = new Date()
      const nowMs = now.getTime()
      const isoToday = getStartOfTodayBrasiliaISO()
      const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      const twoMinAgo = new Date(nowMs - 2 * 60 * 1000)
      const sevenDaysAgo = new Date(nowMs - 7 * 24 * 60 * 60 * 1000)
      const isoMonth = startOfMonth.toISOString()
      const isoTwoMin = twoMinAgo.toISOString()
      const isoWeek = sevenDaysAgo.toISOString()

      // 1) Tentar RPC que conta por IP único (e linhas sem IP) — atualiza corretamente com as visitas
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_visitor_stats_by_ip')
      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const row = rpcData[0] as { total?: number; online?: number; hoje?: number; semana?: number; mes?: number }
        const total = Number(row?.total ?? 0)
        const online = Number(row?.online ?? 0)
        const hoje = Number(row?.hoje ?? 0)
        const semana = Number(row?.semana ?? 0)
        const mes = Number(row?.mes ?? 0)
        return NextResponse.json(
          { total, online, hoje, semana, mes },
          { headers: { 'Cache-Control': 'no-store, max-age=0' } }
        )
      }

      // 2) Fallback: contagem por linhas (ts >= início do dia Brasília)
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
      return NextResponse.json(
        { total, online, hoje, semana, mes },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
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
