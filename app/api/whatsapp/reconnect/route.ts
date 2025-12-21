/**
 * API Route para forçar reconexão do WhatsApp
 * Desconecta e reconecta completamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { disconnectWhatsAppWebJS, connectWhatsAppWebJS } from '@/lib/whatsapp-webjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [WhatsApp Reconnect] Forçando reconexão completa...')
    
    // Primeiro, desconectar completamente
    console.log('🔌 [WhatsApp Reconnect] Desconectando...')
    await disconnectWhatsAppWebJS()
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Depois, reconectar
    console.log('🔄 [WhatsApp Reconnect] Reconectando...')
    const result = await connectWhatsAppWebJS(true) // forceNew = true para forçar nova conexão
    
    if (result.success && result.qr) {
      return NextResponse.json({
        success: true,
        qrCode: result.qr,
        status: 'connecting',
        connected: false,
        message: 'QR Code gerado. Escaneie para conectar.',
      })
    }
    
    if (result.success && result.connected) {
      return NextResponse.json({
        success: true,
        qrCode: null,
        status: 'connected',
        connected: true,
        message: 'Reconectado com sucesso!',
      })
    }
    
    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Erro ao reconectar',
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [WhatsApp Reconnect] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao reconectar WhatsApp',
      },
      { status: 500 }
    )
  }
}











