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

    // Verificar se já existe alguma mensagem do usuário
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    // Se já houver mensagens, não enviar mensagem de boas-vindas novamente
    if (existingMessages && existingMessages.length > 0) {
      return NextResponse.json({ success: true, message: 'Chat já iniciado' })
    }

    // Enviar mensagem automática de boas-vindas
    const welcomeMessage = `Olá! 👋\n\nBem-vindo ao nosso suporte! Para começarmos, preciso de algumas informações:\n\n📝 Por favor, me informe:\n• Seu nome completo\n• Seu e-mail\n\nAssim que receber essas informações, poderemos prosseguir! 😊`

    const { data: welcomeData, error: welcomeError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: user.id,
          message: welcomeMessage,
          sender_type: 'support',
          is_read: false
        }
      ])
      .select()
      .single()

    if (welcomeError) {
      console.error('Erro ao enviar mensagem de boas-vindas:', welcomeError)
      return NextResponse.json(
        { error: 'Erro ao iniciar chat' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: welcomeData })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao iniciar chat' },
      { status: 500 }
    )
  }
}




