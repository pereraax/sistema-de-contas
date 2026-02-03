import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmailChatIniciado } from '@/lib/chat-emails'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const message = (body?.message || '').trim()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    // Garantir que existe uma conversa (aberta) para o usuário
    const admin = createAdminClient()
    if (admin) {
      await admin.from('chat_conversations').upsert(
        { user_id: user.id, is_closed: false, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }

    // Verificar se é a primeira mensagem do usuário (novo chamado) antes de inserir
    const { count: countAntes } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('sender_type', 'user')
    const ehNovoChamado = countAntes === 0

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        message,
        sender_type: 'user'
      })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('[chat/send] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Se for novo chamado, enviar email "Chat iniciado"
    if (ehNovoChamado && user.email) {
      let nome = user.user_metadata?.nome?.trim() || user.email.split('@')[0] || 'Cliente'
      if (admin) {
        const { data: profile } = await admin.from('profiles').select('nome').eq('id', user.id).single()
        if (profile?.nome) nome = profile.nome.trim()
      }
      sendEmailChatIniciado(user.email, nome).catch((e) =>
        console.error('[chat/send] Email "Chat iniciado" falhou:', e)
      )
    }

    return NextResponse.json({ id: data.id, created_at: data.created_at })
  } catch (err: any) {
    console.error('[chat/send] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
