import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Em produção, verificar se as variáveis estão disponíveis
  // Se não estiverem, usar valores padrão e logar erro no console
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `@supabase/ssr: Variáveis de ambiente do Supabase não configuradas!\n` +
      `Verifique se NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas.\n` +
      `Acesse: https://supabase.com/dashboard/project/_/settings/api para obter essas credenciais.`
    
    // Em produção, logar erro mas não quebrar a aplicação
    if (typeof window !== 'undefined') {
      console.error(errorMsg)
      console.error('Variáveis disponíveis:', {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'EXISTS' : 'MISSING',
      })
    }
    
    // Usar valores padrão se disponíveis (para desenvolvimento)
    const defaultUrl = 'https://frhxqgcqmxpjpnghsvoe.supabase.co'
    const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaHhxZ2NxbXhwanBuZ2hzdm9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTM3NTYsImV4cCI6MjA3OTIyOTc1Nn0.p1OxLRA5DKgvetuy-IbCfYClNSjrvK6fm43aZNX3T7I'
    
    // Se estiver em produção e não tiver as variáveis, lançar erro
    // Mas permitir que a aplicação continue com valores padrão se necessário
    if (process.env.NODE_ENV === 'production' && (!supabaseUrl || !supabaseAnonKey)) {
      // Em produção, usar valores padrão como fallback
      // Isso permite que a aplicação funcione mesmo se as variáveis não estiverem no build
      const finalUrl = supabaseUrl || defaultUrl
      const finalKey = supabaseAnonKey || defaultKey
      
      if (typeof window !== 'undefined') {
        console.warn('⚠️ Usando valores padrão do Supabase. Configure as variáveis de ambiente no Railway.')
      }
      
      return createBrowserClient(finalUrl, finalKey, {
        cookies: {
          getAll() {
            const cookies = document.cookie.split(';').map(cookie => cookie.trim())
            return cookies
              .filter(cookie => cookie.length > 0)
              .map(cookie => {
                const equalIndex = cookie.indexOf('=')
                if (equalIndex === -1) {
                  return { name: cookie, value: '' }
                }
                const name = cookie.substring(0, equalIndex).trim()
                const value = cookie.substring(equalIndex + 1).trim()
                try {
                  return { name, value: decodeURIComponent(value) }
                } catch {
                  return { name, value }
                }
              })
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookieString = `${name}=${encodeURIComponent(value)}`
              
              if (options?.maxAge) {
                cookieString += `; max-age=${options.maxAge}`
              }
              if (options?.domain) {
                cookieString += `; domain=${options.domain}`
              }
              if (options?.path) {
                cookieString += `; path=${options.path}`
              } else {
                cookieString += `; path=/`
              }
              if (options?.secure) {
                cookieString += `; secure`
              }
              if (options?.sameSite) {
                cookieString += `; samesite=${options.sameSite}`
              }
              
              document.cookie = cookieString
            })
          },
        },
      })
    }
    
    // Em desenvolvimento, lançar erro para alertar o desenvolvedor
    throw new Error(errorMsg)
  }

  // Configurar cookies explicitamente para garantir que sejam salvos
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          // Tentar com espaço e sem espaço (alguns navegadores podem salvar diferente)
          const cookies = document.cookie.split(';').map(cookie => cookie.trim())
          return cookies
            .filter(cookie => cookie.length > 0)
            .map(cookie => {
              const equalIndex = cookie.indexOf('=')
              if (equalIndex === -1) {
                return { name: cookie, value: '' }
              }
              const name = cookie.substring(0, equalIndex).trim()
              const value = cookie.substring(equalIndex + 1).trim()
              try {
                return { name, value: decodeURIComponent(value) }
              } catch {
                return { name, value }
              }
            })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}`
            
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`
            } else {
              cookieString += `; path=/`
            }
            if (options?.secure) {
              cookieString += `; secure`
            }
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`
            }
            
            document.cookie = cookieString
          })
        },
      },
    }
  )
}
