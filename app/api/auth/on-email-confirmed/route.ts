/**
 * Chamado pelo cliente após verifyOtp (confirmação de email).
 * Automação WhatsApp removida; rota mantida para não quebrar o fluxo de confirmação.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const accessToken = typeof body.access_token === 'string' ? body.access_token.trim() : ''
    const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token.trim() : ''

    if (accessToken) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && supabaseAnonKey) {
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
        const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
        const { error } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })
        if (!error) {
          return NextResponse.json({ ok: true })
        }
      }
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!userError && user?.id) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  } catch (e) {
    console.error('[on-email-confirmed] Erro:', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
