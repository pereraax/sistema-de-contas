import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const userId = body?.user_id

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { error } = await supabase
      .from('chat_conversations')
      .update({ is_closed: true, closed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      console.error('[chat/close] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[chat/close] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao finalizar conversa' }, { status: 500 })
  }
}
