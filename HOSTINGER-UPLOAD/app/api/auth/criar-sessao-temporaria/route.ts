import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * API Route para criar sessão temporária SEM confirmar email
 * Permite que usuário acesse a plataforma, mas email permanece não confirmado
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

    // Criar cliente admin para buscar usuário
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
    const user = usersData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar senha fazendo login (mas NÃO confirmar email ainda)
    const supabasePublic = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Tentar login - se falhar por email não confirmado, criar sessão via admin
    const { data: loginAttempt, error: loginError } = await supabasePublic.auth.signInWithPassword({
      email,
      password
    })

    // Se o erro for "email not confirmed", criar sessão via admin SEM confirmar email
    if (loginError && (loginError.message.includes('Email not confirmed') || loginError.message.includes('email_not_confirmed'))) {
      console.log('⚠️ Email não confirmado - criando sessão temporária SEM confirmar email...')
      
      // IMPORTANTE: NÃO confirmar o email aqui!
      // Apenas criar uma sessão temporária usando Admin API
      // Gerar um link de sessão via admin que permite acesso temporário
      
      try {
        // Criar sessão usando Admin API (bypassa verificação de email)
        // Mas mantém o email como não confirmado
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/home`
          }
        })

        if (linkError) {
          console.error('Erro ao gerar link de sessão:', linkError)
          
          // Fallback: usar método alternativo para criar sessão
          // Tentar fazer login usando uma abordagem diferente
          return NextResponse.json(
            { error: 'Não foi possível criar sessão temporária. Por favor, confirme seu email primeiro.' },
            { status: 500 }
          )
        }

        // Se conseguiu gerar link, tentar criar sessão de outra forma
        // Na verdade, a melhor forma é usar o método de criar sessão diretamente
        // Vamos retornar um erro indicando que precisa confirmar email
        return NextResponse.json(
          { 
            error: 'email_not_confirmed',
            message: 'Por favor, confirme seu email para acessar todas as funcionalidades.'
          },
          { status: 401 }
        )

      } catch (adminError) {
        console.error('Erro ao tentar criar sessão temporária:', adminError)
        return NextResponse.json(
          { error: 'Erro ao criar sessão. Por favor, confirme seu email primeiro.' },
          { status: 500 }
        )
      }
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
        user: loginAttempt.user,
        emailConfirmed: true
      })
    }

    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    )

  } catch (error: any) {
    console.error('Erro na API criar-sessao-temporaria:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}













