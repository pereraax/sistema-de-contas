/**
 * Testar se o túnel está funcionando e acessível
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.nextUrl.protocol || 'http'
  
  return NextResponse.json({
    success: true,
    message: 'Teste de túnel',
    servidor: {
      host,
      protocol,
      url: `${protocol}//${host}`,
    },
    webhook: {
      url: `${protocol}//${host}/api/whatsapp/apifacil/webhook`,
      metodo: 'POST',
    },
    instrucoes: {
      passo1: 'Se você está acessando via localtunnel, a URL deve ser:',
      passo2: 'https://weak-cycles-go.loca.lt/api/whatsapp/apifacil/webhook',
      passo3: 'Configure essa URL no painel do apifacil.dev',
      passo4: 'Envie "oi" pelo WhatsApp e verifique os logs',
    },
    teste: {
      endpoint: '/api/whatsapp/apifacil/webhook',
      metodo: 'GET',
      descricao: 'Acesse este endpoint para verificar se está funcionando',
    }
  })
}

export async function POST(request: NextRequest) {
  // Simular recebimento de webhook
  const body = await request.json().catch(() => ({}))
  
  return NextResponse.json({
    success: true,
    message: 'Webhook de teste recebido!',
    timestamp: new Date().toISOString(),
    body: body,
    info: 'Se você vê esta mensagem, o endpoint está funcionando',
  })
}











