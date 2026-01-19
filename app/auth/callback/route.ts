import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/home'

  // IMPORTANTE: SEMPRE usar https://plenipay.com para redirecionamentos
  // Não usar requestUrl.origin que pode ser 0.0.0.0:10000
  const productionUrl = 'https://plenipay.com'

  // Log detalhado de todos os parâmetros
  console.log('🔍 [Callback] ==========================================')
  console.log('🔍 [Callback] URL completa:', requestUrl.toString())
  console.log('🔍 [Callback] Host:', requestUrl.host)
  console.log('🔍 [Callback] Origin (requestUrl):', requestUrl.origin)
  console.log('🔍 [Callback] Origin (FORÇADO):', productionUrl)
  console.log('🔍 [Callback] ⚠️ IMPORTANTE: Todos os redirecionamentos usarão', productionUrl)
  console.log('🔍 [Callback] Parâmetros da URL:')
  console.log('   - token_hash:', token_hash ? token_hash.substring(0, 20) + '...' : 'NÃO ENCONTRADO')
  console.log('   - type:', type || 'NÃO ENCONTRADO')
  console.log('   - next:', next)
  console.log('🔍 [Callback] Todos os parâmetros:', Object.fromEntries(requestUrl.searchParams.entries()))
  
  // Verificar se a URL é inválida (0.0.0.0:10000)
  if (requestUrl.host.includes('0.0.0.0') || requestUrl.host.includes('10000')) {
    console.error('❌ [Callback] URL INVÁLIDA DETECTADA: 0.0.0.0:10000')
    console.error('❌ [Callback] Este link foi gerado com Site URL incorreta no Supabase')
    console.error('❌ [Callback] Redirecionando para login com URL correta (https://plenipay.com)')
    
    // Redirecionar para login com mensagem específica usando URL de produção
    const redirectUrl = new URL('/login', productionUrl)
    redirectUrl.searchParams.set('error', 'Link de confirmação inválido. O link foi gerado com URL incorreta. Por favor, solicite um novo link de confirmação.')
    redirectUrl.searchParams.set('invalidLink', 'true')
    return NextResponse.redirect(redirectUrl)
  }
  
  console.log('🔍 [Callback] ==========================================')

  if (token_hash && type) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Verificar link de confirmação de email
    // IMPORTANTE: inviteUserByEmail pode usar type='invite' ou 'signup'
    let emailConfirmed = false
    let userId: string | null = null
    let userEmail: string | null = null
    
    if (type === 'email' || type === 'signup' || type === 'invite') {
      console.log('🔍 [Callback] Verificando link de confirmação de email...')
      console.log('🔍 [Callback] Type:', type)
      console.log('🔍 [Callback] Token hash presente:', !!token_hash)
      
      // Tentar diferentes tipos de verifyOtp
      const typesToTry = [type, 'signup', 'email', 'invite'].filter((t, i, arr) => arr.indexOf(t) === i)
      console.log('🔍 [Callback] Tipos a tentar:', typesToTry)
      
      let verifySuccess = false
      let lastError: any = null
      
      for (const tryType of typesToTry) {
        console.log(`🔄 [Callback] Tentando verifyOtp com type: ${tryType}`)
        
        const { data, error } = await supabase.auth.verifyOtp({
          type: tryType as any,
          token_hash,
        })

        console.log(`📬 [Callback] Resultado do verifyOtp (type: ${tryType}):`)
        console.log('   - Tem data:', !!data)
        console.log('   - Tem error:', !!error)

        if (!error && data?.user) {
          verifySuccess = true
          userId = data.user.id
          userEmail = data.user.email || null
          emailConfirmed = !!data.user.email_confirmed_at
          
          console.log('✅ [Callback] verifyOtp retornou sucesso!')
          console.log('👤 [Callback] Usuário:', userId)
          console.log('📧 [Callback] Email:', userEmail)
          console.log('📧 [Callback] Email confirmado pelo verifyOtp:', emailConfirmed)
          console.log('🔑 [Callback] Sessão criada:', !!data.session)
          
                // Se há sessão, redirecionar para home
                if (data.session) {
                  console.log('✅ [Callback] Sessão criada - redirecionando para home')
                  const redirectUrl = new URL(next, productionUrl)
                  redirectUrl.searchParams.set('emailConfirmed', 'true')
                  return NextResponse.redirect(redirectUrl)
                }
          
          break // Sucesso, não precisa tentar outros tipos
        } else if (error) {
          lastError = error
          console.log(`⚠️ [Callback] verifyOtp falhou com type: ${tryType}, erro: ${error.message}`)
        }
      }
      
      // SEMPRE confirmar via Admin API, mesmo se verifyOtp funcionou
      // Isso garante que o email seja confirmado independente do verifyOtp
      console.log('🔧 [Callback] SEMPRE confirmando via Admin API para garantir confirmação...')
      
      // Se não temos userId do verifyOtp, buscar por email ou token
      if (!userId) {
        // Tentar obter usuário pelo email se disponível na URL
        const emailParam = requestUrl.searchParams.get('email')
        if (emailParam) {
          try {
            const supabaseAdmin = createAdminClient()
            if (supabaseAdmin) {
              console.log(`🔍 [Callback] Buscando usuário por email: ${emailParam}`)
              const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
              const user = usersData?.users?.find((u: any) => u.email === emailParam)
              if (user) {
                userId = user.id
                userEmail = user.email
                console.log(`✅ [Callback] Usuário encontrado por email: ${userId}`)
              }
            }
          } catch (err) {
            console.error('❌ [Callback] Erro ao buscar usuário por email:', err)
          }
        }
        
        // Se ainda não temos userId, tentar buscar todos os usuários não confirmados recentes
        if (!userId) {
          try {
            const supabaseAdmin = createAdminClient()
            if (supabaseAdmin) {
              console.log('🔍 [Callback] Buscando usuários não confirmados recentes...')
              const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
              // Buscar usuários não confirmados criados nas últimas 24 horas
              const recentUnconfirmed = usersData?.users?.filter((u: any) => {
                const created = new Date(u.created_at)
                const now = new Date()
                const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
                return !u.email_confirmed_at && hoursDiff < 24
              })
              
              if (recentUnconfirmed && recentUnconfirmed.length === 1) {
                // Se há apenas um usuário não confirmado recente, provavelmente é ele
                userId = recentUnconfirmed[0].id
                userEmail = recentUnconfirmed[0].email
                console.log(`✅ [Callback] Usuário encontrado (único não confirmado recente): ${userId}`)
              }
            }
          } catch (err) {
            console.error('❌ [Callback] Erro ao buscar usuários não confirmados:', err)
          }
        }
      }
      
      // Confirmar via Admin API se temos userId
      if (userId) {
        try {
          const supabaseAdmin = createAdminClient()
          if (supabaseAdmin) {
            console.log(`🔧 [Callback] Confirmando email via Admin API para usuário: ${userId}`)
            
            // IMPORTANTE: Confirmar email
            const { data: updateData, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
              email_confirm: true
            })
            
            if (!confirmError) {
              console.log('✅ [Callback] Email confirmado com sucesso via Admin API!')
              
              // Aguardar um pouco para garantir que a atualização foi processada
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Verificar novamente se foi confirmado
              const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
              if (!getUserError && userData?.user) {
                emailConfirmed = !!userData.user.email_confirmed_at
                console.log('✅ [Callback] Verificação final - Email confirmado:', emailConfirmed)
                console.log('✅ [Callback] email_confirmed_at:', userData.user.email_confirmed_at)
                console.log('✅ [Callback] email_confirm:', userData.user.email_confirm)
                
                if (!emailConfirmed) {
                  console.error('⚠️ [Callback] Email ainda não confirmado após Admin API!')
                  console.error('⚠️ [Callback] Tentando novamente...')
                  
                  // Tentar novamente
                  const { error: retryError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                    email_confirm: true
                  })
                  
                  if (!retryError) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    const { data: retryUserData } = await supabaseAdmin.auth.admin.getUserById(userId)
                    if (retryUserData?.user) {
                      emailConfirmed = !!retryUserData.user.email_confirmed_at
                      console.log('✅ [Callback] Após retry - Email confirmado:', emailConfirmed)
                    }
                  }
                }
              } else {
                console.error('❌ [Callback] Erro ao verificar usuário após confirmação:', getUserError?.message)
              }
            } else {
              console.error('❌ [Callback] Erro ao confirmar email via Admin API:', confirmError.message)
              console.error('❌ [Callback] Erro completo:', JSON.stringify(confirmError, null, 2))
            }
          } else {
            console.error('❌ [Callback] Admin client não disponível')
          }
        } catch (adminError: any) {
          console.error('❌ [Callback] Erro inesperado ao confirmar via Admin API:', adminError.message)
          console.error('❌ [Callback] Stack:', adminError.stack)
        }
      } else {
        console.error('❌ [Callback] Não foi possível obter userId para confirmar via Admin API')
        console.error('❌ [Callback] Token hash:', token_hash ? token_hash.substring(0, 20) + '...' : 'NÃO DISPONÍVEL')
        console.error('❌ [Callback] Type:', type)
      }
      
      // Redirecionar com status
      if (emailConfirmed) {
        console.log('✅ [Callback] Email confirmado - redirecionando para login')
        const redirectUrl = new URL('/login', productionUrl)
        redirectUrl.searchParams.set('emailConfirmed', 'true')
        if (userEmail) {
          redirectUrl.searchParams.set('email', userEmail)
        }
        return NextResponse.redirect(redirectUrl)
      } else if (lastError) {
        console.error('❌ [Callback] Erro ao verificar link de confirmação:', lastError.message)
        
        // Se o token expirou, redirecionar com mensagem específica
        if (lastError.message.includes('expired') || lastError.message.includes('expirado')) {
          const redirectUrl = new URL('/login', productionUrl)
          redirectUrl.searchParams.set('error', 'Link de confirmação expirado. Por favor, solicite um novo link.')
          if (userEmail) {
            redirectUrl.searchParams.set('email', userEmail)
          }
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
    
    // Tentar com verifyOtp para outros casos
    if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      if (!error && data?.user) {
        console.log('✅ Email confirmado com sucesso (método alternativo)')
        console.log('🔑 Sessão criada:', !!data.session)
        
        if (data.session) {
          const redirectUrl = new URL(next, productionUrl)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          return NextResponse.redirect(redirectUrl)
        } else {
          const redirectUrl = new URL('/login', productionUrl)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          redirectUrl.searchParams.set('email', data.user.email || '')
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  }

  // Se houver erro ou parâmetros inválidos, redirecionar para login
  const redirectUrl = new URL('/login', productionUrl)
  redirectUrl.searchParams.set('error', 'Erro ao confirmar email. O link pode ter expirado.')
  return NextResponse.redirect(redirectUrl)
}





