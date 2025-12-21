import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { gerarNomeBrasileiro } from '@/lib/gerarNomeBrasileiro'

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
    // Por enquanto, permitir qualquer usuário autenticado responder
    // Você pode adicionar verificação de role/admin aqui

    const { user_id, message } = await request.json()

    if (!user_id || !message || !message.trim()) {
      return NextResponse.json(
        { error: 'user_id e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Detectar se é uma nova conversa (primeira vez ou conversa reaberta após ser fechada)
    // Buscar informações da conversa
    const { data: existingConversation, error: fetchError } = await supabase
      .from('chat_conversations')
      .select('closed_at, assigned_agent_name, updated_at, is_closed')
      .eq('user_id', user_id)
      .maybeSingle()

    // Se houver erro diferente de "não encontrado", logar mas continuar
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar conversa:', fetchError)
    }

    // Verificar se é uma nova conversa:
    // 1. Não existe conversa anterior
    // 2. Não existe nome de atendente atribuído ainda (conversa reaberta ou primeira vez)
    let isNewConversation = false
    
    if (!existingConversation) {
      // Primeira conversa deste usuário
      isNewConversation = true
      console.log('✅ Primeira conversa detectada - gerando novo nome')
    } else if (!existingConversation.assigned_agent_name || existingConversation.assigned_agent_name === null) {
      // Não há nome atribuído - é uma nova conversa (pode ser reaberta)
      isNewConversation = true
      console.log('✅ Conversa sem nome atribuído - gerando novo nome')
    } else {
      console.log('ℹ️ Conversa já tem nome atribuído:', existingConversation.assigned_agent_name)
    }

    // Variável para armazenar o nome do atendente gerado
    let nomeAtendenteGerado: string | null = null

    // Se for uma nova conversa, gerar e atribuir um nome brasileiro
    if (isNewConversation) {
      nomeAtendenteGerado = gerarNomeBrasileiro()
      console.log('🎲 Nome gerado:', nomeAtendenteGerado)
      
      try {
        if (existingConversation) {
          // Atualizar conversa existente com novo nome
          const { error: updateError } = await supabase
            .from('chat_conversations')
            .update({ 
              assigned_agent_name: nomeAtendenteGerado,
              is_closed: false // Garantir que está aberta
            } as any)
            .eq('user_id', user_id)
          
          if (updateError) {
            console.error('❌ Erro ao atualizar nome do atendente:', updateError.message, updateError.code)
          } else {
            console.log('✅ Novo nome de atendente atribuído para conversa:', nomeAtendenteGerado)
          }
        } else {
          // Criar nova conversa com nome do atendente
          const insertData: any = {
            user_id: user_id,
            is_closed: false,
            assigned_agent_name: nomeAtendenteGerado
          }
          
          const { error: insertError } = await supabase
            .from('chat_conversations')
            .insert([insertData])
          
          if (insertError) {
            // Se der erro por causa do campo assigned_agent_name, tentar sem ele
            console.error('❌ Erro ao inserir com assigned_agent_name:', insertError.message, insertError.code)
            const { error: retryError } = await supabase
              .from('chat_conversations')
              .insert([{
                user_id: user_id,
                is_closed: false
              }])
            
            if (retryError) {
              console.error('❌ Erro ao inserir conversa sem nome:', retryError.message)
            }
          } else {
            console.log('✅ Novo nome de atendente atribuído:', nomeAtendenteGerado)
          }
        }
      } catch (error: any) {
        // Se der erro (campo não existe), apenas logar e continuar
        console.error('❌ Erro ao salvar nome do atendente:', error?.message || error)
      }
    } else if (existingConversation?.assigned_agent_name) {
      // Se já existe nome, usar o existente
      nomeAtendenteGerado = existingConversation.assigned_agent_name
      console.log('ℹ️ Usando nome existente:', nomeAtendenteGerado)
    }

    // Salvar resposta do suporte
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: user_id,
          message: message.trim(),
          sender_type: 'support',
          is_read: false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar resposta:', error)
      return NextResponse.json(
        { error: 'Erro ao enviar resposta' },
        { status: 500 }
      )
    }

    // Retornar também o nome do atendente para atualização imediata no frontend
    return NextResponse.json({ 
      success: true, 
      data,
      assignedAgentName: nomeAtendenteGerado || existingConversation?.assigned_agent_name || null
    })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao enviar resposta' },
      { status: 500 }
    )
  }
}




