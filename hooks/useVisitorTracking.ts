'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useVisitorTracking() {
  const pathname = usePathname()

  useEffect(() => {
    // Registrar visita quando a rota mudar
    const trackVisit = async () => {
      try {
        await fetch('/api/visitors/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || null,
          }),
        })
      } catch (error) {
        console.error('Erro ao rastrear visita:', error)
      }
    }

    // Registrar visita inicial
    trackVisit()

    // Atualizar atividade a cada 30 segundos enquanto o usuário está na página
    const activityInterval = setInterval(() => {
      trackVisit()
    }, 30000) // 30 segundos

    return () => clearInterval(activityInterval)
  }, [pathname])
}













