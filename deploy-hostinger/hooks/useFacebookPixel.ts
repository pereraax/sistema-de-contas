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
        // Usar cache: 'no-store' para sempre buscar a versão mais recente
        const responseId = await fetch('/api/admin/platform-config?key=facebook_pixel_id', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (responseId.ok) {
          const dataId = await responseId.json()
          if (dataId.value && typeof dataId.value === 'string' && dataId.value.trim() !== '') {
            const id = dataId.value.trim()
            setPixelId(id)
            console.log('✅ [Facebook Pixel] Pixel ID carregado:', id)
          } else {
            console.log('⚠️ [Facebook Pixel] Nenhum Pixel ID configurado')
          }
        } else {
          console.warn('⚠️ [Facebook Pixel] Erro ao buscar Pixel ID:', responseId.status, responseId.statusText)
        }

        // Buscar Pixel Token da configuração global (opcional)
        const responseToken = await fetch('/api/admin/platform-config?key=facebook_pixel_token', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        
        if (responseToken.ok) {
          const dataToken = await responseToken.json()
          if (dataToken.value && typeof dataToken.value === 'string' && dataToken.value.trim() !== '') {
            setPixelToken(dataToken.value.trim())
            console.log('✅ [Facebook Pixel] Pixel Token carregado')
          }
        }
      } catch (error) {
        console.error('❌ [Facebook Pixel] Erro ao carregar configurações do Pixel:', error)
      }
    }

    carregarPixel()
  }, [])

  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') {
      return
    }

    try {
      // Verificar se o Pixel já foi inicializado pelo componente server-side
      // Se já existe fbq e já foi inicializado, não fazer nada (evitar duplicação)
      if (window.fbq && window.fbq.loaded) {
        console.log('✅ [Facebook Pixel] Pixel já inicializado pelo server-side, pulando inicialização client-side')
        return
      }

      console.log('🚀 [Facebook Pixel] Inicializando Pixel ID (client-side fallback):', pixelId)

      // Se fbq não existe, criar (fallback caso server-side não tenha funcionado)
      if (!window.fbq) {
        window.fbq = function() {
          // @ts-ignore
          (window.fbq.q = window.fbq.q || []).push(arguments)
        }
        // @ts-ignore
        window.fbq.l = +new Date()
        // @ts-ignore
        window.fbq.version = '2.0'
        console.log('✅ [Facebook Pixel] Função fbq criada (client-side)')
      }

      // Verificar se o script já foi adicionado (pelo server-side ou anteriormente)
      const existingScript = document.getElementById('facebook-pixel-init') || 
                            document.getElementById('facebook-pixel-base-script')
      
      if (existingScript) {
        // Script já existe, apenas garantir que está inicializado
        console.log('✅ [Facebook Pixel] Script já existe, garantindo inicialização...')
        if (window.fbq) {
          window.fbq('init', pixelId)
          window.fbq('track', 'PageView')
        }
        return
      }

      // Se chegou aqui, o server-side não funcionou, então inicializar client-side
      // Inicializar o pixel ANTES de carregar o script
      if (window.fbq) {
        window.fbq('init', pixelId)
        window.fbq('track', 'PageView')
        console.log('✅ [Facebook Pixel] Pixel inicializado (client-side fallback):', pixelId)
      }

      // Carregar script do Facebook Pixel (apenas se não existir)
      const script = document.createElement('script')
      script.id = 'facebook-pixel-base-script'
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      
      script.onload = () => {
        console.log('✅ [Facebook Pixel] Script fbevents.js carregado (client-side)')
        // Re-inicializar após o script carregar
        if (window.fbq) {
          window.fbq('init', pixelId)
          window.fbq('track', 'PageView')
        }
      }

      script.onerror = () => {
        console.error('❌ [Facebook Pixel] Erro ao carregar script do Facebook Pixel')
      }

      // Adicionar script ao head
      document.head.appendChild(script)
      console.log('✅ [Facebook Pixel] Script adicionado ao head (client-side)')
      
    } catch (error) {
      console.error('❌ [Facebook Pixel] Erro ao inicializar Facebook Pixel:', error)
    }
  }, [pixelId])
}

