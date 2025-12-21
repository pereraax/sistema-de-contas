/**
 * Testar se o endpoint está acessível
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.nextUrl.protocol || 'http'
  
  return NextResponse.json({
    success: true,
    message: 'Endpoint de teste funcionando!',
    timestamp: new Date().toISOString(),
    servidor: {
      host,
      protocol,
      url: `${protocol}//${host}`,
    },
    endpoints: {
      webhook: `${protocol}//${host}/api/whatsapp/apifacil/webhook`,
      testar: `${protocol}//${host}/api/whatsapp/apifacil/testar-endpoint`,
      logs: `${protocol}//${host}/api/whatsapp/apifacil/logs`,
    },
    instrucoes: {
      passo1: 'Se você está usando túnel, acesse via URL do túnel',
      passo2: 'Exemplo: https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook',
      passo3: 'Configure essa URL no painel do apifacil.dev',
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  
  return NextResponse.json({
    success: true,
    message: 'POST recebido com sucesso!',
    timestamp: new Date().toISOString(),
    body: body,
    info: 'Se você vê esta mensagem, o endpoint está funcionando e recebendo POST',
  })
}










