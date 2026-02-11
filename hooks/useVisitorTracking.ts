'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useVisitorTracking() {
  const pathname = usePathname()

  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch('/api/visitors/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname ?? '/',
            referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          }),
        })
      } catch (error) {
        console.error('Erro ao rastrear visita:', error)
      }
    }

    // Registrar imediatamente (cada acesso conta em "Visitantes Hoje")
    trackVisit()
    // Manter sessão ativa a cada 30s (conta em "Visitantes Online")
    const activityInterval = setInterval(trackVisit, 30000)
    return () => clearInterval(activityInterval)
  }, [pathname])
}














