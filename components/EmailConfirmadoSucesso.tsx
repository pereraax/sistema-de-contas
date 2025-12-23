'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createNotification } from './NotificationBell'

export default function EmailConfirmadoSucesso() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const emailConfirmed = searchParams.get('emailConfirmed')
    
    if (emailConfirmed === 'true') {
      createNotification('✅ Email confirmado com sucesso! Seu email foi verificado.', 'success')
      
      // Limpar parâmetro da URL sem recarregar a página
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('emailConfirmed')
      router.replace(newUrl.pathname + (newUrl.search ? newUrl.search : ''))
    }
  }, [searchParams, router])

  return null
}
















