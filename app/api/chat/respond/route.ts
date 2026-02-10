import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmailNovaMensagemSuporte } from '@/lib/chat-emails'

const GUEST_PREFIX = 'guest:'
const NOMES_ATENDENTES = ['Ana Silva', 'Carlos Santos', 'Mariana Costa', 'Rafael Oliveira', 'Julia Mendes']

function nomeFicticioAtendente(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
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

    const isGuest = userId.startsWith(GUEST_PREFIX)
    const guestEmail = isGuest ? userId.slice(GUEST_PREFIX.length) : null

    const nomeExibido = nomeFicticioAtendente(userId)

    if (isGuest && guestEmail) {
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('guest_email', guestEmail)
        .eq('is_closed', false)
        .maybeSingle()
      if (existing) {
        await supabase
          .from('chat_conversations')
          .update({ assigned_agent_name: nomeExibido, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase.from('chat_conversations').insert({
          user_id: null,
          guest_email: guestEmail,
          is_closed: false,
          assigned_agent_name: nomeExibido,
          updated_at: new Date().toISOString()
        })
      }
      const { error } = await supabase.from('chat_messages').insert({
        user_id: null,
        guest_email: guestEmail,
        message,
        sender_type: 'support'
      })
      if (error) {
        console.error('[chat/respond] Erro:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      const nome = (guestEmail || '').split('@')[0] || 'Visitante'
      sendEmailNovaMensagemSuporte(guestEmail, nome).catch((e) =>
        console.error('[chat/respond] Email de notificação falhou:', e)
      )
      return NextResponse.json({ ok: true })
    }

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
