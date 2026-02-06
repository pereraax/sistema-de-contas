import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('user_id, message, sender_type, is_read, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[chat/conversations] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const byUser = new Map<string, { last_message: string; last_message_time: string; unread_count: number; total_messages: number }>()
    for (const m of messages || []) {
      const uid = m.user_id
      if (!byUser.has(uid)) {
        const userMessages = (messages || []).filter((x: any) => x.user_id === uid)
        const last = userMessages[0]
        const unread = userMessages.filter((x: any) => x.sender_type === 'user' && !x.is_read).length
        byUser.set(uid, {
          last_message: last?.message || '',
          last_message_time: last?.created_at || '',
          unread_count: unread,
          total_messages: userMessages.length
        })
      }
    }

    const userIds = Array.from(byUser.keys())
    if (userIds.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, nome')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const conversations = userIds.map((user_id) => {
      const info = byUser.get(user_id)!
      const profile = profileMap.get(user_id)
      return {
        user_id,
        user_email: profile?.email || '',
        user_name: profile?.nome || 'Usuário',
        last_message: info.last_message,
        last_message_time: info.last_message_time,
        unread_count: info.unread_count,
        total_messages: info.total_messages
      }
    })

    conversations.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())

    return NextResponse.json({ conversations })
  } catch (err: any) {
    console.error('[chat/conversations] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao carregar conversas' }, { status: 500 })
  }
}
