import { NextRequest, NextResponse } from 'next/server'
import { connectWhatsAppViaPhone } from '@/lib/whatsapp-baileys'

/**
 * Conectar WhatsApp via número de telefone (Pairing Code)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { phoneNumber } = body
    
    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Número de telefone é obrigatório'
      }, { status: 400 })
    }
    
    console.log('📱 [Connect Phone] Recebido número:', phoneNumber)
    console.log('📱 [Connect Phone] Iniciando processo...')
    
    try {
      const result = await connectWhatsAppViaPhone(phoneNumber)
      
      console.log('📱 [Connect Phone] Resultado:', {
        success: result.success,
        hasPairingCode: !!result.pairingCode,
        error: result.error
      })
      
      if (result.success && result.pairingCode) {
        return NextResponse.json({
          success: true,
          pairingCode: result.pairingCode,
          message: 'Código de pairing gerado! Digite este código no seu WhatsApp.',
          instructions: [
            '1. Abra o WhatsApp no seu celular',
            '2. Vá em: Menu → Aparelhos conectados → Conectar um aparelho',
            '3. Selecione "Conectar com número de telefone"',
            '4. Digite o código de pairing mostrado acima',
            '5. Aguarde a confirmação'
          ]
        })
      }
      
      return NextResponse.json({
        success: false,
        error: result.error || 'Erro ao gerar código de pairing. Verifique os logs do servidor para mais detalhes.'
      }, { status: 500 })
      
    } catch (functionError: any) {
      console.error('❌ [Connect Phone] Erro na função connectWhatsAppViaPhone:', functionError)
      console.error('❌ [Connect Phone] Stack:', functionError?.stack)
      
      return NextResponse.json({
        success: false,
        error: `Erro ao gerar código: ${functionError.message || 'Erro desconhecido'}. O método de pairing code pode não estar disponível. Use QR Code como alternativa.`
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('❌ [Connect Phone] Erro geral:', error)
    console.error('❌ [Connect Phone] Stack:', error?.stack)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao conectar via número de telefone. Verifique os logs do servidor.'
      },
      { status: 500 }
    )
  }
}












