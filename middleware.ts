import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que devem ser indexadas pelo Google
const publicRoutes = ['/', '/login', '/cadastro', '/planos', '/termos', '/privacidade', '/suporte']

// Middleware para forçar renderização dinâmica em rotas específicas
// Isso evita que o Next.js tente fazer prerendering estático
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
