import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

const GUEST_PREFIX = 'guest:'

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
      .select('user_id, guest_email, message, sender_type, is_read, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[chat/conversations] Erro:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const byKey = new Map<string, { last_message: string; last_message_time: string; unread_count: number; total_messages: number }>()
    for (const m of messages || []) {
      const key = m.user_id != null ? m.user_id : (m.guest_email ? GUEST_PREFIX + m.guest_email : null)
      if (key == null) continue
      if (!byKey.has(key)) {
        const isSame = (x: any) =>
          key.startsWith(GUEST_PREFIX)
            ? x.user_id == null && x.guest_email === key.slice(GUEST_PREFIX.length)
            : x.user_id === key
        const userMessages = (messages || []).filter(isSame)
        const last = userMessages[0]
        const unread = userMessages.filter((x: any) => x.sender_type === 'user' && !x.is_read).length
        byKey.set(key, {
          last_message: last?.message || '',
          last_message_time: last?.created_at || '',
          unread_count: unread,
          total_messages: userMessages.length
        })
      }
    }

    const keys = Array.from(byKey.keys())
    const userIds = keys.filter((k) => !k.startsWith(GUEST_PREFIX))
    const guestEmails = keys.filter((k) => k.startsWith(GUEST_PREFIX)).map((k) => k.slice(GUEST_PREFIX.length))

    const conversations: Array<{
      user_id: string
      user_email: string
      user_name: string
      last_message: string
      last_message_time: string
      unread_count: number
      total_messages: number
    }> = []

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, nome')
        .in('id', userIds)
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      for (const user_id of userIds) {
        const info = byKey.get(user_id)!
        const profile = profileMap.get(user_id)
        conversations.push({
          user_id,
          user_email: profile?.email || '',
          user_name: profile?.nome || 'Usuário',
          last_message: info.last_message,
          last_message_time: info.last_message_time,
          unread_count: info.unread_count,
          total_messages: info.total_messages
        })
      }
    }

    if (guestEmails.length > 0) {
      const { data: guestConvs } = await supabase
        .from('chat_conversations')
        .select('guest_email, guest_name')
        .not('guest_email', 'is', null)
        .in('guest_email', guestEmails)
      const guestMap = new Map((guestConvs || []).map((c: any) => [c.guest_email, c.guest_name || 'Visitante']))
      for (const email of guestEmails) {
        const key = GUEST_PREFIX + email
        const info = byKey.get(key)!
        conversations.push({
          user_id: key,
          user_email: email,
          user_name: guestMap.get(email) || 'Visitante',
          last_message: info.last_message,
          last_message_time: info.last_message_time,
          unread_count: info.unread_count,
          total_messages: info.total_messages
        })
      }
    }

    conversations.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())

    return NextResponse.json({ conversations })
  } catch (err: any) {
    console.error('[chat/conversations] Erro:', err)
    return NextResponse.json({ error: err?.message || 'Erro ao carregar conversas' }, { status: 500 })
  }
}
