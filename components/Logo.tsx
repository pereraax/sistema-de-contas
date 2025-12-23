'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Logo() {
  const [imageError, setImageError] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detectar modo escuro/claro
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    // Verificar inicialmente
    checkDarkMode()

    // Observar mudanças no tema
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Usar logo azul no modo claro e logo de 2 cores no modo escuro
  const logoSrc = isDarkMode ? '/2 cores.png' : '/logo azul.png'

  if (imageError) {
    // Fallback: mostrar texto do logo se a imagem não carregar
    return (
      <Link href="/home" className="flex items-center justify-center py-2 px-3 w-full cursor-pointer hover:opacity-80 transition-opacity">
        <div className="text-2xl font-bold text-brand-aqua">
          PLENIPAY
        </div>
      </Link>
    )
  }

  return (
    <Link href="/home" className="flex items-center justify-center py-1 px-2 w-full cursor-pointer hover:opacity-80 transition-opacity">
      <Image 
        src={logoSrc} 
        alt="PLENIPAY" 
        width={240}
        height={60}
        className="w-full h-auto object-contain"
        style={{ 
          maxHeight: '65px',
          width: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
        priority
        unoptimized
        onError={() => setImageError(true)}
      />
    </Link>
  )
}

