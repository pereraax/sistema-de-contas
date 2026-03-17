import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { confirmarPagamentoAppmax } from '@/lib/pagamento/confirmar-pagamento-appmax'

export const dynamic = 'force-dynamic'

function norm(s: any): string {
  return String(s ?? '').trim()
}

function lower(s: any): string {
  return norm(s).toLowerCase()
}

function eventIsPaid(eventName: string): boolean {
  const e = lower(eventName)
  return e.includes('pedido pago') || e.includes('pago') || e.includes('paid') || e.includes('aprovado') || e.includes('authorized') || e.includes('autorizado')
}

/**
 * Appmax Apphooks webhook.
 * Configurar URL: https://plenipay.com/api/pagamento/webhook-appmax
 * Eventos recomendados: "Pedido pago" e "Pedido autorizado".
 *
 * Autenticação: se APPMAX_WEBHOOK_TOKEN estiver definido no ambiente,
 * validamos por header (variações comuns).
 */
export async function POST(request: NextRequest) {
  try {
    const tokenEnv = process.env.APPMAX_WEBHOOK_TOKEN?.trim()
    if (tokenEnv) {
      const headerToken =
        request.headers.get('x-appmax-token')?.trim() ||
        request.headers.get('appmax-token')?.trim() ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
        ''
      if (!headerToken || headerToken !== tokenEnv) {
        console.warn('[webhook-appmax] 401 token mismatch', {
          hasEnv: true,
          envLen: tokenEnv.length,
          headerPresent: !!headerToken,
          headerLen: headerToken.length,
        })
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      }
    }

    const body = await request.json().catch(() => ({}))

    // Appmax pode enviar campos diferentes dependendo do "Modelo do Conteúdo"
    const eventName =
      norm(body?.event) ||
      norm(body?.evento) ||
      norm(body?.type) ||
      norm(body?.name) ||
      norm(body?.eventName) ||
      ''

    const order =
      body?.order ||
      body?.pedido ||
      body?.data?.order ||
      body?.data?.pedido ||
      body?.data ||
      {}

    const orderId =
      norm(order?.id) ||
      norm(order?.order_id) ||
      norm(order?.orderId) ||
      norm(body?.order_id) ||
      norm(body?.orderId) ||
      ''

    const status =
      norm(order?.status) ||
      norm(body?.status) ||
      norm(body?.payment_status) ||
      norm(body?.paymentStatus) ||
      ''

    const paymentMethod =
      norm(order?.payment_method) ||
      norm(order?.paymentMethod) ||
      norm(body?.payment_method) ||
      norm(body?.paymentMethod) ||
      ''

    const customer =
      order?.customer ||
      order?.cliente ||
      body?.customer ||
      body?.cliente ||
      order?.buyer ||
      body?.buyer ||
      {}

    const email =
      lower(customer?.email) ||
      lower(order?.email) ||
      lower(body?.email) ||
      ''

    const nome =
      norm(customer?.name) ||
      norm(customer?.nome) ||
      norm(order?.name) ||
      norm(body?.name) ||
      null

    console.log('[webhook-appmax] recebido', {
      event: eventName || null,
      orderId: orderId || null,
      status: status || null,
      paymentMethod: paymentMethod || null,
      email: email ? email.slice(0, 2) + '***' : null,
    })

    if (!eventName || !eventIsPaid(eventName)) {
      return NextResponse.json({ received: true })
    }

    if (!orderId || !email) {
      return NextResponse.json({ received: true })
    }

    const { ok, error } = await confirmarPagamentoAppmax({
      email,
      nome,
      orderId,
      paymentMethod,
      status,
    })

    if (ok) {
      try {
        const admin = createAdminClient()
        if (admin) {
          // Reaproveitar tabela existente como cache (namespace appmax:)
          await admin.from('pagamento_webhook_confirmations').upsert(
            { subscription_id: `appmax:${orderId}`, confirmed_at: new Date().toISOString() },
            { onConflict: 'subscription_id' }
          )
        }
      } catch {
        // ignora
      }
    } else {
      console.warn('[webhook-appmax] confirmarPagamentoAppmax falhou', { orderId, error })
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[webhook-appmax] erro:', err?.message ?? err)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}

