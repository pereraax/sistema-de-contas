/**
 * API Route para conectar WhatsApp (gerar QR Code)
 * Usa whatsapp-web.js (não precisa Docker!)
 */

import { NextRequest, NextResponse } from 'next/server'
import { connectWhatsAppWebJS, getQRCodeWebJS, isConnectedWebJS } from '@/lib/whatsapp-webjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [WhatsApp Connect] Iniciando conexão com whatsapp-web.js...')

    const { forceNew } = await request.json().catch(() => ({}))
    
    // Conectar usando whatsapp-web.js
    const result = await connectWhatsAppWebJS(forceNew === true)

    if (result.success && result.qr) {
      console.log('✅ [WhatsApp Connect] QR Code gerado com sucesso')
      return NextResponse.json({
        success: true,
        qrCode: result.qr,
        status: result.connected ? 'connected' : 'connecting',
        connected: result.connected || false,
      })
    }

    if (result.success && result.connected) {
      return NextResponse.json({
        success: true,
        qrCode: null,
        status: 'connected',
        connected: true,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Erro ao gerar QR Code',
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [WhatsApp Connect] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao conectar WhatsApp',
      },
      { status: 500 }
    )
  }
}
