import { NextRequest, NextResponse } from 'next/server'
import { verificarStatusInstancia } from '@/lib/whatsapp-instance-manager'
import { getQRCodeAtual } from '@/lib/whatsapp-baileys'

export const dynamic = 'force-dynamic'

/**
 * GET - Obter QR Code atual
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const instanceName = searchParams.get('instanceName') || 'plenipay'

    // Buscar QR Code do Baileys
    let qrCode = getQRCodeAtual()

    // Se não tiver, buscar do banco
    if (!qrCode) {
      const status = await verificarStatusInstancia(instanceName)
      qrCode = status.qrCode || null
    }

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR Code não disponível. Chame /connect primeiro.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      qrCode,
      message: 'QR Code disponível!',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao obter QR Code' },
      { status: 500 }
    )
  }
}








