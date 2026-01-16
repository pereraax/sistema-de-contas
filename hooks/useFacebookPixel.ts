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
      console.log('🚀 [Facebook Pixel] Inicializando Pixel ID:', pixelId)

      // CRÍTICO: Inicializar fbq ANTES de qualquer coisa (padrão oficial do Facebook)
      // Isso é ESSENCIAL para a extensão Meta Pixel Helper detectar o pixel
      if (!window.fbq) {
        window.fbq = function() {
          // @ts-ignore
          (window.fbq.q = window.fbq.q || []).push(arguments)
        }
        // @ts-ignore
        window.fbq.l = +new Date()
        // @ts-ignore
        window.fbq.version = '2.0'
        console.log('✅ [Facebook Pixel] Função fbq criada')
      }

      // Verificar se o script já foi adicionado
      const existingScript = document.getElementById('facebook-pixel-base-script')
      if (existingScript) {
        // Script já existe, apenas reinicializar
        console.log('✅ [Facebook Pixel] Script já existe, reinicializando...')
        if (window.fbq) {
          window.fbq('init', pixelId)
          window.fbq('track', 'PageView')
        }
        return
      }

      // CRÍTICO: Inicializar o pixel ANTES de carregar o script
      // Isso garante que a extensão Meta Pixel Helper detecte imediatamente
      if (window.fbq) {
        window.fbq('init', pixelId)
        window.fbq('track', 'PageView')
        console.log('✅ [Facebook Pixel] Pixel inicializado ANTES do script carregar:', pixelId)
      }

      // Carregar script do Facebook Pixel
      const script = document.createElement('script')
      script.id = 'facebook-pixel-base-script'
      script.async = true
      script.defer = false // Não usar defer para garantir carregamento imediato
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      
      script.onload = () => {
        console.log('✅ [Facebook Pixel] Script fbevents.js carregado com sucesso')
        // Re-inicializar após o script carregar (garantir que está ativo)
        if (window.fbq) {
          window.fbq('init', pixelId)
          window.fbq('track', 'PageView')
          console.log('✅ [Facebook Pixel] Pixel reinicializado após script carregar')
        }
      }

      script.onerror = () => {
        console.error('❌ [Facebook Pixel] Erro ao carregar script do Facebook Pixel')
      }

      // Adicionar script ao head (não ao body)
      document.head.appendChild(script)
      console.log('✅ [Facebook Pixel] Script adicionado ao head')
      
    } catch (error) {
      console.error('❌ [Facebook Pixel] Erro ao inicializar Facebook Pixel:', error)
    }
  }, [pixelId])
}

