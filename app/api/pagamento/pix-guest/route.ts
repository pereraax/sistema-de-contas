import { NextRequest, NextResponse } from 'next/server'
import { buscarPagamentosAssinatura, buscarPixQrCode } from '@/lib/asaas'
import { selectPendingPixPayment } from '@/lib/pagamento/pix-helpers'

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

    // Cobrança PIX avulsa (checkout guest): o "subscriptionId" enviado pelo front é o id pay_...
    if (subscriptionId.startsWith('pay_')) {
      const pixData = await buscarPixQrCode(subscriptionId)
      return NextResponse.json({
        success: true,
        paymentId: subscriptionId,
        pixQrCode: pixData.encodedImage ?? null,
        pixCopyPaste: pixData.payload ?? null,
      })
    }

    let payments = await buscarPagamentosAssinatura(subscriptionId)
    let pendingPayment = selectPendingPixPayment(payments)
    if (!pendingPayment && payments.length === 0) {
      await new Promise((r) => setTimeout(r, 1200))
      payments = await buscarPagamentosAssinatura(subscriptionId)
      pendingPayment = selectPendingPixPayment(payments)
    }

    if (!pendingPayment) {
      return NextResponse.json({
        success: true,
        paymentId: null,
        pixQrCode: null,
        pixCopyPaste: null,
      })
    }

    const pixData = await buscarPixQrCode(String(pendingPayment.id))

    return NextResponse.json({
      success: true,
      paymentId: pendingPayment.id ?? null,
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
