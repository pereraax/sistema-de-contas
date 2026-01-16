'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    fbq?: any
  }
}

export function useFacebookPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null)
  const [pixelToken, setPixelToken] = useState<string | null>(null)

  useEffect(() => {
    // Só executa no cliente
    if (typeof window === 'undefined') return

    const carregarPixel = async () => {
      try {
        // Buscar Pixel ID da configuração global
        const responseId = await fetch('/api/admin/platform-config?key=facebook_pixel_id')
        
        if (responseId.ok) {
          const dataId = await responseId.json()
          if (dataId.value && typeof dataId.value === 'string' && dataId.value.trim() !== '') {
            setPixelId(dataId.value.trim())
          }
        }

        // Buscar Pixel Token da configuração global (opcional)
        const responseToken = await fetch('/api/admin/platform-config?key=facebook_pixel_token')
        
        if (responseToken.ok) {
          const dataToken = await responseToken.json()
          if (dataToken.value && typeof dataToken.value === 'string' && dataToken.value.trim() !== '') {
            setPixelToken(dataToken.value.trim())
          }
        }
      } catch (error) {
        // Silenciar todos os erros para não quebrar a aplicação
        console.error('Erro ao carregar configurações do Pixel:', error)
      }
    }

    carregarPixel()
  }, [])

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return

    try {
      // Inicializar fbq ANTES de carregar o script (padrão do Facebook)
      if (!window.fbq) {
        window.fbq = function() {
          // @ts-ignore
          (window.fbq.q = window.fbq.q || []).push(arguments)
        }
        // @ts-ignore
        window.fbq.l = +new Date()
        // @ts-ignore
        window.fbq.version = '2.0'
      }

      // Verificar se o script já foi adicionado
      if (document.getElementById('facebook-pixel-base-script')) {
        // Script já existe, apenas inicializar
        window.fbq('init', pixelId)
        window.fbq('track', 'PageView')
        return
      }

      // Carregar script do Facebook Pixel
      const script = document.createElement('script')
      script.id = 'facebook-pixel-base-script'
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      
      script.onload = () => {
        // Inicializar o pixel após o script carregar
        if (window.fbq) {
          window.fbq('init', pixelId)
          window.fbq('track', 'PageView')
          console.log('✅ [Facebook Pixel] Pixel inicializado:', pixelId)
        }
      }

      script.onerror = () => {
        console.error('❌ [Facebook Pixel] Erro ao carregar script do Facebook Pixel')
      }

      // Adicionar script ao head
      document.head.appendChild(script)

      // Inicializar imediatamente (antes do script carregar) - padrão do Facebook
      // Isso garante que eventos sejam capturados mesmo se o script demorar
      window.fbq('init', pixelId)
      window.fbq('track', 'PageView')
      
      console.log('✅ [Facebook Pixel] Pixel configurado:', pixelId)
    } catch (error) {
      console.error('❌ [Facebook Pixel] Erro ao inicializar Facebook Pixel:', error)
    }
  }, [pixelId])
}

