'use client'

import { useEffect } from 'react'

/**
 * Trava o scroll do body enquanto o modal estiver montado (ou enquanto active for true).
 * Evita que a página role por trás e que o conteúdo do modal "se mova" no mobile.
 * @param active - Se false, não aplica lock (útil para modais que renderizam como dropdown ou fullscreen condicionalmente).
 */
export function useModalBodyLock(active = true) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}
