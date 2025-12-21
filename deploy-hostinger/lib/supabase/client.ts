import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Configurar cookies explicitamente para garantir que sejam salvos
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
