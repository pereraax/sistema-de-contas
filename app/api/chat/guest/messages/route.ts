import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getGuestEmailFromCookie } from '@/lib/chat-guest-cookie'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const guestEmail = await getGuestEmailFromCookie()
    if (!guestEmail) {
      return NextResponse.json({ error: 'Sessão de visitante inválida' }, { status: 401 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { data: messages, error } = await admin
      .from('chat_messages')
      .select('id, message, sender_type, is_read, created_at')
      .eq('guest_email', guestEmail)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[chat/guest/messages] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: conv } = await admin
      .from('chat_conversations')
      .select('is_closed, assigned_agent_name')
      .eq('guest_email', guestEmail)
      .eq('is_closed', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: convAny } = await admin
      .from('chat_conversations')
      .select('is_closed')
      .eq('guest_email', guestEmail)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      messages: messages || [],
      isClosed: convAny?.is_closed ?? false,
      assignedAgentName: conv?.assigned_agent_name ?? null
    })
  } catch (err: any) {
    console.error('[chat/guest/messages] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao carregar mensagens' }, { status: 500 })
  }
}
