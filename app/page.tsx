import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import LandingPageClient from '@/components/LandingPageClient'

export const dynamic = 'force-dynamic'

/**
 * Página raiz: se a URL tiver ?code= (retorno do Google OAuth), redireciona no SERVIDOR
 * para /auth/callback antes de pintar a landing. No app (cookie platform=app) manda para
 * /onboarding (página de bem-vindo); no site manda para /home.
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const code =
    typeof params?.code === 'string'
      ? params.code
      : Array.isArray(params?.code)
        ? params.code[0]
        : undefined

  if (code) {
    const q = new URLSearchParams()
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === '') return
      q.set(k, Array.isArray(v) ? v[0] : v)
    })
    try {
      const cookieStore = await cookies()
      const isApp = cookieStore.get('platform')?.value === 'app'
      if (!q.has('next')) q.set('next', isApp ? '/onboarding' : '/home')
      if (isApp && !q.has('platform')) q.set('platform', 'app')
    } catch {
      if (!q.has('next')) q.set('next', '/home')
    }
    redirect('/auth/callback?' + q.toString())
  }

  return <LandingPageClient />
}
