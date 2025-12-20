'use client'

import { useEffect, useState } from 'react'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Aplicar tema salvo ao carregar a página (antes de setMounted para evitar flash)
    try {
      const savedTheme = localStorage.getItem('theme')
      const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
      
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (error) {
      console.error('Erro ao aplicar tema:', error)
    }
    
    // Marcar como montado após aplicar o tema
    setMounted(true)
  }, [])

  // Renderizar children imediatamente (não esperar mounted)
  // O CSS já cuida do background
  return <>{children}</>
}





