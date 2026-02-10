import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getGuestEmailFromCookie } from '@/lib/chat-guest-cookie'

export const dynamic = 'force-dynamic'

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

    // Garantir que existe conversa aberta para o visitante
    const { data: conv } = await admin
      .from('chat_conversations')
      .select('id')
      .eq('guest_email', guestEmail)
      .eq('is_closed', false)
      .maybeSingle()

    if (!conv) {
      await admin.from('chat_conversations').insert({
        user_id: null,
        guest_email: guestEmail,
        is_closed: false,
        updated_at: new Date().toISOString()
      })
    } else {
      await admin
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conv.id)
    }

    const { data, error } = await admin
      .from('chat_messages')
      .insert({
        user_id: null,
        guest_email: guestEmail,
        message,
        sender_type: 'user'
      })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('[chat/guest/send] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, created_at: data.created_at })
  } catch (err: any) {
    console.error('[chat/guest/send] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao enviar' }, { status: 500 })
  }
}
