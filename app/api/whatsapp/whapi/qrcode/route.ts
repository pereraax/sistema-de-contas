import { NextRequest, NextResponse } from 'next/server'
import { getWhapiStatus } from '@/lib/whatsapp-whapi'

/**
 * Endpoint para obter QR Code como imagem
 */
export async function GET(request: NextRequest) {
  try {
    const status = await getWhapiStatus()
    
    if (status.error || !status.qr) {
      return NextResponse.json(
        { error: 'QR Code não disponível. Chame /api/whatsapp/whapi/connect primeiro.' },
        { status: 404 }
      )
    }

    // QR Code já vem em base64 do Whapi
    const qrBase64 = status.qr.startsWith('data:') 
      ? status.qr 
      : `data:image/png;base64,${status.qr}`

    // Converter para buffer e retornar como imagem
    const base64Data = qrBase64.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}










