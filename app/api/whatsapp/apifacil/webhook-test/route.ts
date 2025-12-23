/**
 * Rota para testar o webhook do apifacil.dev
 * Simula uma mensagem recebida
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { from, text } = await request.json()

    if (!from || !text) {
      return NextResponse.json({
        error: 'Parâmetros "from" e "text" são obrigatórios'
      }, { status: 400 })
    }

    // Simular formato do apifacil.dev
    const mockMessage = {
      from: from.replace(/\D/g, ''),
      text: text,
      timestamp: Date.now(),
    }

    // Chamar o webhook real
    const webhookUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${webhookUrl}/api/whatsapp/apifacil/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockMessage),
    })

    const responseData = await response.json()

    return NextResponse.json({
      success: response.ok,
      webhookResponse: responseData,
      mockMessage,
      webhookUrl: `${webhookUrl}/api/whatsapp/apifacil/webhook`,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}

// GET para mostrar instruções
export async function GET() {
  return NextResponse.json({
    message: 'Use POST para testar o webhook',
    example: {
      method: 'POST',
      body: {
        from: '5511999999999',
        text: 'Teste de mensagem',
      },
    },
    webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/whatsapp/apifacil/webhook`,
  })
}











