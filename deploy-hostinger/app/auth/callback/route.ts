import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/home'

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
      // Para links de confirmação, usar verifyOtp com token_hash
      // Isso confirma o email E cria uma sessão se possível
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      if (!error && data?.user) {
        console.log('✅ Email confirmado com sucesso via callback')
        console.log('👤 Usuário:', data.user.id)
        console.log('📧 Email:', data.user.email)
        console.log('📧 Email confirmado:', !!data.user.email_confirmed_at)
        console.log('🔑 Sessão criada:', !!data.session)
        
        // Se há sessão, redirecionar para home
        if (data.session) {
          console.log('✅ Sessão criada - redirecionando para home')
          const redirectUrl = new URL(next, requestUrl.origin)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          return NextResponse.redirect(redirectUrl)
        } else {
          // Se não há sessão, redirecionar para login com flag de email confirmado
          console.log('⚠️ Email confirmado mas sem sessão - redirecionando para login')
          const redirectUrl = new URL('/login', requestUrl.origin)
          redirectUrl.searchParams.set('emailConfirmed', 'true')
          redirectUrl.searchParams.set('email', data.user.email || '')
          return NextResponse.redirect(redirectUrl)
        }
      } else if (error) {
        console.error('❌ Erro ao verificar link de confirmação:', error.message)
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





