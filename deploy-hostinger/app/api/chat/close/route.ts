import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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
    // Por enquanto, permitir qualquer usuário autenticado finalizar conversas

    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a conversa já existe (sem usar .single() para evitar erro se não existir)
    const { data: existingConversationData, error: fetchError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle()

    // Se houver erro diferente de "não encontrado", retornar erro
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar conversa:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar conversa: ' + fetchError.message },
        { status: 500 }
      )
    }

    const existingConversation = existingConversationData

    if (existingConversation) {
      // Atualizar conversa existente e limpar nome do atendente
      const updateData: any = {
        is_closed: true,
        closed_at: new Date().toISOString(),
        closed_by: user.id,
        updated_at: new Date().toISOString(),
        assigned_agent_name: null // Limpar nome do atendente ao fechar conversa
      }

      const { data, error } = await supabase
        .from('chat_conversations')
        .update(updateData)
        .eq('user_id', user_id)
        .select()
        .maybeSingle()

      if (error) {
        console.error('Erro ao finalizar conversa:', error)
        
        // Se o erro for por causa do campo assigned_agent_name não existir, tentar sem ele
        if (error.message?.includes('assigned_agent_name') || error.code === '42703') {
          console.log('Campo assigned_agent_name não existe, tentando sem ele...')
          const updateDataWithoutName = {
            is_closed: true,
            closed_at: new Date().toISOString(),
            closed_by: user.id,
            updated_at: new Date().toISOString()
          }
          
          const { data: retryData, error: retryError } = await supabase
            .from('chat_conversations')
            .update(updateDataWithoutName)
            .eq('user_id', user_id)
            .select()
            .maybeSingle()
          
          if (retryError) {
            return NextResponse.json(
              { error: 'Erro ao finalizar conversa: ' + retryError.message },
              { status: 500 }
            )
          }
          
          return NextResponse.json({ success: true, data: retryData || existingConversation })
        }
        
        return NextResponse.json(
          { error: 'Erro ao finalizar conversa: ' + error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: data || existingConversation })
    } else {
      // Criar nova entrada de conversa finalizada
      const insertData: any = {
        user_id: user_id,
        is_closed: true,
        closed_at: new Date().toISOString(),
        closed_by: user.id
      }

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert([insertData])
        .select()
        .maybeSingle()

      if (error) {
        console.error('Erro ao criar conversa finalizada:', error)
        return NextResponse.json(
          { error: 'Erro ao finalizar conversa: ' + error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: data || { user_id, is_closed: true } })
    }
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao finalizar conversa' },
      { status: 500 }
    )
  }
}




