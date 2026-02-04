import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, user_id, message, sender_type, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[chat/user-messages] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('is_closed')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      messages: messages || [],
      is_closed: conv?.is_closed ?? false
    })
  } catch (err: any) {
    console.error('[chat/user-messages] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao carregar mensagens' }, { status: 500 })
  }
}
