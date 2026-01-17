'use client'

import { useEffect } from 'react'

/**
 * Componente que notifica o Google sobre atualizações do site
 * Isso pode acelerar a indexação
 */
export default function GoogleIndexPing() {
  useEffect(() => {
    // Só executa no cliente e em produção
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return
    }

    // Ping do Google para notificar sobre atualizações
    // Isso pode acelerar a indexação
    const pingGoogle = async () => {
      try {
        const sitemapUrl = 'https://plenipay.com/sitemap.xml'
        
        // Notificar Google sobre o sitemap (via fetch para API do Google)
        // Nota: A forma oficial é via Search Console, mas isso pode ajudar
        fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`, {
          method: 'GET',
          mode: 'no-cors', // CORS não é necessário aqui
        }).catch(() => {
          // Ignorar erros silenciosamente
        })
      } catch (error) {
        // Ignorar erros
      }
    }

    // Executar apenas uma vez quando a página carregar
    pingGoogle()
  }, [])

  return null
}

