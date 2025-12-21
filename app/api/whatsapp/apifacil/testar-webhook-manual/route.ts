/**
 * Testar webhook manualmente simulando o que o apifacil.dev envia
 */

import { NextRequest, NextResponse } from 'next/server'
import { addWebhookLog, getWebhookLogs } from '@/lib/webhook-logs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    // Simular formato do apifacil.dev
    const testBody = {
      tipo: 'whatsapp_insert',
      data: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
        },
        message: {
          conversation: 'oi',
        },
        messageTimestamp: Date.now(),
      },
      ...body,
    }
    
    // Registrar log
    addWebhookLog({
      timestamp: new Date().toISOString(),
      method: 'POST',
      body: testBody,
      response: { status: 'test', manual: true },
    })
    
    // Fazer requisição para o webhook real
    const webhookUrl = `${request.nextUrl.protocol}//${request.headers.get('host')}/api/whatsapp/apifacil/webhook`
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBody),
      })
      
      const responseData = await response.json().catch(() => ({}))
      
      return NextResponse.json({
        success: true,
        message: 'Teste do webhook executado',
        webhookUrl,
        testBody,
        response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        },
        logs: {
          total: getWebhookLogs().length,
          ultimos: getWebhookLogs().slice(0, 3),
        },
        instrucoes: {
          passo1: 'Acesse: http://localhost:3000/whatsapp/logs-completos',
          passo2: 'Você deve ver o log de teste aparecer',
          passo3: 'Se aparecer, o sistema de logs está funcionando',
          passo4: 'Se não aparecer, há um problema no sistema de logs',
        }
      })
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao chamar webhook',
        message: fetchError.message,
        webhookUrl,
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de teste do webhook',
    instrucoes: {
      metodo: 'POST',
      endpoint: '/api/whatsapp/apifacil/testar-webhook-manual',
      exemplo: 'Faça POST para este endpoint para testar o webhook',
    },
    webhookReal: '/api/whatsapp/apifacil/webhook',
  })
}










