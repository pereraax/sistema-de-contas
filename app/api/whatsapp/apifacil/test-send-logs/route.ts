/**
 * Rota de teste para verificar se os logs estão funcionando
 */

import { NextRequest, NextResponse } from 'next/server'
import { addSendLog, getSendLogs } from '@/lib/send-logs'

export async function GET() {
  // Adicionar um log de teste
  const testTimestamp = new Date().toISOString()
  addSendLog({
    timestamp: testTimestamp,
    phoneNumber: '5511999999999',
    message: 'Log de teste criado via API',
    endpoint: '/api/whatsapp/apifacil/test-send-logs',
    method: 'GET',
    payload: { test: true },
    status: 200,
    statusText: 'Test',
    success: true,
  })
  
  const logs = getSendLogs()
  
  return NextResponse.json({
    success: true,
    message: 'Log de teste adicionado',
    total: logs.length,
    logs: logs.slice(0, 10), // Primeiros 10 logs
    testLogAdded: true,
  })
}






