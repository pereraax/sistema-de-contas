/**
 * GET: retorna configurações avançadas da Assistente Plen.
 * PATCH: salva configurações (body: PlenConfig). Requer admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

const KEY = 'plen_config'

export interface PlenConfig {
  delayMinSec?: number
  delayMaxSec?: number
  limiteRegistros?: number
  reengajamentoAtivo?: boolean
  reengajamentoInatividadeHoras?: number
  reengajamentoIntervaloHoras?: number
  lembretesAtivo?: boolean
  antiLoopMaxRespostas?: number
  antiLoopBloqueioMinutos?: number
}

const DEFAULTS: PlenConfig = {
  delayMinSec: 1.5,
  delayMaxSec: 5,
  limiteRegistros: 10,
  reengajamentoAtivo: true,
  reengajamentoInatividadeHoras: 24,
  reengajamentoIntervaloHoras: 72,
  lembretesAtivo: true,
  antiLoopMaxRespostas: 3,
  antiLoopBloqueioMinutos: 5,
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

    if (error || !data?.value) return NextResponse.json({ config: DEFAULTS })

    try {
      const config = { ...DEFAULTS, ...JSON.parse(data.value as string) } as PlenConfig
      return NextResponse.json({ config })
    } catch {
      return NextResponse.json({ config: DEFAULTS })
    }
  } catch (e) {
    console.error('[admin/plen-config] GET', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const config = body?.config ?? body
    if (typeof config !== 'object' || config === null) {
      return NextResponse.json({ error: 'Body deve ter "config" (objeto)' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Backend indisponível' }, { status: 503 })

    const value = JSON.stringify({ ...DEFAULTS, ...config })
    const { error } = await supabase
      .from('platform_config')
      .upsert(
        { key: KEY, value, description: 'Configurações avançadas Assistente PLEN', updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, config: JSON.parse(value) })
  } catch (e) {
    console.error('[admin/plen-config] PATCH', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
