import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que devem ser indexadas pelo Google
const publicRoutes = ['/', '/login', '/cadastro', '/planos', '/termos', '/privacidade', '/suporte']

// URL de produção forçada
const PRODUCTION_URL = 'https://plenipay.com'

// Middleware para forçar renderização dinâmica em rotas específicas
// Isso evita que o Next.js tente fazer prerendering estático
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()
  
  // SOLUÇÃO 1: Interceptar qualquer requisição para 0.0.0.0:10000
  // Isso funciona ANTES do callback handler ser executado
  // IMPORTANTE: Intercepta QUALQUER requisição que tente acessar 0.0.0.0:10000
  // CRÍTICO: Verificar TAMBÉM se o pathname ou search contém 0.0.0.0:10000 (pode vir no redirect_to)
  // NOTA: 0.0.0.0:3000 é válido em produção (aceita conexões de qualquer IP), apenas 0.0.0.0:10000 é inválido
  const hostTemUrlInvalida = url.host.includes('0.0.0.0:10000') || (url.host.includes('0.0.0.0') && url.host.includes('10000'))
  const pathnameTemUrlInvalida = pathname.includes('0.0.0.0:10000') || (pathname.includes('0.0.0.0') && pathname.includes('10000'))
  const searchTemUrlInvalida = url.search.includes('0.0.0.0:10000') || (url.search.includes('0.0.0.0') && url.search.includes('10000'))
  
  if (hostTemUrlInvalida || pathnameTemUrlInvalida || searchTemUrlInvalida) {
    console.error('🚫 [Middleware] URL INVÁLIDA DETECTADA: 0.0.0.0:10000')
    console.error('🚫 [Middleware] Host:', url.host)
    console.error('🚫 [Middleware] Pathname:', pathname)
    console.error('🚫 [Middleware] Search:', url.search)
    console.error('🚫 [Middleware] URL completa:', url.toString())
    console.error('🚫 [Middleware] Redirecionando para:', PRODUCTION_URL)
    
    // Criar URL correta preservando todos os parâmetros
    const redirectUrl = new URL(pathname, PRODUCTION_URL)
    
    // Copiar todos os parâmetros da query string (incluindo token_hash, type, etc.)
    url.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    
    // Copiar hash se existir (pode conter parâmetros importantes)
    if (url.hash) {
      // Extrair parâmetros do hash também (ex: #error=access_denied&error_code=otp_expired)
      const hashParams = new URLSearchParams(url.hash.substring(1))
      hashParams.forEach((value, key) => {
        redirectUrl.searchParams.set(key, value)
      })
      // Manter hash original também
      redirectUrl.hash = url.hash
    }
    
    console.log('🔄 [Middleware] Redirecionando para:', redirectUrl.toString())
    console.log('🔄 [Middleware] Parâmetros preservados:', Object.fromEntries(redirectUrl.searchParams.entries()))
    console.log('🔄 [Middleware] Hash:', url.hash)
    
    // IMPORTANTE: Usar 307 (Temporary Redirect) para preservar método GET e parâmetros
    // Isso garante que o callback handler receba todos os parâmetros necessários
    return NextResponse.redirect(redirectUrl, { status: 307 })
  }
  
  // SOLUÇÃO 2: Verificar referer e origin para detectar redirects incorretos
  const referer = request.headers.get('referer')
  const origin = request.headers.get('origin')
  
  if (referer && (referer.includes('0.0.0.0') || referer.includes('10000'))) {
    console.warn('⚠️ [Middleware] Referer contém 0.0.0.0:10000:', referer)
    console.warn('⚠️ [Middleware] Redirecionando para URL correta...')
    
    // Se o referer é incorreto, redirecionar para URL correta
    const redirectUrl = new URL(pathname, PRODUCTION_URL)
    url.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    if (url.hash) {
      redirectUrl.hash = url.hash
    }
    
    return NextResponse.redirect(redirectUrl, { status: 307 })
  }
  
  if (origin && (origin.includes('0.0.0.0') || origin.includes('10000'))) {
    console.warn('⚠️ [Middleware] Origin contém 0.0.0.0:10000:', origin)
    console.warn('⚠️ [Middleware] Redirecionando para URL correta...')
    
    const redirectUrl = new URL(pathname, PRODUCTION_URL)
    url.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    if (url.hash) {
      redirectUrl.hash = url.hash
    }
    
    return NextResponse.redirect(redirectUrl, { status: 307 })
  }
  
  // Comportamento normal do middleware (SEO e cache)
  const response = NextResponse.next()
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/'
  
  // Apenas rotas administrativas e privadas não devem ser indexadas
  if (pathname.startsWith('/administracaosecr') || 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/home') ||
      pathname.startsWith('/api')) {
    // Bloquear indexação apenas para rotas privadas
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
  } else if (isPublicRoute) {
    // Permitir indexação para rotas públicas
    response.headers.set('X-Robots-Tag', 'index, follow')
    // Cache mais permissivo para páginas públicas (melhor para SEO)
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  } else {
    // Para outras rotas, permitir indexação mas com cache controlado
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
  }
  
  return response
}

// Aplicar a todas as rotas
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     * 
     * IMPORTANTE: Incluir /auth/confirm para interceptar links de email
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
