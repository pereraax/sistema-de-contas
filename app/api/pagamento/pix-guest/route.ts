import { NextRequest, NextResponse } from 'next/server'
import { buscarPagamentosAssinatura, buscarPixQrCode } from '@/lib/asaas'

export const dynamic = 'force-dynamic'

/**
 * Busca QR Code PIX de uma assinatura (sem exigir autenticação).
 * Usado pelo checkout no quiz para exibir o PIX na mesma tela.
 */
export async function GET(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId')
    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId é obrigatório' },
        { status: 400 }
      )
    }

    const payments = await buscarPagamentosAssinatura(subscriptionId)
    const pendingPayment = payments.find(
      (p: any) => p.status === 'PENDING' || p.status === 'AWAITING_RISK_ANALYSIS'
    )

    if (!pendingPayment) {
      return NextResponse.json({
        success: true,
        pixQrCode: null,
        pixCopyPaste: null,
      })
    }

    const pixData = await buscarPixQrCode(pendingPayment.id)

    return NextResponse.json({
      success: true,
      pixQrCode: pixData.encodedImage ?? null,
      pixCopyPaste: pixData.payload ?? null,
    })
  } catch (error: any) {
    console.error('❌ [pix-guest] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar QR Code PIX',
      },
      { status: 500 }
    )
  }
}
