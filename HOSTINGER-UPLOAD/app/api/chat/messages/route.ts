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

    // Buscar mensagens do usuário
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar mensagens:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens' },
        { status: 500 }
      )
    }

    // Verificar se a conversa está finalizada e buscar nome do atendente
    let isClosed = false
    let assignedAgentName: string | null = null
    
    try {
      // Tentar buscar conversa com todos os campos
      const { data: conversation, error: conversationError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // Se houver erro diferente de "não encontrado", logar mas continuar
      if (conversationError && conversationError.code !== 'PGRST116') {
        console.error('Erro ao buscar conversa:', conversationError)
      }

      if (conversation) {
        isClosed = conversation.is_closed || false
        // Tentar pegar assigned_agent_name se existir (campo pode não existir ainda no banco)
        if ('assigned_agent_name' in conversation && conversation.assigned_agent_name) {
          assignedAgentName = conversation.assigned_agent_name
          console.log('📋 Nome do atendente encontrado no banco:', assignedAgentName)
        } else {
          console.log('ℹ️ Conversa encontrada mas sem nome de atendente atribuído')
        }
      } else {
        console.log('ℹ️ Nenhuma conversa encontrada para este usuário')
      }
    } catch (error: any) {
      // Se der erro ao buscar (campo não existe ou tabela não tem dados), usar valores padrão
      console.error('Erro ao buscar conversa:', error?.message || error)
      isClosed = false
      assignedAgentName = null
    }

    return NextResponse.json({ 
      messages: messages || [],
      isClosed,
      assignedAgentName
    })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao buscar mensagens' },
      { status: 500 }
    )
  }
}

