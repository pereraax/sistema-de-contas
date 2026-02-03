import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const AGENT_NAMES = ['Ana Silva', 'Carlos Santos', 'Mariana Costa', 'Rafael Oliveira', 'Julia Mendes']

function randomAgentName() {
  return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)]
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const type = body?.type || 'info'
    const message = (body?.message || '').trim()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    // Atribuir nome do atendente na primeira mensagem automática da conversa
    const { data: conv } = await admin.from('chat_conversations').select('assigned_agent_name').eq('user_id', user.id).single()
    let agentName = conv?.assigned_agent_name
    if (!agentName) {
      agentName = randomAgentName()
      await admin.from('chat_conversations').upsert(
        { user_id: user.id, is_closed: false, assigned_agent_name: agentName, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }

    const { error } = await admin.from('chat_messages').insert({
      user_id: user.id,
      message,
      sender_type: 'support'
    })

    if (error) {
      console.error('[chat/send-automatic] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[chat/send-automatic] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao enviar' }, { status: 500 })
  }
}
