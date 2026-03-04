'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminProtected({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [shouldRender, setShouldRender] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === '/administracaosecr/login' || pathname === '/administracaosecr') {
      setShouldRender(true)
      setIsLoading(false)
      setAuthError(null)
      return
    }

    let cancelled = false
    const checkAuth = async () => {
      try {
        const cookies = document.cookie.split(';')
        const adminToken = cookies.find((c) => c.trim().startsWith('admin_token='))

        if (!adminToken) {
          if (!cancelled) {
            setAuthError('Faça login para acessar o painel.')
            setIsLoading(false)
          }
          return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        try {
          const response = await fetch('/api/admin/verify', {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          if (cancelled) return

          if (!response.ok) {
            setAuthError('Sessão expirada ou inválida.')
            setIsLoading(false)
            return
          }
          setShouldRender(true)
          setIsLoading(false)
          setAuthError(null)
        } catch (fetchError: unknown) {
          clearTimeout(timeoutId)
          if (cancelled) return
          const err = fetchError as { name?: string }
          if (err.name === 'AbortError') {
            setAuthError('Verificação demorou. Tente novamente ou faça login.')
          } else {
            setAuthError('Erro ao verificar autenticação. Faça login.')
          }
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setAuthError('Erro inesperado. Faça login.')
          setIsLoading(false)
        }
      }
    }

    checkAuth()
    return () => {
      cancelled = true
    }
  }, [pathname])

  if (pathname === '/administracaosecr/login' || pathname === '/administracaosecr') {
    return <>{children}</>
  }

  if (isLoading && !authError) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-white/90">Verificando autenticação...</div>
        <div className="h-1 w-32 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-1/2 animate-pulse bg-white/50 rounded-full" />
        </div>
      </div>
    )
  }

  if (authError || !shouldRender) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center gap-6 p-6">
        <p className="text-white/90 text-center">{authError ?? 'Sessão inválida.'}</p>
        <Link
          href="/administracaosecr/login"
          className="px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors"
        >
          Fazer login
        </Link>
      </div>
    )
  }

  return <>{children}</>
}

