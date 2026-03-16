import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { confirmarAssinaturaGuest } from '@/lib/pagamento/confirmar-assinatura-guest'

/**
 * Webhook Asaas: PAYMENT_RECEIVED.
 * Configurar no Asaas: Integrações > Webhooks > URL: https://plenipay.com/api/pagamento/webhook-asaas
 * Evento: PAYMENT_RECEIVED (e opcionalmente PAYMENT_CONFIRMED).
 * Assim que o PIX é confirmado, o Asaas chama esta URL e a mensagem "Pagamento concluído" aparece na próxima verificação (polling).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const event = body?.event
    const payment = body?.payment

    if (event !== 'PAYMENT_RECEIVED' && event !== 'PAYMENT_CONFIRMED') {
      return NextResponse.json({ received: true })
    }

    const subscriptionId =
      typeof payment?.subscription === 'string'
        ? payment.subscription
        : payment?.subscription?.id ?? null

    if (!subscriptionId) {
      return NextResponse.json({ received: true })
    }

    const { ok } = await confirmarAssinaturaGuest(subscriptionId)
    if (ok) {
      try {
        const admin = createAdminClient()
        if (admin) {
          await admin.from('pagamento_webhook_confirmations').upsert(
            { subscription_id: subscriptionId, confirmed_at: new Date().toISOString() },
            { onConflict: 'subscription_id' }
          )
        }
      } catch {
        // Tabela pode não existir
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[webhook-asaas] Erro:', err?.message)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
