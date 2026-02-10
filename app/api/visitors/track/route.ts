import { NextRequest, NextResponse } from 'next/server'
import { addVisit } from '@/lib/visitor-store'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Rastreamento de visitantes: persiste no Supabase (visitor_hits) e em memória como fallback.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = (body?.path ?? request.nextUrl?.pathname ?? 'unknown').slice(0, 500)

    addVisit(path)

    const supabase = createAdminClient()
    if (supabase) {
      await supabase.from('visitor_hits').insert({ path, ts: new Date().toISOString() })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ [VISITOR] Erro ao rastrear visita:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao rastrear visita.' },
      { status: 500 }
    )
  }
}

