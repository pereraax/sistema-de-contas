/**
 * Teste simples para verificar se o servidor está funcionando
 */

import { NextRequest, NextResponse } from 'next/server'
import { addWebhookLog } from '@/lib/webhook-logs'
import { addSendLog } from '@/lib/send-logs'

export async function GET() {
  // Criar logs de teste
  const testTimestamp = new Date().toISOString()
  
  // Adicionar log de webhook de teste
  addWebhookLog({
    timestamp: testTimestamp,
    method: 'GET',
    body: { test: true, message: 'Teste de log' },
    response: { success: true },
  })
  
  // Adicionar log de envio de teste
  addSendLog({
    timestamp: testTimestamp,
    phoneNumber: '5511999999999',
    message: 'Mensagem de teste',
    endpoint: '/test',
    method: 'GET',
    payload: { test: true },
    success: true,
    status: 200,
  })
  
  return NextResponse.json({
    success: true,
    message: 'Logs de teste criados!',
    timestamp: testTimestamp,
    instructions: {
      webhookLogs: 'Acesse: http://localhost:3000/api/whatsapp/apifacil/logs',
      sendLogs: 'Acesse: http://localhost:3000/api/whatsapp/apifacil/send-logs',
      webhookLogsPage: 'Acesse: http://localhost:3000/whatsapp/webhook-logs',
      sendLogsPage: 'Acesse: http://localhost:3000/whatsapp/send-logs',
    }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Adicionar log de webhook
  addWebhookLog({
    timestamp: new Date().toISOString(),
    method: 'POST',
    body: body,
    response: { success: true, message: 'Teste recebido' },
  })
  
  return NextResponse.json({
    success: true,
    message: 'Teste recebido e logado!',
    received: body,
  })
}











