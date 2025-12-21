import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * API Route para confirmar email automaticamente e permitir login
 * Usa Service Role Key para confirmar email via admin API
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar cliente admin para confirmar email
    const adminClient = createAdminClient()
    
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service Role Key não configurada. Configure SUPABASE_SERVICE_ROLE_KEY no .env.local' },
        { status: 500 }
      )
    }

    // Listar usuários para encontrar o email
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error('Erro ao listar usuários:', listError)
      return NextResponse.json(
        { error: 'Erro ao verificar usuário' },
        { status: 500 }
      )
    }

    // Encontrar usuário pelo email
    const user = (usersData.users as any[]).find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar senha tentando fazer login primeiro (para validar senha)
    // Se falhar por email não confirmado, confirmar e tentar novamente
    const supabasePublic = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Tentar login para verificar senha
    const { data: loginAttempt, error: loginError } = await supabasePublic.auth.signInWithPassword({
      email,
      password
    })

    // Se o erro for "email not confirmed", confirmar via admin
    if (loginError && (loginError.message.includes('Email not confirmed') || loginError.message.includes('email_not_confirmed'))) {
      console.log('⚠️ Email não confirmado, confirmando via admin...')
      
      // Confirmar email via admin API
      const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(
        user.id,
        {
          email_confirm: true
        }
      )

      if (updateError) {
        console.error('Erro ao confirmar email via admin:', updateError)
        return NextResponse.json(
          { error: 'Erro ao confirmar email. Tente novamente.' },
          { status: 500 }
        )
      }

      console.log('✅ Email confirmado via admin, tentando login novamente...')

      // Tentar login novamente após confirmar
      const { data: retryLogin, error: retryError } = await supabasePublic.auth.signInWithPassword({
        email,
        password
      })

      if (retryError) {
        console.error('Erro no login após confirmar email:', retryError)
        return NextResponse.json(
          { error: retryError.message || 'Erro ao fazer login após confirmar email' },
          { status: 401 }
        )
      }

      if (!retryLogin.session || !retryLogin.user) {
        return NextResponse.json(
          { error: 'Erro ao criar sessão' },
          { status: 500 }
        )
      }

      // Retornar tokens de sessão para o cliente
      return NextResponse.json({
        success: true,
        session: {
          access_token: retryLogin.session.access_token,
          refresh_token: retryLogin.session.refresh_token,
          expires_at: retryLogin.session.expires_at,
          expires_in: retryLogin.session.expires_in,
          token_type: retryLogin.session.token_type,
          user: retryLogin.user
        },
        user: retryLogin.user
      })

    } else if (loginError) {
      // Outro tipo de erro (credenciais inválidas, etc)
      return NextResponse.json(
        { error: loginError.message || 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Se o login funcionou (email já estava confirmado)
    if (loginAttempt?.session && loginAttempt?.user) {
      return NextResponse.json({
        success: true,
        session: {
          access_token: loginAttempt.session.access_token,
          refresh_token: loginAttempt.session.refresh_token,
          expires_at: loginAttempt.session.expires_at,
          expires_in: loginAttempt.session.expires_in,
          token_type: loginAttempt.session.token_type,
          user: loginAttempt.user
        },
        user: loginAttempt.user
      })
    }

    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    )

  } catch (error: any) {
    console.error('Erro na API confirmar-e-logar:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}













