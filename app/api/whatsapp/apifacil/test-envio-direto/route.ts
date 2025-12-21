/**
 * Teste de envio direto - bypassa todo o processamento
 * Útil para verificar se o problema é no envio ou no processamento
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTextMessage, isApifacilConfigured } from '@/lib/whatsapp-apifacil'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()
    
    if (!phoneNumber || !message) {
      return NextResponse.json({
        success: false,
        error: 'phoneNumber e message são obrigatórios',
      }, { status: 400 })
    }
    
    if (!isApifacilConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Apifacil não está configurado',
      }, { status: 400 })
    }
    
    console.log('🧪 [Teste Envio Direto] Testando envio direto...', { phoneNumber, message })
    
    const result = await sendTextMessage(phoneNumber, message)
    
    return NextResponse.json({
      success: result.success,
      result,
      message: result.success 
        ? 'Mensagem enviada com sucesso! Se você recebeu, o problema está no processamento.'
        : `Erro ao enviar: ${result.error}. O problema está no envio.`,
    })
  } catch (error: any) {
    console.error('❌ [Teste Envio Direto] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}










