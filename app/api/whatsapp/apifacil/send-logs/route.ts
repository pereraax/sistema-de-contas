/**
 * Rota para ver os logs de envio de mensagens
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSendLogs } from '@/lib/send-logs'

export async function GET() {
  const logs = getSendLogs()
  
  return NextResponse.json({
    success: true,
    total: logs.length,
    logs: logs,
    info: {
      message: 'Últimas tentativas de envio de mensagens',
      endpoint: '/api/whatsapp/apifacil/send',
    }
  })
}










