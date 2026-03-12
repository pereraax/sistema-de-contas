/**
 * POST: Cria ou atualiza o "Fluxo oficial Plen" no Chatbot Builder.
 * Insere o fluxo completo (blocos 1–21) conectados no canvas.
 * Requer autenticação admin.
 */

import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { getOfficialPlenFlow, OFFICIAL_FLOW_NAME } from '@/lib/plen/chatbot-official-flow'

export async function POST() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: 'Backend indisponível' }, { status: 503 })

    const { nodes, edges } = getOfficialPlenFlow()
    const estrutura_json = { nodes, edges }

    const { data: existing } = await supabase
      .from('chatbot_flows')
      .select('id')
      .ilike('nome', OFFICIAL_FLOW_NAME)
      .maybeSingle()

    if (existing?.id) {
      await supabase.from('chatbot_flows').update({ ativo: false }).neq('id', existing.id)
      const { data, error } = await supabase
        .from('chatbot_flows')
        .update({
          nome: OFFICIAL_FLOW_NAME,
          estrutura_json,
          ativo: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, nome')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, flow: data, updated: true })
    }

    await supabase.from('chatbot_flows').update({ ativo: false })
    const { data, error } = await supabase
      .from('chatbot_flows')
      .insert({
        nome: OFFICIAL_FLOW_NAME,
        descricao: 'Fluxo oficial da assistente Plen: lead → teste gasto → cadastro → confirmação email → tutorial → menu → IA + regras.',
        estrutura_json,
        ativo: true,
      })
      .select('id, nome')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, flow: data, updated: false })
  } catch (e) {
    console.error('[chatbot-flows/seed-official]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
