/**
 * Teste simples para verificar se o webhook está sendo chamado
 */

import { NextRequest, NextResponse } from 'next/server'
import { addWebhookLog, getWebhookLogs } from '@/lib/webhook-logs'

export async function GET() {
  const logs = getWebhookLogs()
  
  return NextResponse.json({
    success: true,
    message: 'Endpoint de teste do webhook',
    totalLogs: logs.length,
    ultimosLogs: logs.slice(0, 5),
    instrucoes: {
      passo1: 'Este endpoint mostra os últimos logs do webhook',
      passo2: 'Se não há logs, o webhook não está sendo chamado',
      passo3: 'Verifique se o túnel está rodando e a URL está correta no apifacil.dev',
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
      response: { status: 'test', endpoint: 'testar-webhook-simples' },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Webhook de teste recebido!',
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








