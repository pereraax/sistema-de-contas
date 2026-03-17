import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { buscarPagamentosAssinatura, buscarAssinaturaAsaas } from '@/lib/asaas'
import { confirmarAssinaturaGuest } from '@/lib/pagamento/confirmar-assinatura-guest'

export const dynamic = 'force-dynamic'

const STATUS_PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']

export async function GET(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId')
    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId é obrigatório' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    if (admin) {
      try {
        const { data: cached } = await admin
          .from('pagamento_webhook_confirmations')
          .select('subscription_id')
          .eq('subscription_id', subscriptionId)
          .maybeSingle()
        if (cached) {
          return NextResponse.json({ success: true, pago: true, plano: 'premium' })
        }
      } catch {
        // Tabela pode não existir ainda; segue para Asaas
      }
    }

    const subscription = await buscarAssinaturaAsaas(subscriptionId)
    const userId = subscription.externalReference
    if (!userId) {
      return NextResponse.json({ success: false, pago: false })
    }

    const payments = await buscarPagamentosAssinatura(subscriptionId)
    const paymentPago = payments.find((p: any) =>
      STATUS_PAGO.includes(String(p.status || '').toUpperCase())
    )

    if (!paymentPago) {
      return NextResponse.json({ success: true, pago: false })
    }

    const { ok } = await confirmarAssinaturaGuest(subscriptionId)
    if (ok && admin) {
      try {
        await admin.from('pagamento_webhook_confirmations').upsert(
          { subscription_id: subscriptionId, confirmed_at: new Date().toISOString() },
          { onConflict: 'subscription_id' }
        )
      } catch {
        // Tabela pode não existir; ignora
      }
    }

    return NextResponse.json({
      success: true,
      pago: true,
      plano: 'premium',
    })
  } catch (error: any) {
    console.error('❌ [status-guest] Erro:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
