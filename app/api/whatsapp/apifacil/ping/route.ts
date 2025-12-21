/**
 * Endpoint simples para testar se o servidor está acessível
 */

import { NextRequest, NextResponse } from 'next/server'
import { addWebhookLog } from '@/lib/webhook-logs'

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = request.nextUrl.protocol || 'http'
  
  // Registrar log de teste
  addWebhookLog({
    timestamp,
    method: 'GET',
    body: { test: true, endpoint: 'ping' },
    response: { status: 'success', message: 'Ping recebido' },
  })
  
  return NextResponse.json({
    success: true,
    message: 'Pong! Servidor está funcionando!',
    timestamp,
    servidor: {
      host,
      protocol,
      url: `${protocol}//${host}`,
    },
    webhook: {
      url: `${protocol}//${host}/api/whatsapp/apifacil/webhook`,
      status: 'ativo',
    },
    instrucoes: {
      passo1: 'Se você está usando túnel, acesse via URL do túnel',
      passo2: 'Exemplo: https://seu-tunel.loca.lt/api/whatsapp/apifacil/ping',
      passo3: 'Configure o webhook no apifacil.dev: https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook',
    }
  })
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  try {
    const body = await request.json().catch(() => ({}))
    
    // Registrar log
    addWebhookLog({
      timestamp,
      method: 'POST',
      body: body,
      response: { status: 'success', endpoint: 'ping' },
    })
    
    return NextResponse.json({
      success: true,
      message: 'POST recebido com sucesso!',
      timestamp,
      body: body,
      info: 'Se você vê esta mensagem, o endpoint está funcionando e recebendo POST',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}










