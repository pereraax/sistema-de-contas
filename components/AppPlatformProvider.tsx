'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

/** true = aberto dentro do app (Capacitor); false = site normal no navegador */
const AppPlatformContext = createContext<boolean>(false)

function hasPlatformAppCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim() === 'platform=app')
}

function setPlatformAppCookie() {
  if (typeof document === 'undefined') return
  // Em dev (http) não pode ser secure; em prod (https) o browser aceita secure.
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const secure = isHttps ? '; Secure' : ''
  document.cookie = `platform=app; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
}

export function AppPlatformProvider({
  initialIsApp,
  children,
}: {
  initialIsApp: boolean
  children: React.ReactNode
}) {
  const [isApp, setIsApp] = useState<boolean>(!!initialIsApp)

  // Importante: em Capacitor/iOS, o retorno do OAuth pode perder o cookie no SSR.
  // Então fazemos um “upgrade” no cliente se detectarmos app por query, cookie, localStorage ou Capacitor global.
  useEffect(() => {
    if (isApp) return
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const isAppByQuery = params.get('platform') === 'app'
    const isAppByCookie = hasPlatformAppCookie()
    let isAppByStorage = false
    try {
      isAppByStorage = window.localStorage.getItem('platform') === 'app'
    } catch {
      isAppByStorage = false
    }
    const isAppByCapacitor = !!(window as any)?.Capacitor

    const detected = isAppByQuery || isAppByCookie || isAppByStorage || isAppByCapacitor
    if (!detected) return

    // Persistir para SSR das próximas rotas.
    try {
      window.localStorage.setItem('platform', 'app')
    } catch {
      // ignore
    }
    setPlatformAppCookie()

    setIsApp(true)
  }, [isApp])

  const value = useMemo(() => !!isApp, [isApp])
  return (
    <AppPlatformContext.Provider value={value}>
      {children}
    </AppPlatformContext.Provider>
  )
}

export function useAppPlatform(): boolean {
  return useContext(AppPlatformContext)
}
