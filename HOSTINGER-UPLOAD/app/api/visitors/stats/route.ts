import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Obter total de visitantes únicos por IP (todos os tempos)
    const { data: allVisitors, error: errorTotal } = await supabase
      .from('visitantes')
      .select('ip_address')

    let totalVisitantes = 0
    if (allVisitors && !errorTotal) {
      // Contar IPs únicos
      const uniqueIPs = new Set(allVisitors.map(v => v.ip_address).filter(ip => ip && ip !== 'unknown'))
      totalVisitantes = uniqueIPs.size
    }

    // Obter visitantes online (IPs únicos com atividade nos últimos 2 minutos)
    const doisMinutosAtras = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: activeSessions, error: errorOnline } = await supabase
      .from('sessoes_ativas')
      .select('ip_address')
      .gte('last_activity_at', doisMinutosAtras)

    let visitantesOnline = 0
    if (activeSessions && !errorOnline) {
      // Contar IPs únicos online
      const uniqueOnlineIPs = new Set(activeSessions.map(s => s.ip_address).filter(ip => ip && ip !== 'unknown'))
      visitantesOnline = uniqueOnlineIPs.size
    }

    // Obter visitantes hoje (IPs únicos)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const { data: visitorsHoje, error: errorHoje } = await supabase
      .from('visitantes')
      .select('ip_address')
      .gte('first_visit_at', hoje.toISOString())

    let visitantesHoje = 0
    if (visitorsHoje && !errorHoje) {
      const uniqueIPsHoje = new Set(visitorsHoje.map(v => v.ip_address).filter(ip => ip && ip !== 'unknown'))
      visitantesHoje = uniqueIPsHoje.size
    }

    // Obter visitantes esta semana (IPs únicos)
    const umaSemanaAtras = new Date()
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7)
    const { data: visitorsSemana, error: errorSemana } = await supabase
      .from('visitantes')
      .select('ip_address')
      .gte('first_visit_at', umaSemanaAtras.toISOString())

    let visitantesSemana = 0
    if (visitorsSemana && !errorSemana) {
      const uniqueIPsSemana = new Set(visitorsSemana.map(v => v.ip_address).filter(ip => ip && ip !== 'unknown'))
      visitantesSemana = uniqueIPsSemana.size
    }

    // Obter visitantes este mês (IPs únicos)
    const umMesAtras = new Date()
    umMesAtras.setMonth(umMesAtras.getMonth() - 1)
    const { data: visitorsMes, error: errorMes } = await supabase
      .from('visitantes')
      .select('ip_address')
      .gte('first_visit_at', umMesAtras.toISOString())

    let visitantesMes = 0
    if (visitorsMes && !errorMes) {
      const uniqueIPsMes = new Set(visitorsMes.map(v => v.ip_address).filter(ip => ip && ip !== 'unknown'))
      visitantesMes = uniqueIPsMes.size
    }

    return NextResponse.json({
      total: totalVisitantes,
      online: visitantesOnline,
      hoje: visitantesHoje,
      semana: visitantesSemana,
      mes: visitantesMes,
    })
  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas', details: error.message },
      { status: 500 }
    )
  }
}









