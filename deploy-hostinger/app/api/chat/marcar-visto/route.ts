import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Marca todas as mensagens do usuário (sender_type = 'user') como lidas.
 * Chamado quando o atendente abre a conversa no painel de suporte.
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const userId = body?.user_id
    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_type', 'user')

    if (error) {
      console.error('[chat/marcar-visto] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[chat/marcar-visto] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao marcar como lido' }, { status: 500 })
  }
}
