/**
 * Verifica se o email existe e se o usuário precisa definir senha (primeiro acesso, ex.: conta criada pelo WhatsApp).
 * Busca o usuário pelo email no Auth (com paginação) e depois o perfil por user.id.
 * Fallback: se o usuário tem sessão WhatsApp e o perfil não tem senha definida, trata como primeiro acesso.
 * POST body: { email: string }
 * Retorna: { precisaDefinirSenha: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email || !email.includes('@')) {
      return NextResponse.json({ precisaDefinirSenha: false })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ precisaDefinirSenha: false })
    }

    // Buscar usuário pelo email no Auth
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    })
    if (listError) {
      return NextResponse.json({ precisaDefinirSenha: false })
    }
    const user = usersData?.users?.find((u) => (u.email ?? '').toLowerCase() === email)
    if (!user?.id) {
      return NextResponse.json({ precisaDefinirSenha: false })
    }

    // Conta criada pelo fluxo WhatsApp/Plen: primeiro acesso = definir senha (mesmo que a flag no profile não exista)
    const metadata = (user as { user_metadata?: Record<string, unknown> }).user_metadata
    if (metadata?.origem === 'whatsapp_plen') {
      return NextResponse.json({ precisaDefinirSenha: true })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('precisa_definir_senha')
      .eq('id', user.id)
      .maybeSingle()

    // Se não existe perfil ou deu erro, tratar como primeiro acesso (ex.: conta criada pelo WhatsApp e upsert do profile falhou).
    if (error || !profile) {
      return NextResponse.json({ precisaDefinirSenha: true })
    }

    const flagSenha = (profile as { precisa_definir_senha?: boolean } | null)?.precisa_definir_senha === true
    if (flagSenha) {
      return NextResponse.json({ precisaDefinirSenha: true })
    }

    // Fallback: conta criada pelo WhatsApp pode não ter a flag no profile (perfil antigo). Se tem whatsapp_sessions, tratar como primeiro acesso.
    const { data: ws } = await supabase
      .from('whatsapp_sessions')
      .select('user_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (ws) {
      return NextResponse.json({ precisaDefinirSenha: true })
    }

    return NextResponse.json({ precisaDefinirSenha: false })
  } catch {
    return NextResponse.json({ precisaDefinirSenha: false })
  }
}
