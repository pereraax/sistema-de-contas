'use client'

import { useEffect, useRef } from 'react'

const PING_INTERVAL_MS = 30_000

/** Envia ping de presença a cada 30s quando o usuário está com o app aberto (logado). */
export default function PresencePing() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function ping() {
      fetch('/api/user/presence', { method: 'POST', credentials: 'include' }).catch(() => {})
    }

    ping()
    intervalRef.current = setInterval(ping, PING_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return null
}
