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
  
  // CRÍTICO: Verificar o host REAL da requisição (do header Host, não da URL)
  // Com Cloudflare, o Host pode ser plenipay.com, www.plenipay.com ou o host do Railway
  const hostHeader = request.headers.get('host') || ''
  const isPlenipay = hostHeader === 'plenipay.com' || hostHeader === 'www.plenipay.com' || hostHeader.includes('plenipay.com')
  const isRailwayHost = hostHeader.includes('.railway.app') || hostHeader.includes('up.railway.app')
  const isCorrectDomain = isPlenipay || isRailwayHost

  // CRÍTICO: Se estamos no domínio correto ou no backend Railway, NUNCA redirecionar
  // Isso evita ERR_TOO_MANY_REDIRECTS com Cloudflare (Flexible SSL ou regras conflitantes)
  // Isso evita loops quando o Next.js usa 0.0.0.0:3000 como URL base (normal em produção)
  if (isCorrectDomain) {
    // Apenas continuar processamento normal (SEO e cache)
    const response = NextResponse.next()
    
    // Verificar se é uma rota pública
    const isPublicRoute = ['/', '/login', '/cadastro', '/planos', '/termos', '/privacidade', '/suporte'].includes(pathname) || pathname === '/'
    
    // Apenas rotas administrativas e privadas não devem ser indexadas
    if (pathname.startsWith('/administracaosecr') || 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/home') ||
        pathname.startsWith('/api')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
    } else if (isPublicRoute) {
      response.headers.set('X-Robots-Tag', 'index, follow')
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    } else {
      response.headers.set('X-Robots-Tag', 'index, follow')
      response.headers.set('Cache-Control', 'no-store, must-revalidate')
    }
    
    return response
  }
  
  // Só interceptar se NÃO estivermos no domínio correto
  // Interceptar apenas 0.0.0.0:10000 (não 0.0.0.0:3000 que é normal)
  const hostTemUrlInvalida = url.host.includes('0.0.0.0:10000') || (url.host.includes('0.0.0.0') && url.host.includes('10000'))
  const pathnameTemUrlInvalida = pathname.includes('0.0.0.0:10000') || (pathname.includes('0.0.0.0') && pathname.includes('10000'))
  const searchTemUrlInvalida = url.search.includes('0.0.0.0:10000') || (url.search.includes('0.0.0.0') && url.search.includes('10000'))
  
  // Só redirecionar se realmente tiver URL inválida (0.0.0.0:10000, não 0.0.0.0:3000)
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
    
    // IMPORTANTE: Usar 303 (See Other) em vez de 307 para evitar loops
    // 303 força GET e limpa qualquer estado de POST
    return NextResponse.redirect(redirectUrl, { status: 303 })
  }
  
  // Comportamento normal do middleware (SEO e cache)
  // Se chegou aqui, não há URL inválida, apenas aplicar headers
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
     * - next/static (rewrite em next.config -> _next/static)
     * - favicon.ico (favicon file)
     * - robots.txt
     * - sitemap.xml
     * 
     * IMPORTANTE: Incluir /auth/confirm para interceptar links de email
     */
    '/((?!api|_next/static|_next/image|next/static|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
