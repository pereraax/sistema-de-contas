import { NextResponse } from 'next/server'
import { getStats } from '@/lib/visitor-store'

export const dynamic = 'force-dynamic'

export async function GET() {
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
