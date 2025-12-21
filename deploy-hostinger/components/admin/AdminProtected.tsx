'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminProtected({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Se for a rota de login, renderizar sem verificação
    if (pathname === '/administracaosecr/login') {
      setShouldRender(true)
      setIsLoading(false)
      return
    }

    // Verificar token com timeout
    const checkAuth = async () => {
      try {
        const cookies = document.cookie.split(';')
        const adminToken = cookies.find(c => c.trim().startsWith('admin_token='))
        
        if (!adminToken) {
          router.replace('/administracaosecr/login')
          return
        }

        // Verificar se o token é válido com timeout de 3 segundos
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        
        try {
          const response = await fetch('/api/admin/verify', {
            method: 'GET',
            credentials: 'include',
            signal: controller.signal,
          })
          
          clearTimeout(timeoutId)

          if (!response.ok) {
            router.replace('/administracaosecr/login')
            return
          }

          setShouldRender(true)
          setIsLoading(false)
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          
          // Se foi timeout, permitir renderizar mesmo assim (melhor UX)
          if (fetchError.name === 'AbortError') {
            console.warn('⚠️ [AdminProtected] Timeout na verificação de autenticação, permitindo acesso')
            setShouldRender(true)
            setIsLoading(false)
          } else {
            router.replace('/administracaosecr/login')
          }
        }
      } catch (error) {
        router.replace('/administracaosecr/login')
      }
    }

    checkAuth()
    
    // Timeout de segurança: se passar de 3 segundos, permitir acesso
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ [AdminProtected] Timeout de segurança, permitindo acesso')
      setShouldRender(true)
      setIsLoading(false)
    }, 3000)
    
    return () => clearTimeout(safetyTimeout)
  }, [pathname, router])

  // Se for login, renderizar normalmente
  if (pathname === '/administracaosecr/login') {
    return <>{children}</>
  }

  // Se estiver carregando, mostrar loading
  if (isLoading || !shouldRender) {
    return (
      <div className="min-h-screen bg-brand-midnight flex items-center justify-center">
        <div className="text-brand-clean">Verificando autenticação...</div>
      </div>
    )
  }

  return <>{children}</>
}

