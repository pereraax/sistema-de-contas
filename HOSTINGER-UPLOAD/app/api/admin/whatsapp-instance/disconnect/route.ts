import { NextRequest, NextResponse } from 'next/server'
import { disconnectWhatsAppWebJS } from '@/lib/whatsapp-webjs'
import { desconectarInstancia } from '@/lib/whatsapp-instance-manager'

/**
 * POST - Desconectar instância WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const instanceName = body.instanceName || 'plenipay'

    console.log('🔄 [WhatsApp Instance] Desconectando instância:', instanceName)

    // Usar disconnectWhatsAppWebJS que é a função correta para whatsapp-web.js
    const result = await disconnectWhatsAppWebJS()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp desconectado com sucesso!',
      })
    }

    return NextResponse.json(
      { 
        success: false,
        error: result.error || 'Erro ao desconectar' 
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [WhatsApp Instance] Erro:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro ao desconectar instância' 
      },
      { status: 500 }
    )
  }
}


