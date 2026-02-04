import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const TIMEOUT_MS = 5 * 60 * 1000 // 5 minutos para o usuário responder ao atendente
const CLOSURE_MESSAGE =
  'Esta conversa foi finalizada por inatividade. Se precisar de mais ajuda, abra um novo ticket. Obrigado! 👋'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, message, sender_type, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[chat/messages] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verificar se a conversa está fechada e obter nome do atendente
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('is_closed, assigned_agent_name')
      .eq('user_id', user.id)
      .single()

    // Se conversa aberta e última mensagem é do suporte há mais de 5 min, encerrar por timeout
    const list = messages || []
    if (!conv?.is_closed && list.length > 0) {
      const last = list[list.length - 1]
      if (last.sender_type === 'support') {
        const lastAt = new Date(last.created_at).getTime()
        if (Date.now() - lastAt >= TIMEOUT_MS) {
          const admin = createAdminClient()
          if (admin) {
            await admin
              .from('chat_conversations')
              .update({
                is_closed: true,
                closed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
            await admin.from('chat_messages').insert({
              user_id: user.id,
              message: CLOSURE_MESSAGE,
              sender_type: 'support'
            })
            // Rebuscar mensagens para incluir a de encerramento
            const { data: updated } = await supabase
              .from('chat_messages')
              .select('id, message, sender_type, is_read, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true })
            return NextResponse.json({
              messages: updated || [],
              isClosed: true,
              assignedAgentName: null
            })
          }
        }
      }
    }

    return NextResponse.json({
      messages: list,
      isClosed: conv?.is_closed ?? false,
      assignedAgentName: conv?.assigned_agent_name ?? null
    })
  } catch (err: any) {
    console.error('[chat/messages] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao carregar mensagens' }, { status: 500 })
  }
}
