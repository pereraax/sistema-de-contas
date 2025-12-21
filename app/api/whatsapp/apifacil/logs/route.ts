/**
 * Rota para ver os logs recentes do webhook
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
      message: 'Últimas requisições recebidas no webhook',
      endpoint: '/api/whatsapp/apifacil/webhook',
    }
  })
}










