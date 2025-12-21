import { createClient } from '@/lib/supabase/server'
import { buscarPagamentosAssinatura, buscarPagamentoAsaas } from '@/lib/asaas'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'ID da assinatura não fornecido' }, { status: 400 })
    }

    console.log('Buscando pagamentos para subscription:', subscriptionId)
    
    // Buscar pagamentos da assinatura
    const pagamentos = await buscarPagamentosAssinatura(subscriptionId)
    console.log('Pagamentos encontrados:', pagamentos?.length || 0)

    if (!pagamentos || pagamentos.length === 0) {
      console.log('Nenhum pagamento encontrado, retornando erro')
      return NextResponse.json({ 
        success: false,
        error: 'Pagamento ainda não foi gerado. Aguarde alguns instantes e tente novamente.' 
      }, { status: 404 })
    }

    const primeiroPagamento = pagamentos[0]
    console.log('Primeiro pagamento ID:', primeiroPagamento.id)

    // Buscar detalhes completos do pagamento
    const pagamentoDetalhes = await buscarPagamentoAsaas(primeiroPagamento.id)
    console.log('Detalhes do pagamento:', {
      id: pagamentoDetalhes.id,
      status: pagamentoDetalhes.status,
      billingType: pagamentoDetalhes.billingType,
      hasPixCopiaECola: !!pagamentoDetalhes.pixCopiaECola,
      hasPixQrCodeId: !!pagamentoDetalhes.pixQrCodeId,
    })

    // Buscar QR code PIX
    let pixQrCode = null
    let pixCopyPaste = null

    // Primeiro, tentar pegar o código PIX direto do pagamento
    pixCopyPaste = pagamentoDetalhes.pixCopiaECola || pagamentoDetalhes.pixCopyPaste
    
    console.log('Código PIX encontrado:', !!pixCopyPaste)

    // Tentar buscar QR code se tiver pixQrCodeId
    if (pagamentoDetalhes.pixQrCodeId) {
      try {
        console.log('Buscando QR code com ID:', pagamentoDetalhes.pixQrCodeId)
        const apiUrl = process.env.ASAAS_API_URL || 'https://www.asaas.com/api/v3'
        let apiKey = process.env.ASAAS_API_KEY!.trim()
        if (apiKey.startsWith('\\$')) {
          apiKey = apiKey.substring(1) // Remove o escape
        }
        console.log('🔍 Buscando QR code PIX em:', `${apiUrl}/payments/${primeiroPagamento.id}/pixQrCode`)
        const qrCodeResponse = await fetch(
          `${apiUrl}/payments/${primeiroPagamento.id}/pixQrCode`,
          {
            headers: {
              'access_token': apiKey,
            },
          }
        )

        console.log('Resposta do QR code:', qrCodeResponse.status)

        if (qrCodeResponse.ok) {
          const qrCodeData = await qrCodeResponse.json()
          console.log('Dados do QR code recebidos:', Object.keys(qrCodeData))
          pixQrCode = qrCodeData.encodedImage || qrCodeData.base64 || qrCodeData.qrCode
          if (!pixCopyPaste) {
            pixCopyPaste = qrCodeData.payload || qrCodeData.pixCopyPaste
          }
        } else {
          const errorData = await qrCodeResponse.text()
          console.error('Erro ao buscar QR code:', qrCodeResponse.status, errorData)
        }
      } catch (error) {
        console.error('Erro ao buscar QR code:', error)
      }
    }

    console.log('Resultado final:', {
      hasQrCode: !!pixQrCode,
      hasCopyPaste: !!pixCopyPaste,
    })

    return NextResponse.json({
      success: true,
      pixQrCode: pixQrCode,
      pixCopyPaste: pixCopyPaste,
      paymentId: primeiroPagamento.id,
    })
  } catch (error: any) {
    console.error('Erro ao buscar pagamento PIX:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar pagamento PIX' },
      { status: 500 }
    )
  }
}

