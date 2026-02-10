import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { setGuestChatCookie } from '@/lib/chat-guest-cookie'
import { sendEmailChatIniciado } from '@/lib/chat-emails'

export const dynamic = 'force-dynamic'

const AGENT_NAMES = ['Ana Silva', 'Carlos Santos', 'Mariana Costa', 'Rafael Oliveira', 'Julia Mendes']

function randomAgentName() {
  return AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)]
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const nome = (body?.nome || '').trim()
    const email = (body?.email || '').trim()
    const motivo = (body?.motivo || '').trim()

    if (!nome || !email || !email.includes('@') || !motivo) {
      return NextResponse.json(
        { error: 'Nome, e-mail e motivo são obrigatórios' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    // Reutilizar conversa aberta do mesmo visitante, se existir
    const { data: existing } = await admin
      .from('chat_conversations')
      .select('id, assigned_agent_name')
      .eq('guest_email', email)
      .eq('is_closed', false)
      .maybeSingle()

    let convId: string
    let agentName: string

    if (existing) {
      convId = existing.id
      agentName = existing.assigned_agent_name || randomAgentName()
    } else {
      agentName = randomAgentName()
      const { data: newConv, error: errConv } = await admin
        .from('chat_conversations')
        .insert({
          user_id: null,
          guest_email: email,
          guest_name: nome,
          is_closed: false,
          assigned_agent_name: agentName,
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (errConv) {
        console.error('[chat/guest/start] Erro ao criar conversa:', errConv)
        return NextResponse.json({ error: errConv.message }, { status: 500 })
      }
      convId = newConv!.id
    }

    const messageText = `Nome: ${nome}\nEmail: ${email}\nMotivo: ${motivo}`
    const { error: errMsg } = await admin.from('chat_messages').insert({
      user_id: null,
      guest_email: email,
      message: messageText,
      sender_type: 'user'
    })

    if (errMsg) {
      console.error('[chat/guest/start] Erro ao inserir mensagem:', errMsg)
      return NextResponse.json({ error: errMsg.message }, { status: 500 })
    }

    await setGuestChatCookie(email)

    sendEmailChatIniciado(email, nome).catch((e) =>
      console.error('[chat/guest/start] Email falhou:', e)
    )

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[chat/guest/start] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao iniciar chat' }, { status: 500 })
  }
}
