/**
 * API Route para desconectar WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { disconnectWhatsAppWebJS } from '@/lib/whatsapp-webjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [WhatsApp Disconnect] Desconectando WhatsApp...')
    
    const result = await disconnectWhatsAppWebJS()
    
    if (result.success) {
      console.log('✅ [WhatsApp Disconnect] Desconectado com sucesso')
      return NextResponse.json({
        success: true,
        message: 'WhatsApp desconectado com sucesso! Todas as credenciais foram removidas.',
      })
    }
    
    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Erro ao desconectar',
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [WhatsApp Disconnect] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao desconectar WhatsApp',
      },
      { status: 500 }
    )
  }
}
