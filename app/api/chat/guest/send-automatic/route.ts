import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getGuestEmailFromCookie } from '@/lib/chat-guest-cookie'

export const dynamic = 'force-dynamic'

const AGENT_NAMES = ['Ana Silva', 'Carlos Santos', 'Mariana Costa', 'Rafael Oliveira', 'Julia Mendes']

function randomAgentName() {
  return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)]
}

export async function POST(request: Request) {
  try {
    const guestEmail = await getGuestEmailFromCookie()
    if (!guestEmail) {
      return NextResponse.json({ error: 'Sessão de visitante inválida' }, { status: 401 })
    }

    const body = await request.json()
    const message = (body?.message || '').trim()
    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { data: conv } = await admin
      .from('chat_conversations')
      .select('id, assigned_agent_name')
      .eq('guest_email', guestEmail)
      .eq('is_closed', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let agentName = conv?.assigned_agent_name
    if (!agentName) {
      agentName = randomAgentName()
      if (conv) {
        await admin
          .from('chat_conversations')
          .update({ assigned_agent_name: agentName, updated_at: new Date().toISOString() })
          .eq('id', conv.id)
      } else {
        await admin.from('chat_conversations').insert({
          user_id: null,
          guest_email: guestEmail,
          is_closed: false,
          assigned_agent_name: agentName,
          updated_at: new Date().toISOString()
        })
      }
    }

    const { error } = await admin.from('chat_messages').insert({
      user_id: null,
      guest_email: guestEmail,
      message,
      sender_type: 'support'
    })

    if (error) {
      console.error('[chat/guest/send-automatic] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[chat/guest/send-automatic] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao enviar' }, { status: 500 })
  }
}
