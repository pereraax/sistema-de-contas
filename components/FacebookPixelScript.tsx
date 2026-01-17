import Script from 'next/script'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Componente Server-Side que busca o Pixel ID do banco e injeta o código diretamente no HTML
 * Isso garante que a extensão Meta Pixel Helper detecte o pixel imediatamente
 */
export default async function FacebookPixelScript() {
  // Buscar Pixel ID do banco de dados (server-side)
  let pixelId: string | null = null

  try {
    const supabaseAdmin = createAdminClient()
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('platform_config')
        .select('value')
        .eq('key', 'facebook_pixel_id')
        .single()

      if (!error && data?.value && typeof data.value === 'string' && data.value.trim() !== '') {
        pixelId = data.value.trim()
      }
    }
  } catch (error) {
    // Silenciar erro - o hook client-side fará fallback
    console.error('Erro ao buscar Pixel ID no servidor:', error)
  }

  // Se não tiver Pixel ID, não renderizar nada
  if (!pixelId) {
    return null
  }

  // Renderizar o código do Pixel diretamente no HTML
  // Isso é CRÍTICO para a extensão Meta Pixel Helper detectar
  return (
    <>
      {/* Inicializar fbq ANTES do script carregar (padrão oficial do Facebook) */}
      {/* Usar strategy="lazyOnload" para não bloquear carregamento inicial */}
      <Script
        id="facebook-pixel-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
    </>
  )
}

