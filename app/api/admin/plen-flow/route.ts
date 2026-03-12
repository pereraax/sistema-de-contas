/**
 * GET: retorna todas as mensagens do fluxo PLEN (para o painel Assistente Plen).
 * PATCH: salva mensagens (body: PlenFlowMessages). Requer admin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'
import type { PlenFlowMessages } from '@/lib/plen/flow-messages'

const PLATFORM_CONFIG_KEY = 'plen_flow_messages'

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Backend indisponível' }, { status: 503 })

    const { data, error } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', PLATFORM_CONFIG_KEY)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data?.value) return NextResponse.json({ messages: null })

    try {
      const messages =
        typeof data.value === 'string'
          ? (JSON.parse(data.value) as PlenFlowMessages)
          : (data.value as PlenFlowMessages)
      return NextResponse.json({ messages })
    } catch {
      return NextResponse.json({ messages: null })
    }
  } catch (e) {
    console.error('[admin/plen-flow] GET', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const messages = body?.messages ?? body
    if (typeof messages !== 'object' || messages === null) {
      return NextResponse.json({ error: 'Body deve ter "messages" (objeto)' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Backend indisponível' }, { status: 503 })

    const value = JSON.stringify(messages)
    const { error } = await supabase
      .from('platform_config')
      .upsert(
        {
          key: PLATFORM_CONFIG_KEY,
          value,
          description: 'Mensagens do fluxo Assistente PLEN (editáveis no painel)',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, messages: value })
  } catch (e) {
    console.error('[admin/plen-flow] PATCH', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
