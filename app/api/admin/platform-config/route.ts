/**
 * GET /api/admin/platform-config?key=xxx
 * Lê valor da tabela platform_config (ex.: facebook_pixel_id, facebook_pixel_token).
 * Usado pelo useFacebookPixel no cliente. Retorna 404 se a chave não existir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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
