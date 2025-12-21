/**
 * Endpoint de teste para verificar se o webhook está funcionando
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWebhookLogs } from '@/lib/webhook-logs'
import { getSendLogs } from '@/lib/send-logs'

export async function GET() {
  const webhookLogs = getWebhookLogs()
  const sendLogs = getSendLogs()
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    webhook: {
      total: webhookLogs.length,
      logs: webhookLogs.slice(0, 5), // Últimos 5
    },
    send: {
      total: sendLogs.length,
      logs: sendLogs.slice(0, 5), // Últimos 5
    },
    info: {
      message: 'Endpoint de teste - se você vê isso, o servidor está funcionando',
      webhookEndpoint: '/api/whatsapp/apifacil/webhook',
      sendLogsEndpoint: '/api/whatsapp/apifacil/send-logs',
      webhookLogsEndpoint: '/api/whatsapp/apifacil/logs',
    }
  })
}

export async function POST(request: NextRequest) {
  // Simular um webhook para teste
  const body = await request.json()
  
  return NextResponse.json({
    success: true,
    message: 'Webhook de teste recebido!',
    received: body,
    timestamp: new Date().toISOString(),
  })
}










