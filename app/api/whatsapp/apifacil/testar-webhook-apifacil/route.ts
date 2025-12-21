/**
 * Endpoint para testar se o webhook está funcionando com o formato do apifacil.dev
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Simular formato do apifacil.dev
    const testPayload = {
      event: 'whatsapp_insert',
      remetente: body.phoneNumber || '553194467805',
      mensagem: body.message || 'teste',
      tipo_envio: 'MENSAGEM_RECEBIDA',
      instancia_id: 1041,
      ...body,
    }
    
    // Chamar o webhook interno
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${webhookUrl}/api/whatsapp/apifacil/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })
    
    const responseData = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Webhook testado',
      payload: testPayload,
      webhookResponse: responseData,
      webhookStatus: response.status,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para testar o webhook',
    exemplo: {
      method: 'POST',
      body: {
        phoneNumber: '553194467805',
        message: 'teste',
      },
    },
  })
}








