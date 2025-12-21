import { NextRequest, NextResponse } from 'next/server'
import { connectWhatsApp, getQRCodeAtual } from '@/lib/whatsapp-baileys'
import QRCode from 'qrcode'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [QR Code] Buscando QR Code...')
    
    // Buscar QR Code atual primeiro (pode já estar disponível)
    let qrCode = getQRCodeAtual()
    console.log('🔍 [QR Code] QR Code atual:', qrCode ? `Encontrado (${qrCode.length} chars)` : 'Não encontrado')
    
    // Se não tem QR Code, tentar conectar
    if (!qrCode) {
      console.log('🔄 [QR Code] Iniciando conexão para gerar QR Code...')
      const sock = await connectWhatsApp()
      
      if (!sock) {
        console.error('❌ [QR Code] Erro ao conectar WhatsApp')
        return NextResponse.json({
          error: 'Erro ao conectar WhatsApp',
        }, { status: 500 })
      }
      
      // Aguardar mais tempo para o QR Code ser gerado
      console.log('⏳ [QR Code] Aguardando QR Code ser gerado...')
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        qrCode = getQRCodeAtual()
        if (qrCode) {
          console.log('✅ [QR Code] QR Code encontrado após', i + 1, 'segundos')
          break
        }
      }
    }
    
    // Se já temos QR Code, retornar como imagem
    if (qrCode) {
      try {
        console.log('🖼️ [QR Code] Gerando imagem do QR Code...')
        const qrImage = await QRCode.toDataURL(qrCode, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          margin: 1,
          width: 512,
        })
        const base64Data = qrImage.replace(/^data:image\/png;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        
        console.log('✅ [QR Code] Imagem gerada com sucesso!')
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
      } catch (error: any) {
        console.error('❌ [QR Code] Erro ao gerar imagem:', error)
        return NextResponse.json({
          error: 'Erro ao gerar imagem do QR Code: ' + error.message,
        }, { status: 500 })
      }
    }
    
    console.log('⚠️ [QR Code] QR Code ainda não disponível')
    return NextResponse.json({
      message: 'QR Code ainda não foi gerado. Aguarde alguns segundos e recarregue.',
      instruction: 'O QR Code está sendo gerado. Aguarde 3-5 segundos e recarregue esta página.',
      tip: 'Certifique-se de que chamou /api/whatsapp/connect primeiro.',
    }, { status: 202 }) // 202 Accepted - ainda processando
  } catch (error: any) {
    console.error('❌ [QR Code] Erro:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}







