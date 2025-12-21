import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('user_id')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // TODO: Verificar se o usuário é admin/suporte
    // Por enquanto, permitir qualquer usuário autenticado ver mensagens de outros usuários

    // Buscar mensagens do usuário específico
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar mensagens:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens' },
        { status: 500 }
      )
    }

    // Marcar mensagens do usuário como lidas quando o suporte visualizar
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('user_id', targetUserId)
      .eq('sender_type', 'user')
      .eq('is_read', false)

    // Verificar se a conversa está finalizada
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('is_closed')
      .eq('user_id', targetUserId)
      .single()

    const is_closed = conversation?.is_closed || false

    return NextResponse.json({ 
      messages: messages || [],
      is_closed 
    })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao buscar mensagens' },
      { status: 500 }
    )
  }
}

