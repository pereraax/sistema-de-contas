/**
 * GET: lista fluxos do Chatbot Builder.
 * POST: cria ou atualiza um fluxo (body: { nome, estrutura_json, id? }).
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Backend indisponível' }, { status: 503 })

    const { searchParams } = new URL(request.url)
    const loadActive = searchParams.get('ativo') === 'true'
    const loadId = searchParams.get('id')

    if (loadActive || loadId) {
      let query = supabase.from('chatbot_flows').select('id, nome, descricao, ativo, estrutura_json, created_at, updated_at')
      if (loadId) query = query.eq('id', loadId)
      else query = query.eq('ativo', true).order('updated_at', { ascending: false }).limit(1)
      const { data, error } = await query.maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data ? { flow: data } : { flow: null })
    }

    const { data, error } = await supabase
      .from('chatbot_flows')
      .select('id, nome, descricao, ativo, created_at, updated_at')
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ flows: data ?? [] })
  } catch (e) {
    console.error('[chatbot-flows] GET', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Backend indisponível' }, { status: 503 })

    const body = await request.json().catch(() => ({}))
    const { id, nome, descricao, estrutura_json } = body
    const nomeStr = typeof nome === 'string' ? nome.trim() : 'Novo fluxo'
    const estrutura =
      estrutura_json && typeof estrutura_json === 'object'
        ? estrutura_json
        : { nodes: [], edges: [] }

    // Ao salvar, este fluxo vira o ativo (único que a Plen executa)
    const flowId = id && typeof id === 'string' ? id : null

    if (flowId) {
      await supabase.from('chatbot_flows').update({ ativo: false }).neq('id', flowId)
      const { data, error } = await supabase
        .from('chatbot_flows')
        .update({
          nome: nomeStr,
          descricao: typeof descricao === 'string' ? descricao : null,
          estrutura_json: estrutura,
          ativo: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', flowId)
        .select('id, nome')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    await supabase.from('chatbot_flows').update({ ativo: false })
    const { data, error } = await supabase
      .from('chatbot_flows')
      .insert({
        nome: nomeStr,
        descricao: typeof descricao === 'string' ? descricao : null,
        estrutura_json: estrutura,
        ativo: true,
      })
      .select('id, nome')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('[chatbot-flows] POST', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
