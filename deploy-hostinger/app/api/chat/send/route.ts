import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Recebendo requisição de envio de mensagem...')
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ Usuário não autenticado')
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    console.log('✅ Usuário autenticado:', user.id)

    const { message } = await request.json()
    console.log('📝 Mensagem recebida:', message?.substring(0, 100) + '...')

    if (!message || !message.trim()) {
      console.error('❌ Mensagem vazia')
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      )
    }

    // Verificar se é a primeira mensagem do usuário (ANTES de salvar a mensagem atual)
    const { data: existingMessages, error: checkError } = await supabase
      .from('chat_messages')
      .select('id, sender_type, message')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (checkError) {
      console.error('Erro ao verificar mensagens existentes:', checkError)
    }

    const isFirstMessage = !existingMessages || existingMessages.length === 0
    const hasWelcomeMessage = existingMessages?.some(
      msg => msg.sender_type === 'support' && 
      (msg.message.includes('Olá!') || msg.message.includes('Bem-vindo') || msg.message.includes('nome') || msg.message.includes('email'))
    )
    const hasHelpQuestion = existingMessages?.some(
      msg => msg.sender_type === 'support' && 
      (msg.message.includes('ajudar') || msg.message.includes('dúvida') || msg.message.includes('problema'))
    )

    // Verificar se a conversa está finalizada e reabrir se o usuário enviar mensagem
    const { data: conversation, error: conversationError } = await supabase
      .from('chat_conversations')
      .select('is_closed')
      .eq('user_id', user.id)
      .single()

    // Se não encontrar conversa, não é um erro - pode ser a primeira vez
    const wasClosed = conversation?.is_closed || false

    // Se a conversa estiver finalizada, reabrir automaticamente
    if (wasClosed) {
      console.log('🔄 Reabrindo conversa finalizada...')
      
      // Tentar atualizar ou criar entrada de conversa e limpar nome do atendente para gerar novo nome
      const { error: reopenError } = await supabase
        .from('chat_conversations')
        .upsert({
          user_id: user.id,
          is_closed: false,
          closed_at: null,
          closed_by: null,
          assigned_agent_name: null, // Limpar nome para gerar novo quando suporte responder
          updated_at: new Date().toISOString()
        } as any, { onConflict: 'user_id' })

      if (reopenError) {
        console.error('❌ Erro ao reabrir conversa:', reopenError)
        // Não falhar o envio da mensagem por causa disso
      } else {
        console.log('✅ Conversa reaberta com sucesso')
      }
    }

    // Salvar mensagem do usuário no banco
    console.log('💾 Salvando mensagem no banco...')
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: user.id,
          message: message.trim(),
          sender_type: 'user',
          is_read: false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao salvar mensagem:', error)
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Mensagem salva com sucesso:', data?.id)

    // Não enviar mensagem automática aqui - isso só acontece quando o botão "Iniciar Chat" é clicado
    // A mensagem de boas-vindas é enviada pela rota /api/chat/start 
    
    // Verificar se a mensagem contém informações do formulário (nome, email, motivo)
    const messageText = message.trim()
    const hasFormData = messageText.includes('Nome:') && messageText.includes('Email:') && messageText.includes('Motivo:')
    
    // Se a mensagem contém dados do formulário, não enviar mensagem automática adicional
    // A mensagem de confirmação já foi enviada pelo frontend
    
    // Se a conversa estava finalizada e foi reaberta (e não é primeira mensagem e não tem dados do formulário), enviar mensagem de reabertura
    if (wasClosed && !isFirstMessage && !hasFormData) {
      const reopenMessage = `Olá! Vejo que você enviou uma nova mensagem. Reabri esta conversa para você! 😊\n\nComo posso ajudá-lo hoje?`
      
      const { error: reopenError } = await supabase
        .from('chat_messages')
        .insert([
          {
            user_id: user.id,
            message: reopenMessage,
            sender_type: 'support',
            is_read: false
          }
        ])

      if (reopenError) {
        console.error('Erro ao enviar mensagem de reabertura:', reopenError)
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao enviar mensagem' },
      { status: 500 }
    )
  }
}

