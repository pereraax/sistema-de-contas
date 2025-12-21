import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware para forçar renderização dinâmica em todas as rotas
// Isso evita que o Next.js tente fazer prerendering estático
export function middleware(request: NextRequest) {
  // Adicionar header para forçar renderização dinâmica
  const response = NextResponse.next()
  
  // Forçar cache-control para evitar cache estático
  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
