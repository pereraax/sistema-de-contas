'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

/**
 * Página intermediária para corrigir redirects de 0.0.0.0:10000
 * Esta página recebe o redirect do Supabase e redireciona para o domínio correto
 */
export default function RedirectFixPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  useEffect(() => {
    // Verificar se está em localhost ou 0.0.0.0:10000 (não deveria chegar aqui com middleware)
    const host = window.location.host
    
    if (host.includes('0.0.0.0') || host.includes('10000')) {
      console.error('🚫 [RedirectFix] URL INVÁLIDA DETECTADA:', host)
      console.error('🚫 [RedirectFix] Redirecionando para plenipay.com...')
      
      // Construir URL correta preservando todos os parâmetros
      const productionUrl = 'https://plenipay.com'
      const pathname = window.location.pathname
      const search = window.location.search
      const hash = window.location.hash
      
      const redirectUrl = `${productionUrl}${pathname}${search}${hash}`
      
      console.log('🔄 [RedirectFix] Redirecionando para:', redirectUrl)
      
      // Redirecionar imediatamente
      window.location.replace(redirectUrl)
      return
    }
    
    // Se já está no domínio correto, redirecionar para auth/callback ou home
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') || '/home'
    
    if (tokenHash && type) {
      // Tem parâmetros de confirmação, redirecionar para callback
      const callbackUrl = `/auth/callback?${searchParams.toString()}`
      console.log('🔄 [RedirectFix] Redirecionando para callback:', callbackUrl)
      router.replace(callbackUrl)
    } else {
      // Sem parâmetros, redirecionar para home
      console.log('🔄 [RedirectFix] Redirecionando para home:', next)
      router.replace(next)
    }
  }, [searchParams, router])
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>
        Redirecionando...
      </h1>
      <p style={{ color: '#666', fontSize: '16px' }}>
        Aguarde enquanto redirecionamos para o domínio correto.
      </p>
    </div>
  )
}
