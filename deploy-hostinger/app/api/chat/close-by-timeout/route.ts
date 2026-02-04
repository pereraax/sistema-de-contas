import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos
const CLOSURE_MESSAGE =
  'Esta conversa foi finalizada por inatividade. Se precisar de mais ajuda, abra um novo ticket. Obrigado! 👋'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { data: conv } = await admin
      .from('chat_conversations')
      .select('is_closed')
      .eq('user_id', user.id)
      .single()

    if (conv?.is_closed) {
      return NextResponse.json({ ok: true, alreadyClosed: true })
    }

    const { data: lastMessages } = await admin
      .from('chat_messages')
      .select('id, sender_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const last = lastMessages?.[0]
    if (!last || last.sender_type !== 'support') {
      return NextResponse.json({ ok: true })
    }

    const lastAt = new Date(last.created_at).getTime()
    const now = Date.now()
    if (now - lastAt < TIMEOUT_MS) {
      return NextResponse.json({ ok: true, tooEarly: true })
    }

    await admin
      .from('chat_conversations')
      .update({
        is_closed: true,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    await admin.from('chat_messages').insert({
      user_id: user.id,
      message: CLOSURE_MESSAGE,
      sender_type: 'support'
    })

    return NextResponse.json({ ok: true, closed: true })
  } catch (err: any) {
    console.error('[chat/close-by-timeout] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao encerrar' }, { status: 500 })
  }
}
