/**
 * Verifica se o email existe e se o usuário precisa definir senha (primeiro acesso, ex.: conta criada pelo WhatsApp).
 * Busca o usuário pelo email no Auth e depois o perfil por user.id (não depende de profiles.email).
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

    // Buscar usuário pelo email no Auth (contas WhatsApp podem não ter email em profiles)
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const user = usersData?.users?.find((u) => (u.email ?? '').toLowerCase() === email)
    if (!user?.id) {
      return NextResponse.json({ precisaDefinirSenha: false })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('precisa_definir_senha')
      .eq('id', user.id)
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ precisaDefinirSenha: false })
    }

    const precisaDefinirSenha = (data as { precisa_definir_senha?: boolean }).precisa_definir_senha === true
    return NextResponse.json({ precisaDefinirSenha })
  } catch {
    return NextResponse.json({ precisaDefinirSenha: false })
  }
}
