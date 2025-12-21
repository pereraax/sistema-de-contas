/**
 * Rota para ver os logs do webhook (mensagens recebidas)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWebhookLogs } from '@/lib/webhook-logs'

export async function GET() {
  const logs = getWebhookLogs()
  
  return NextResponse.json({
    success: true,
    total: logs.length,
    logs: logs,
    info: {
      message: 'Últimas mensagens recebidas do webhook',
      endpoint: '/api/whatsapp/apifacil/webhook',
    }
  })
}






