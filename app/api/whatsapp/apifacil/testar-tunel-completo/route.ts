/**
 * Teste completo do túnel e webhook
 * Verifica se o túnel está funcionando e se o webhook está acessível
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const protocol = request.nextUrl.protocol || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    
    // URL do webhook
    const webhookUrl = `${protocol}//${host}/api/whatsapp/apifacil/webhook`
    
    // Testar se o webhook está acessível
    let webhookAccessible = false
    let webhookError: string | null = null
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'PLEN-Test/1.0',
        },
      })
      
      if (response.ok) {
        webhookAccessible = true
      } else {
        webhookError = `Status ${response.status}: ${response.statusText}`
      }
    } catch (error: any) {
      webhookError = error.message
    }
    
    // Verificar variáveis de ambiente
    const hasInstanceId = !!process.env.APIFACIL_INSTANCE_ID
    const hasToken = !!process.env.APIFACIL_TOKEN
    
    return NextResponse.json({
      success: true,
      webhook: {
        url: webhookUrl,
        accessible: webhookAccessible,
        error: webhookError,
        instructions: {
          passo1: 'Copie a URL acima',
          passo2: 'Acesse o painel do apifacil.dev',
          passo3: 'Cole a URL no campo "Webhook URL"',
          passo4: 'Certifique-se de que o túnel está rodando (npm run tunnel)',
          passo5: 'A URL deve terminar com /api/whatsapp/apifacil/webhook',
        },
      },
      config: {
        hasInstanceId,
        hasToken,
        configured: hasInstanceId && hasToken,
      },
      tunnel: {
        instructions: {
          passo1: 'Execute: npm run tunnel',
          passo2: 'Copie a URL que aparecer (ex: https://xxxxx.loca.lt)',
          passo3: 'Use essa URL no apifacil.dev: https://xxxxx.loca.lt/api/whatsapp/apifacil/webhook',
          passo4: 'IMPORTANTE: O túnel deve estar rodando enquanto você usa o sistema',
        },
      },
      test: {
        endpoint: webhookUrl,
        method: 'POST',
        exemplo: {
          body: {
            event: 'whatsapp_insert',
            remetente: '5511999999999',
            mensagem: 'oi',
            tipo_envio: 'MENSAGEM_RECEBIDA',
          },
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}










