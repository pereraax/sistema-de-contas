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
    if (type === 'email' || type === 'signup') {
      console.log('🔍 [Callback] Verificando link de confirmação de email...')
      console.log('🔍 [Callback] Type:', type)
      console.log('🔍 [Callback] Token hash presente:', !!token_hash)
      
      // Para links de confirmação, usar verifyOtp com token_hash
      // Isso confirma o email E cria uma sessão se possível
      console.log('🔍 [Callback] Tentando verifyOtp com:')
      console.log('   - type:', type)
      console.log('   - token_hash (primeiros 20 chars):', token_hash.substring(0, 20) + '...')
      
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      console.log('📬 [Callback] Resultado do verifyOtp:')
      console.log('   - Tem data:', !!data)
      console.log('   - Tem error:', !!error)
      console.log('   - Error completo:', error ? JSON.stringify(error, null, 2) : 'Nenhum')

      if (!error && data?.user) {
        console.log('✅ [Callback] Email confirmado com sucesso via callback')
        console.log('👤 [Callback] Usuário:', data.user.id)
        console.log('📧 [Callback] Email:', data.user.email)
        console.log('📧 [Callback] Email confirmado:', !!data.user.email_confirmed_at)
        console.log('🔑 [Callback] Sessão criada:', !!data.session)
        
        // IMPORTANTE: Se o email NÃO foi confirmado mesmo após verifyOtp, confirmar via Admin API
        if (!data.user.email_confirmed_at) {
          console.log('⚠️ [Callback] Email NÃO confirmado após verifyOtp - tentando confirmar via Admin API...')
          
          try {
            const supabaseAdmin = createAdminClient()
            if (supabaseAdmin) {
              const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
                email_confirm: true
              })
              
              if (!confirmError) {
                console.log('✅ [Callback] Email confirmado com sucesso via Admin API')
              } else {
                console.error('❌ [Callback] Erro ao confirmar email via Admin API:', confirmError.message)
              }
            } else {
              console.error('❌ [Callback] Admin client não disponível')
            }
          } catch (adminError: any) {
            console.error('❌ [Callback] Erro inesperado ao confirmar via Admin API:', adminError.message)
          }
        }
        
        // Se há sessão, redirecionar para home
        if (data.session) {
          console.log('✅ [Callback] Sessão criada - redirecionando para home')
          const redirectUrl = new URL(next, requestUrl.origin)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          return NextResponse.redirect(redirectUrl)
        } else {
          // Se não há sessão, redirecionar para login com flag de email confirmado
          console.log('⚠️ [Callback] Email confirmado mas sem sessão - redirecionando para login')
          const redirectUrl = new URL('/login', requestUrl.origin)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          redirectUrl.searchParams.set('email', data.user.email || '')
          return NextResponse.redirect(redirectUrl)
        }
      } else if (error) {
        console.error('❌ [Callback] Erro ao verificar link de confirmação:', error.message)
        console.error('❌ [Callback] Código do erro:', error.status)
        console.error('❌ [Callback] Detalhes completos:', JSON.stringify(error, null, 2))
        
        // Se o token expirou, redirecionar com mensagem específica
        if (error.message.includes('expired') || error.message.includes('expirado')) {
          const redirectUrl = new URL('/login', requestUrl.origin)
          redirectUrl.searchParams.set('error', 'Link de confirmação expirado. Por favor, solicite um novo link.')
          redirectUrl.searchParams.set('email', data?.user?.email || '')
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





