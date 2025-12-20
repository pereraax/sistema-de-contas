import { NextResponse } from 'next/server'

// Carregar módulo dinamicamente
async function loadModule() {
  if (typeof window !== 'undefined') {
    throw new Error('whatsapp-web.js só pode ser usado no servidor!')
  }
  const module = await import('@/lib/whatsapp-webjs')
  return module.getQRCodeWebJS
}

/**
 * GET - Obter QR Code atual
 */
export async function GET() {
  try {
    const getQRCodeWebJS = await loadModule()
    const qr = getQRCodeWebJS()

    if (!qr) {
      return NextResponse.json(
        { error: 'QR Code não disponível. Chame /api/whatsapp/webjs/connect primeiro.' },
        { status: 404 }
      )
    }

    // QR Code já vem em base64 (data:image/png;base64,...)
    return NextResponse.json({
      qr,
      message: 'QR Code disponível!',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao obter QR Code' },
      { status: 500 }
    )
  }
}










