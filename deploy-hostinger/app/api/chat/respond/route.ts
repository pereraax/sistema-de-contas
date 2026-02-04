import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmailNovaMensagemSuporte } from '@/lib/chat-emails'

// Nomes fictícios para exibir ao usuário (nunca o nome real do administrador)
const NOMES_ATENDENTES = ['Ana Silva', 'Carlos Santos', 'Mariana Costa', 'Rafael Oliveira', 'Julia Mendes']

function nomeFicticioAtendente(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % NOMES_ATENDENTES.length
  return NOMES_ATENDENTES[index]
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const userId = body?.user_id
    const message = (body?.message || '').trim()

    if (!userId || !message) {
      return NextResponse.json({ error: 'user_id e message são obrigatórios' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const nomeExibido = nomeFicticioAtendente(userId)
    await supabase.from('chat_conversations').upsert(
      { user_id: userId, is_closed: false, assigned_agent_name: nomeExibido, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

    const { error } = await supabase.from('chat_messages').insert({
      user_id: userId,
      message,
      sender_type: 'support'
    })

    if (error) {
      console.error('[chat/respond] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notificar o usuário por email (não bloqueia a resposta)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, nome')
      .eq('id', userId)
      .single()
    if (profile?.email) {
      const nome = profile.nome?.trim() || profile.email.split('@')[0] || 'Cliente'
      sendEmailNovaMensagemSuporte(profile.email, nome).catch((e) =>
        console.error('[chat/respond] Email de notificação falhou:', e)
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[chat/respond] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao responder' }, { status: 500 })
  }
}
