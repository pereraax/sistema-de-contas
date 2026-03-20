import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buscarPagamentosAssinatura, buscarPixQrCode } from '@/lib/asaas'
import { selectPendingPixPayment } from '@/lib/pagamento/pix-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId')
    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const payments = await buscarPagamentosAssinatura(subscriptionId)
    const pendingPayment = selectPendingPixPayment(payments)

    if (!pendingPayment) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum pagamento pendente encontrado',
      })
    }

    const pixData = await buscarPixQrCode(String(pendingPayment.id))

    return NextResponse.json({
      success: true,
      pixQrCode: pixData.encodedImage,
      pixCopyPaste: pixData.payload,
    })
  } catch (error: any) {
    console.error('❌ [pix] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar QR Code PIX',
      },
      { status: 500 }
    )
  }
}
