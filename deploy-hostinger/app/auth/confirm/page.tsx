'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Página intermediária para interceptar links de confirmação de email
 * que contenham 0.0.0.0:10000 e redirecionar para o domínio correto
 * 
 * Esta página funciona como uma camada de proteção no CLIENTE
 * que intercepta ANTES do navegador tentar acessar 0.0.0.0:10000
 */
export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Verificar se estamos no cliente e se a URL contém 0.0.0.0:10000
    if (typeof window === 'undefined') return
    
    const currentUrl = window.location.href
    const currentHost = window.location.host
    
    console.log('🔍 [ConfirmPage] Verificando URL:', currentUrl)
    console.log('🔍 [ConfirmPage] Host atual:', currentHost)
    
    // Se já estamos no domínio correto, redirecionar para callback
    if (!currentHost.includes('0.0.0.0') && !currentHost.includes('10000')) {
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const next = searchParams.get('next') || '/home'
      
      if (tokenHash && type) {
        // Construir URL do callback com todos os parâmetros
        const callbackUrl = `/auth/callback?token_hash=${tokenHash}&type=${type}&next=${next}`
        console.log('✅ [ConfirmPage] Redirecionando para callback:', callbackUrl)
        router.replace(callbackUrl)
      } else {
        // Sem parâmetros necessários, ir para home
        console.log('⚠️ [ConfirmPage] Sem parâmetros de confirmação, redirecionando para home')
        router.replace('/home')
      }
      return
    }
    
    // Se chegou aqui, estamos em 0.0.0.0:10000 - CORRIGIR IMEDIATAMENTE
    console.error('❌ [ConfirmPage] URL INVÁLIDA DETECTADA:', currentHost)
    console.error('❌ [ConfirmPage] Redirecionando para plenipay.com...')
    
    // Construir URL correta preservando TODOS os parâmetros
    const productionUrl = 'https://plenipay.com'
    const pathname = window.location.pathname
    const search = window.location.search
    const hash = window.location.hash
    
    // Extrair parâmetros do hash também (Supabase pode colocar parâmetros lá)
    let finalSearch = search
    if (hash && hash.includes('token_hash')) {
      try {
        const hashParams = new URLSearchParams(hash.substring(1))
        const searchParamsObj = new URLSearchParams(search)
        
        // Adicionar parâmetros do hash à query string
        hashParams.forEach((value, key) => {
          if (!searchParamsObj.has(key)) {
            searchParamsObj.set(key, value)
          }
        })
        
        finalSearch = '?' + searchParamsObj.toString()
        console.log('🔍 [ConfirmPage] Parâmetros do hash adicionados:', finalSearch)
      } catch (err) {
        console.error('⚠️ [ConfirmPage] Erro ao processar hash:', err)
      }
    }
    
    // Construir URL final
    let redirectUrl = `${productionUrl}${pathname}${finalSearch}`
    
    // Se estamos em /auth/confirm mas temos token_hash, redirecionar para /auth/callback
    if (pathname.includes('/auth/confirm') || pathname.includes('/confirm')) {
      const tokenHash = searchParams.get('token_hash') || 
                       (hash ? new URLSearchParams(hash.substring(1)).get('token_hash') : null)
      const type = searchParams.get('type') || 
                   (hash ? new URLSearchParams(hash.substring(1)).get('type') : null)
      const next = searchParams.get('next') || '/home'
      
      if (tokenHash && type) {
        redirectUrl = `${productionUrl}/auth/callback?token_hash=${tokenHash}&type=${type}&next=${next}`
        console.log('🔄 [ConfirmPage] Redirecionando para callback com parâmetros extraídos')
      } else {
        redirectUrl = `${productionUrl}/auth/callback${finalSearch}`
        console.log('🔄 [ConfirmPage] Redirecionando para callback mantendo parâmetros')
      }
    }
    
    console.log('🔄 [ConfirmPage] Redirecionando para:', redirectUrl)
    
    // IMPORTANTE: Usar window.location.replace() para substituir a entrada do histórico
    // Isso evita que o usuário volte para a página de erro
    window.location.replace(redirectUrl)
  }, [router, searchParams])
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{ 
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto',
            borderRadius: '50%',
            backgroundColor: '#1e4976',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
        </div>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: '#333'
        }}>
          Redirecionando...
        </h1>
        <p style={{ 
          color: '#666', 
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Estamos corrigindo o link e redirecionando você para a página correta.
        </p>
        <div style={{ marginTop: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #1e4976',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
