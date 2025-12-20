/**
 * Teste simples para verificar se o webhook está funcionando
 * Acesse: GET /api/whatsapp/apifacil/test-webhook-simples
 */

import { NextResponse } from 'next/server'
import { addWebhookLog, getWebhookLogs } from '@/lib/webhook-logs'
import { addSendLog, getSendLogs } from '@/lib/send-logs'

export async function GET() {
  try {
    // Criar logs de teste
    const testTimestamp = new Date().toISOString()
    
    // Log de webhook de teste
    addWebhookLog({
      timestamp: testTimestamp,
      method: 'POST',
      body: {
        tipo: 'teste',
        mensagem: 'Este é um log de teste do webhook',
        telefone: '5511999999999',
        texto: 'oi',
      },
      response: { status: 'test', success: true },
    })
    
    // Log de envio de teste
    addSendLog({
      timestamp: testTimestamp,
      phoneNumber: '5511999999999',
      message: 'Mensagem de teste do sistema',
      endpoint: '/test-webhook-simples',
      method: 'GET',
      payload: { teste: true },
      status: 200,
      statusText: 'OK',
      response: { success: true, message: 'Teste criado' },
      success: true,
    })
    
    const webhookLogs = getWebhookLogs()
    const sendLogs = getSendLogs()
    
    return NextResponse.json({
      success: true,
      message: 'Logs de teste criados com sucesso!',
      stats: {
        webhookLogs: webhookLogs.length,
        sendLogs: sendLogs.length,
      },
      testLogs: {
        webhook: webhookLogs.slice(0, 1),
        send: sendLogs.slice(0, 1),
      },
      instructions: {
        step1: 'Acesse: http://localhost:3000/whatsapp/logs-completos',
        step2: 'Você deve ver os logs de teste aparecerem',
        step3: 'Se não aparecer, há um problema no sistema de logs',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}








