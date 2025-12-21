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

    const { type, message } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      )
    }

    // Salvar mensagem automática do suporte
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: user.id,
          message: message.trim(),
          sender_type: 'support',
          is_read: false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar mensagem automática:', error)
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem automática' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Erro inesperado:', error)
    return NextResponse.json(
      { error: 'Erro inesperado ao enviar mensagem automática' },
      { status: 500 }
    )
  }
}




