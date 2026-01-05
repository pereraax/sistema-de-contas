import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage } from '@/lib/whatsapp-plen-handler'
import { addLog } from '@/lib/server-logs'

export const dynamic = 'force-dynamic'

/**
 * Endpoint de teste para verificar se o webhook está funcionando
 * Simula uma mensagem recebida do apifacil
 */
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()
    
    if (!phoneNumber || !message) {
      return NextResponse.json({
        success: false,
        error: 'phoneNumber e message são obrigatórios'
      }, { status: 400 })
    }
    
    addLog('info', `🧪 [TEST] Testando webhook - Phone: ${phoneNumber}, Message: ${message}`)
    
    // Simular mensagem do apifacil
    const testMessage = {
      key: {
        remoteJid: `${phoneNumber}@s.whatsapp.net`,
        id: Date.now().toString(),
      },
      message: {
        conversation: message,
        extendedTextMessage: {
          text: message,
        },
      },
      messageTimestamp: Date.now(),
      pushName: 'Teste',
    }
    
    console.log('🧪 [TEST] Processando mensagem de teste:', {
      phoneNumber,
      message,
    })
    
    const result = await processWhatsAppMessage(testMessage)
    
    console.log('🧪 [TEST] Resultado:', {
      success: result?.success,
      hasMessage: !!result?.message,
      message: result?.message?.substring(0, 100),
    })
    
    return NextResponse.json({
      success: true,
      test: true,
      input: { phoneNumber, message },
      result: {
        success: result?.success,
        hasMessage: !!result?.message,
        messagePreview: result?.message?.substring(0, 200),
        fullResult: result,
      },
    })
  } catch (error: any) {
    addLog('error', `❌ [TEST] Erro no teste do webhook: ${error.message}`)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de teste do webhook',
    usage: 'POST /api/whatsapp/apifacil/test-webhook',
    body: {
      phoneNumber: '5511999999999',
      message: 'teste',
    },
  })
}
