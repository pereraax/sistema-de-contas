/**
 * Rota de debug para verificar se webhook está recebendo mensagens
 * Mostra as últimas mensagens recebidas
 */

import { NextRequest, NextResponse } from 'next/server'

// Armazenar últimas mensagens recebidas (em memória - apenas para debug)
let lastMessages: any[] = []
const MAX_MESSAGES = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Adicionar timestamp
    const messageWithTime = {
      ...body,
      receivedAt: new Date().toISOString(),
      timestamp: Date.now(),
    }
    
    // Adicionar à lista (manter apenas as últimas)
    lastMessages.unshift(messageWithTime)
    if (lastMessages.length > MAX_MESSAGES) {
      lastMessages = lastMessages.slice(0, MAX_MESSAGES)
    }
    
    console.log('📨 [Webhook Debug] Mensagem recebida:', JSON.stringify(body, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem registrada para debug',
      receivedAt: messageWithTime.receivedAt,
    })
  } catch (error: any) {
    console.error('❌ [Webhook Debug] Erro:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET para ver últimas mensagens recebidas
export async function GET() {
  return NextResponse.json({
    success: true,
    totalMessages: lastMessages.length,
    messages: lastMessages,
    info: {
      endpoint: '/api/whatsapp/apifacil/webhook-debug',
      webhookEndpoint: '/api/whatsapp/apifacil/webhook',
      note: 'Esta rota é apenas para debug. Configure o webhook para apontar para /api/whatsapp/apifacil/webhook',
    }
  })
}










