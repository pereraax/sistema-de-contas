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

    // TODO: Verificar se o usuário é admin/suporte
    // Por enquanto, permitir qualquer usuário autenticado ver conversas

    // Buscar todas as conversas usando a função SQL
    const { data: conversations, error } = await supabase
      .rpc('get_chat_conversations')

    if (error) {
      console.error('Erro ao buscar conversas:', error)
      
      // Fallback: buscar manualmente se a função RPC não existir
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          user_id,
          message,
          created_at,
          sender_type,
          is_read,
          profiles:user_id (
            email,
            nome
          )
        `)
        .order('created_at', { ascending: false })

      if (messagesError) {
        return NextResponse.json(
          { error: 'Erro ao buscar conversas' },
          { status: 500 }
        )
      }

      // Agrupar mensagens por usuário
      const conversationsMap = new Map()
      messages?.forEach((msg: any) => {
        if (!conversationsMap.has(msg.user_id)) {
          conversationsMap.set(msg.user_id, {
            user_id: msg.user_id,
            user_email: msg.profiles?.email || 'N/A',
            user_name: msg.profiles?.nome || 'Usuário',
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
            total_messages: 0
          })
        }
        const conv = conversationsMap.get(msg.user_id)
        conv.total_messages++
        if (!msg.is_read && msg.sender_type === 'user') {
          conv.unread_count++
        }
        if (new Date(msg.created_at) > new Date(conv.last_message_time)) {
          conv.last_message = msg.message
          conv.last_message_time = msg.created_at
        }
      })

      return NextResponse.json({ 
        conversations: Array.from(conversationsMap.values()) 
      })
    }

    return NextResponse.json({ conversations: conversations || [] })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao buscar conversas' },
      { status: 500 }
    )
  }
}




