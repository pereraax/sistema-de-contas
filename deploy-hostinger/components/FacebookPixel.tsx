'use client'

import { useEffect } from 'react'

interface FacebookPixelProps {
  pixelId: string
}

declare global {
  interface Window {
    fbq: any
    _fbq: any
  }
}

export default function FacebookPixel({ pixelId }: FacebookPixelProps) {
  useEffect(() => {
    if (!pixelId) return

    // Verificar se o script já foi adicionado
    if (document.getElementById('facebook-pixel-script')) {
      // Se o script já existe, apenas inicializar com o novo pixel ID
      if (window.fbq) {
        window.fbq('init', pixelId)
        window.fbq('track', 'PageView')
      }
      return
    }

    // Inicializar o Pixel do Facebook usando script tag
    if (!window.fbq) {
      const script = document.createElement('script')
      script.id = 'facebook-pixel-base-script'
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      document.head.appendChild(script)

      // Inicializar fbq após o script carregar
      script.onload = () => {
        if (!window.fbq) {
          window.fbq = function() {
            // @ts-ignore
            (window.fbq.q = window.fbq.q || []).push(arguments)
          }
          window.fbq.l = +new Date()
          window.fbq.version = '2.0'
        }
        if (window.fbq) {
          window.fbq('init', pixelId)
          window.fbq('track', 'PageView')
        }
      }
    } else {
      // Se fbq já existe, apenas inicializar
      try {
        window.fbq('init', pixelId)
        window.fbq('track', 'PageView')
      } catch (error) {
        console.error('Erro ao inicializar Facebook Pixel:', error)
      }
    }
  }, [pixelId])

  return null
}

