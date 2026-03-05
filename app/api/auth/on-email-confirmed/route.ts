/**
 * Chamado pelo cliente após verifyOtp (confirmação de email) para o assistente enviar
 * a mensagem no WhatsApp informando que o email foi confirmado e que já pode registrar com a assistente.
 * Aceita access_token (e opcionalmente refresh_token) no body, pois a sessão pode não estar nos cookies.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendTextMessage } from '@/lib/whatsapp-zapi'

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null

    const body = await request.json().catch(() => ({}))
    const accessToken = typeof body.access_token === 'string' ? body.access_token.trim() : ''
    const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token.trim() : ''

    if (accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseAnonKey) {
        const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
        const { data: { user }, error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })
        if (!error && user?.id) userId = user.id
      }
    }

    if (!userId) {
      const supabase = await createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!userError && user?.id) userId = user.id
    }

    if (!userId) {
      console.warn('[on-email-confirmed] Não autenticado: sem token válido e sem sessão nos cookies')
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const admin = createAdminClient()
    if (!admin) {
      console.warn('[on-email-confirmed] Admin client indisponível (sem SERVICE_ROLE_KEY)')
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const { data: ws } = await admin
      .from('whatsapp_sessions')
      .select('phone_number')
      .eq('user_id', userId)
      .maybeSingle()

    if (!ws?.phone_number) {
      console.warn('[on-email-confirmed] Usuário sem WhatsApp vinculado:', userId)
      return NextResponse.json({ ok: true }) // ok para não quebrar o fluxo; mensagem só vai se tiver sessão
    }

    const result = await sendTextMessage(
      ws.phone_number,
      'Sua conta foi confirmada! ✅ Agora você já pode me pedir para registrar seus gastos e receitas. Por exemplo: "gastei 200 com roupas", "recebi 1500 salário", "extra de 300".',
      { delayTyping: 1 }
    )

    if (result.success) {
      console.log('[on-email-confirmed] Mensagem WhatsApp enviada para', ws.phone_number)
    } else {
      console.error('[on-email-confirmed] Falha ao enviar WhatsApp:', result.error, '| phone:', ws.phone_number)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[on-email-confirmed] Erro:', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
