import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * API Route para buscar usuário mesmo sem sessão
 * Usa Service Role Key para buscar informações do usuário via Admin API
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Criar cliente admin para buscar usuário
    const adminClient = createAdminClient()
    
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service Role Key não configurada' },
        { status: 500 }
      )
    }

    // Listar usuários para encontrar pelo email
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error('Erro ao listar usuários:', listError)
      return NextResponse.json(
        { error: 'Erro ao buscar usuário' },
        { status: 500 }
      )
    }

    // Encontrar usuário pelo email
    const user = (usersData.users as any[]).find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar perfil na tabela profiles
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      profile: profile || null
    })

  } catch (error: any) {
    console.error('Erro na API buscar-usuario-sem-sessao:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}













