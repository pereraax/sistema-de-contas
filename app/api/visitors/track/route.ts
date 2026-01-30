import { NextRequest, NextResponse } from 'next/server'
import { addVisit } from '@/lib/visitor-store'

/**
 * Rastreamento de visitantes: persiste em memória para /api/visitors/stats.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = body?.path ?? request.nextUrl?.pathname ?? 'unknown'

    addVisit(path)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [VISITOR] Erro ao rastrear visita:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao rastrear visita.' },
      { status: 500 }
    )
  }
}

