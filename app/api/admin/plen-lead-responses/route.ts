/**
 * GET: retorna pares "possíveis mensagens do lead" → "resposta da assistente".
 * PATCH: salva pares. Body: { pairs: { leadPhrases: string[], response: string }[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

const KEY = 'plen_lead_responses'

export interface LeadResponsePair {
  id?: string
  leadPhrases: string[]
  response: string
}

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Backend indisponível' }, { status: 503 })

    const { data, error } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', KEY)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.value) return NextResponse.json({ pairs: [] })

    try {
      const pairs = JSON.parse(data.value as string) as LeadResponsePair[]
      const normalized = Array.isArray(pairs)
        ? pairs.map((p, i) => ({
            id: p.id ?? `pair-${i}`,
            leadPhrases: Array.isArray(p.leadPhrases) ? p.leadPhrases : [p.leadPhrases].filter(Boolean),
            response: typeof p.response === 'string' ? p.response : '',
          }))
        : []
      return NextResponse.json({ pairs: normalized })
    } catch {
      return NextResponse.json({ pairs: [] })
    }
  } catch (e) {
    console.error('[admin/plen-lead-responses] GET', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const pairs = body?.pairs ?? body
    if (!Array.isArray(pairs)) {
      return NextResponse.json({ error: 'Body deve ter "pairs" (array)' }, { status: 400 })
    }

    const normalized: LeadResponsePair[] = pairs.map((p: any, i: number) => ({
      id: p?.id ?? `pair-${i}`,
      leadPhrases: Array.isArray(p?.leadPhrases) ? p.leadPhrases.filter((s: unknown) => typeof s === 'string') : [],
      response: typeof p?.response === 'string' ? p.response : '',
    }))

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Backend indisponível' }, { status: 503 })

    const value = JSON.stringify(normalized)
    const { error } = await supabase
      .from('platform_config')
      .upsert(
        {
          key: KEY,
          value,
          description: 'Pares: possíveis mensagens do lead → resposta da assistente PLEN',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, pairs: normalized })
  } catch (e) {
    console.error('[admin/plen-lead-responses] PATCH', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
