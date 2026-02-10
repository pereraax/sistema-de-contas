import { NextRequest, NextResponse } from 'next/server'
import { addVisit } from '@/lib/visitor-store'
import { createAdminClient } from '@/lib/supabase/server'

/** Obtém IP do visitante (uma pessoa = um IP para contagem única). */
function getVisitorIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first.slice(0, 45) // limite razoável
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real.slice(0, 45)
  const cf = request.headers.get('cf-connecting-ip')
  if (cf) return cf.slice(0, 45)
  return null
}

/**
 * Rastreamento de visitantes: persiste no Supabase (visitor_hits) com IP único.
 * Visitantes Hoje e Visitantes Online contam 1 por IP (pessoa única), em tempo real.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const path = (body?.path ?? request.nextUrl?.pathname ?? 'unknown').slice(0, 500)
    const visitor_ip = getVisitorIp(request)

    addVisit(path)

    const supabase = createAdminClient()
    if (supabase) {
      await supabase.from('visitor_hits').insert({
        path,
        ts: new Date().toISOString(),
        ...(visitor_ip && { visitor_ip }),
      })
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

