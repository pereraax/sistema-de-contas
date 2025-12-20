import { NextRequest, NextResponse } from 'next/server'

// Importar dinamicamente apenas no servidor
let connectWhatsAppWebJS: any
let getQRCodeWebJS: any
let isConnectedWebJS: any

// Carregar módulo apenas quando necessário (runtime)
async function loadModule() {
  if (typeof window !== 'undefined') {
    throw new Error('whatsapp-web.js só pode ser usado no servidor!')
  }
  
  const module = await import('@/lib/whatsapp-webjs')
  connectWhatsAppWebJS = module.connectWhatsAppWebJS
  getQRCodeWebJS = module.getQRCodeWebJS
  isConnectedWebJS = module.isConnectedWebJS
}

/**
 * GET - Verificar status da conexão
 */
export async function GET() {
  try {
    await loadModule()
    
    const connected = isConnectedWebJS()
    const qr = getQRCodeWebJS()

    return NextResponse.json({
      connected,
      qr,
      message: connected ? 'Conectado!' : qr ? 'Aguardando scan do QR Code...' : 'Não conectado',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}

/**
 * POST - Conectar WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    await loadModule()
    
    const body = await request.json().catch(() => ({}))
    const forceNew = body.forceNew === true

    console.log('🔄 [WhatsApp-WebJS] Iniciando conexão...', { forceNew })

    const result = await connectWhatsAppWebJS(forceNew)

    if (result.success) {
      return NextResponse.json({
        success: true,
        connected: result.connected || false,
        qr: result.qr || null,
        message: result.message || 'Conectado!',
      })
    }

    // Se não gerou QR ainda, aguardar um pouco mais
    if (!result.qr && !result.error?.includes('não foi gerado')) {
      console.log('⏳ [WhatsApp-WebJS] Aguardando QR Code...')
      
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const qr = getQRCodeWebJS()
        if (qr) {
          return NextResponse.json({
            success: true,
            connected: false,
            qr,
            message: 'QR Code gerado! Escaneie com seu WhatsApp.',
          })
        }
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Erro ao conectar',
        qr: result.qr || null,
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [WhatsApp-WebJS] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao conectar WhatsApp' },
      { status: 500 }
    )
  }
}










