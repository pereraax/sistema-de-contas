/**
 * Define a senha para usuário em primeiro acesso (conta criada pelo WhatsApp, sem senha conhecida).
 * POST body: { email: string, senha: string }
 * Só permite se o usuário tiver precisa_definir_senha ou whatsapp_sessions (mesma regra do check-email).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const senha = typeof body.senha === 'string' ? body.senha : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email inválido.' }, { status: 400 })
    }
    if (!senha || senha.length < 6) {
      return NextResponse.json({ success: false, error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Serviço indisponível.' }, { status: 503 })
    }

    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const user = usersData?.users?.find((u) => (u.email ?? '').toLowerCase() === email)
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Email não encontrado.' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('precisa_definir_senha')
      .eq('id', user.id)
      .maybeSingle()

    const flagSenha = (profile as { precisa_definir_senha?: boolean } | null)?.precisa_definir_senha === true
    let allowed = flagSenha
    if (!allowed) {
      const { data: ws } = await supabase
        .from('whatsapp_sessions')
        .select('user_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      allowed = !!ws
    }
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Esta conta já possui senha. Use "Esqueci a senha" se não lembrar.' },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: senha })
    if (updateError) {
      const msg = updateError.message?.toLowerCase().includes('weak') ? 'Escolha uma senha mais forte.' : updateError.message || 'Erro ao definir senha.'
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }

    await supabase
      .from('profiles')
      .update({ precisa_definir_senha: false, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Erro inesperado.' }, { status: 500 })
  }
}
