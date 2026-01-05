import { NextRequest, NextResponse } from 'next/server'
import { connectWhatsApp } from '@/lib/whatsapp-baileys'

/**
 * Endpoint simples para configurar WhatsApp uma vez
 * Apenas conecta o WhatsApp (via Baileys) e retorna o número
 */
export async function POST(request: NextRequest) {
  try {
    // Conectar WhatsApp
    const sock = await connectWhatsApp()
    
    if (!sock) {
      return NextResponse.json(
        { error: 'Erro ao conectar WhatsApp' },
        { status: 500 }
      )
    }

    // Obter número do WhatsApp conectado
    const user = (sock as any).user
    const numero = user?.id?.split(':')[0] || null

    return NextResponse.json({
      success: true,
      message: 'WhatsApp conectado! Use o botão "Assistente PLEN no WhatsApp" para começar.',
      numero: numero,
      whatsappUrl: numero 
        ? `https://wa.me/${numero.replace(/\D/g, '')}?text=Olá%20PLEN!`
        : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET: Verificar se WhatsApp está configurado
 * Usa o mesmo método do endpoint /api/whatsapp/status
 */
export async function GET(request: NextRequest) {
  try {
    // Usar o mesmo método do endpoint de status
    const { isConnectedWebJS, getQRCodeWebJS, getClientInfoWebJS } = await import('@/lib/whatsapp-webjs')
    const connected = isConnectedWebJS()
    const qrCode = getQRCodeWebJS()
    const clientInfo = getClientInfoWebJS()
    
    // Verificar se está realmente conectado (sem QR code e com clientInfo)
    const realmenteConectado = connected && !qrCode && clientInfo?.wid
    
    if (realmenteConectado) {
      const numero = clientInfo.wid.user || null
      return NextResponse.json({
        configured: true,
        connected: true,
        numero: numero,
        whatsappUrl: numero 
          ? `https://wa.me/${numero.replace(/\D/g, '')}?text=Olá%20PLEN!`
          : null,
      })
    }

    return NextResponse.json({
      configured: false,
      connected: false,
    })
  } catch (error: any) {
    // Se der erro, tentar baileys como fallback
    try {
      const { getWhatsAppStatus } = await import('@/lib/whatsapp-baileys')
      const status = getWhatsAppStatus()
      
      if (status.connected && status.user) {
        const numero = status.user.id?.split(':')[0] || null
        
        return NextResponse.json({
          configured: true,
          connected: true,
          numero: numero,
          whatsappUrl: numero 
            ? `https://wa.me/${numero.replace(/\D/g, '')}?text=Olá%20PLEN!`
            : null,
        })
      }
    } catch (e) {
      // Ignorar erro do baileys
    }
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}







