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

  // Log detalhado de todos os parâmetros
  console.log('🔍 [Callback] ==========================================')
  console.log('🔍 [Callback] URL completa:', requestUrl.toString())
  console.log('🔍 [Callback] Parâmetros da URL:')
  console.log('   - token_hash:', token_hash ? token_hash.substring(0, 20) + '...' : 'NÃO ENCONTRADO')
  console.log('   - type:', type || 'NÃO ENCONTRADO')
  console.log('   - next:', next)
  console.log('🔍 [Callback] Todos os parâmetros:', Object.fromEntries(requestUrl.searchParams.entries()))
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
            const redirectUrl = new URL(next, requestUrl.origin)
            redirectUrl.searchParams.set('emailConfirmed', 'true')
            return NextResponse.redirect(redirectUrl)
          }
          
          break // Sucesso, não precisa tentar outros tipos
        } else if (error) {
          lastError = error
          console.log(`⚠️ [Callback] verifyOtp falhou com type: ${tryType}, erro: ${error.message}`)
        }
      }
      
      // Se verifyOtp falhou ou não confirmou o email, confirmar via Admin API
      if (!verifySuccess || !emailConfirmed) {
        console.log('⚠️ [Callback] verifyOtp falhou ou não confirmou - tentando confirmar via Admin API...')
        
        // Se não temos userId, precisamos obter pelo token_hash ou email
        if (!userId && token_hash) {
          // Tentar obter usuário pelo email se disponível na URL
          const emailParam = requestUrl.searchParams.get('email')
          if (emailParam) {
            try {
              const supabaseAdmin = createAdminClient()
              if (supabaseAdmin) {
                const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
                const user = usersData?.users?.find((u: any) => u.email === emailParam)
                if (user) {
                  userId = user.id
                  userEmail = user.email
                }
              }
            } catch (err) {
              console.error('❌ [Callback] Erro ao buscar usuário por email:', err)
            }
          }
        }
        
        // Confirmar via Admin API se temos userId
        if (userId) {
          try {
            const supabaseAdmin = createAdminClient()
            if (supabaseAdmin) {
              console.log(`🔧 [Callback] Confirmando email via Admin API para usuário: ${userId}`)
              const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                email_confirm: true
              })
              
              if (!confirmError) {
                console.log('✅ [Callback] Email confirmado com sucesso via Admin API!')
                emailConfirmed = true
              } else {
                console.error('❌ [Callback] Erro ao confirmar email via Admin API:', confirmError.message)
              }
            } else {
              console.error('❌ [Callback] Admin client não disponível')
            }
          } catch (adminError: any) {
            console.error('❌ [Callback] Erro inesperado ao confirmar via Admin API:', adminError.message)
          }
        } else {
          console.error('❌ [Callback] Não foi possível obter userId para confirmar via Admin API')
        }
      }
      
      // Redirecionar com status
      if (emailConfirmed) {
        console.log('✅ [Callback] Email confirmado - redirecionando para login')
        const redirectUrl = new URL('/login', requestUrl.origin)
        redirectUrl.searchParams.set('emailConfirmed', 'true')
        if (userEmail) {
          redirectUrl.searchParams.set('email', userEmail)
        }
        return NextResponse.redirect(redirectUrl)
      } else if (lastError) {
        console.error('❌ [Callback] Erro ao verificar link de confirmação:', lastError.message)
        
        // Se o token expirou, redirecionar com mensagem específica
        if (lastError.message.includes('expired') || lastError.message.includes('expirado')) {
          const redirectUrl = new URL('/login', requestUrl.origin)
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
          const redirectUrl = new URL(next, requestUrl.origin)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          return NextResponse.redirect(redirectUrl)
        } else {
          const redirectUrl = new URL('/login', requestUrl.origin)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          redirectUrl.searchParams.set('email', data.user.email || '')
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  }

  // Se houver erro ou parâmetros inválidos, redirecionar para login
  const redirectUrl = new URL('/login', requestUrl.origin)
  redirectUrl.searchParams.set('error', 'Erro ao confirmar email. O link pode ter expirado.')
  return NextResponse.redirect(redirectUrl)
}





