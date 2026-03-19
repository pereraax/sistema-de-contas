import { NextRequest, NextResponse } from 'next/server'
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
      // Asaas costuma enviar em `asaas-access-token`, mas aceitamos variações comuns
      const headerToken =
        request.headers.get('asaas-access-token')?.trim() ||
        request.headers.get('access_token')?.trim() ||
        request.headers.get('x-asaas-access-token')?.trim() ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
        ''

      if (!headerToken || headerToken !== tokenEnv) {
        // Log sem expor o token (ajuda a diagnosticar header ausente/mismatch)
        console.warn('[webhook-asaas] 401 token mismatch', {
          hasEnv: true,
          envLen: tokenEnv.length,
          headerPresent: !!headerToken,
          headerLen: headerToken.length,
        })
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

    console.log('[webhook-asaas] recebido', {
      event,
      subscriptionId,
      paymentId: payment?.id ?? null,
      status: payment?.status ?? null,
      value: payment?.value ?? null,
    })

    // confirmarAssinaturaGuest registra a confirmação por subscriptionId/email e envia o e-mail.
    await confirmarAssinaturaGuest(subscriptionId)

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[webhook-asaas] Erro:', err?.message)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
