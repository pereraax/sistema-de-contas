import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { confirmarAssinaturaGuest } from '@/lib/pagamento/confirmar-assinatura-guest'

export const dynamic = 'force-dynamic'

/**
 * Webhook Asaas: PAYMENT_RECEIVED.
 * Configurar no Asaas: Integrações > Webhooks > URL: https://plenipay.com/api/pagamento/webhook-asaas
 * Evento: PAYMENT_RECEIVED (e opcionalmente PAYMENT_CONFIRMED).
 * Token: no Asaas gere um token e defina ASAAS_WEBHOOK_TOKEN no ambiente (local e produção).
 */
export async function POST(request: NextRequest) {
  try {
    const tokenEnv = process.env.ASAAS_WEBHOOK_TOKEN?.trim()
    if (tokenEnv) {
      const headerToken = request.headers.get('asaas-access-token')?.trim()
      if (headerToken !== tokenEnv) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      }
    }

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
