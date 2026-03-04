import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que devem ser indexadas pelo Google
const publicRoutes = ['/', '/login', '/cadastro', '/planos', '/termos', '/privacidade', '/suporte']

// URL de produção forçada
const PRODUCTION_URL = 'https://plenipay.com'

// Cookie para modo "app" (iOS/Android): interface pode ser diferente do site sem afetar o web
const PLATFORM_APP_COOKIE = 'platform'
const PLATFORM_APP_VALUE = 'app'

// ?platform=site = forçar versão SITE (limpar modo app) — útil no localhost quando está vendo o app em vez do site
const PLATFORM_SITE_VALUE = 'site'

// Middleware para forçar renderização dinâmica em rotas específicas
// Isso evita que o Next.js tente fazer prerendering estático
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const url = request.nextUrl.clone()

  // Forçar versão SITE: remove cookie do app e redireciona sem o param (para desenvolver o site no localhost)
  if (searchParams.get('platform') === PLATFORM_SITE_VALUE) {
    const redirectUrl = new URL(pathname, url.origin)
    searchParams.forEach((value, key) => {
      if (key !== 'platform') redirectUrl.searchParams.set(key, value)
    })
    const res = NextResponse.redirect(redirectUrl, { status: 302 })
    res.cookies.set(PLATFORM_APP_COOKIE, '', { path: '/', maxAge: 0 })
    return res
  }

  // Host e localhost usados em vários pontos (localhost = sempre site por padrão; produção = app com ?platform=app)
  const hostHeader = request.headers.get('host') || ''
  const isLocalhost = hostHeader.startsWith('localhost') || hostHeader.startsWith('127.0.0.1')

  // LOCALHOST: não mexer em cookies no middleware (evita 500). O AppPlatformProvider no cliente
  // força modo site quando não tem ?platform=app e limpa cookie/localStorage.
  if (isLocalhost) {
    return NextResponse.next()
  }

  // Produção: App Store / Capacitor — ao abrir com ?platform=app, gravar cookie e redirecionar sem o param
  if (searchParams.get('platform') === PLATFORM_APP_VALUE) {
    const redirectUrl = new URL(pathname, url.origin)
    searchParams.forEach((value, key) => {
      if (key !== 'platform') redirectUrl.searchParams.set(key, value)
    })
    const res = NextResponse.redirect(redirectUrl, { status: 302 })
    res.cookies.set(PLATFORM_APP_COOKIE, PLATFORM_APP_VALUE, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 ano
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  }

  // OAuth (Google/Apple): se a URL tiver ?code= em QUALQUER path (exceto /auth/callback), enviar para /auth/callback
  // Assim, mesmo que o redirect_uri no Google aponte para / ou outro path, o usuário cai no callback e vai para /home
  const oauthCode = searchParams.get('code')
  if (oauthCode && pathname !== '/auth/callback') {
    const callbackUrl = new URL('/auth/callback', url.origin)
    searchParams.forEach((value, key) => callbackUrl.searchParams.set(key, value))
    if (!callbackUrl.searchParams.has('next')) callbackUrl.searchParams.set('next', '/home')
    const res = NextResponse.redirect(callbackUrl, { status: 303 })
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res
  }
  
  // CRÍTICO: Verificar o host REAL da requisição (hostHeader já definido acima para localhost)
  const isAppSubdomain = hostHeader === 'app.plenipay.com' || hostHeader.endsWith('.app.plenipay.com')

  // app.plenipay.com = sempre modo app (tela de bem-vindo/onboarding), nunca landing do site
  if (isAppSubdomain) {
    const response = NextResponse.next()
    response.cookies.set(PLATFORM_APP_COOKIE, PLATFORM_APP_VALUE, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: true,
    })
    if (pathname === '/' && url.search) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    }
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  const isPlenipay = hostHeader === 'plenipay.com' || hostHeader === 'www.plenipay.com' || hostHeader.includes('plenipay.com')
  const isRailwayHost = hostHeader.includes('.railway.app') || hostHeader.includes('up.railway.app')
  const isCorrectDomain = isPlenipay || isRailwayHost || isLocalhost

  // CRÍTICO: Se estamos no domínio correto ou no backend Railway, NUNCA redirecionar
  // Isso evita ERR_TOO_MANY_REDIRECTS com Cloudflare (Flexible SSL ou regras conflitantes)
  // Isso evita loops quando o Next.js usa 0.0.0.0:3000 como URL base (normal em produção)
  if (isCorrectDomain) {
    const response = NextResponse.next()
    // Raiz com query string (ex.: ?code=): não cachear para o redirect no servidor funcionar
    if (pathname === '/' && url.search) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    }

    const isPublicRoute = ['/', '/login', '/cadastro', '/planos', '/termos', '/privacidade', '/suporte'].includes(pathname) || pathname === '/'
    
    if (pathname.startsWith('/administracaosecr') || 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/home') ||
        pathname.startsWith('/onboarding') ||
        pathname.startsWith('/api')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    } else if (isPublicRoute) {
      response.headers.set('X-Robots-Tag', 'index, follow')
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    } else {
      response.headers.set('X-Robots-Tag', 'index, follow')
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
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
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  } else if (isPublicRoute) {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  } else {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  return response
}

// Aplicar a todas as rotas (exceto assets e API para evitar 404 em chunks do Next)
export const config = {
  matcher: [
    /*
     * Excluir: api, todo _next (chunks, static, image, HMR), next/static, favicon, robots, sitemap.
     * Assim o middleware não toca em nada que o Next.js usa para carregar a página.
     */
    '/((?!api|_next|next/static|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
