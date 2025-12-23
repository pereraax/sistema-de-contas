import { NextRequest, NextResponse } from 'next/server'

// Carregar módulo dinamicamente
async function loadModule() {
  if (typeof window !== 'undefined') {
    throw new Error('whatsapp-web.js só pode ser usado no servidor!')
  }
  const module = await import('@/lib/whatsapp-webjs')
  return module.disconnectWhatsAppWebJS
}

/**
 * POST - Desconectar WhatsApp
 */
export async function POST() {
  try {
    const disconnectWhatsAppWebJS = await loadModule()
    const result = await disconnectWhatsAppWebJS()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'Desconectado com sucesso!',
      })
    }

    return NextResponse.json(
      { error: result.error || 'Erro ao desconectar' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [WhatsApp-WebJS] Erro ao desconectar:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao desconectar WhatsApp' },
      { status: 500 }
    )
  }
}













