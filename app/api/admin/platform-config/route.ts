/**
 * GET /api/admin/platform-config?key=xxx
 * Lê valor da tabela platform_config (ex.: facebook_pixel_id, facebook_pixel_token).
 * Usado pelo useFacebookPixel no cliente. Retorna 404 se a chave não existir.
 *
 * PATCH /api/admin/platform-config
 * Body: { key: string, value: string }. Salva ou atualiza o valor (requer admin).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/admin-middleware'

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key')
    if (!key || typeof key !== 'string' || !key.trim()) {
      return NextResponse.json({ error: 'Query param key é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Backend não configurado' }, { status: 503 })
    }

    const { data, error } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', key.trim())
      .maybeSingle()

    if (error) {
      console.error('[admin/platform-config GET]', error.message)
      return NextResponse.json({ error: 'Erro ao consultar' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Chave não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ value: data.value ?? '' })
  } catch (e) {
    console.error('[admin/platform-config GET]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const key = typeof body?.key === 'string' ? body.key.trim() : ''
    const value = typeof body?.value === 'string' ? body.value : String(body?.value ?? '')

    if (!key) {
      return NextResponse.json({ error: 'Body deve ter "key" (string)' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Backend não configurado' }, { status: 503 })
    }

    const { error } = await supabase
      .from('platform_config')
      .upsert(
        { key, value, description: `Configuração ${key}`, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('[admin/platform-config PATCH]', error.message)
      return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, key, value })
  } catch (e) {
    console.error('[admin/platform-config PATCH]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
