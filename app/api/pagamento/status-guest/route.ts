import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { buscarPagamentoAsaas, buscarPagamentosAssinatura, buscarAssinaturaAsaas } from '@/lib/asaas'
import { confirmarAssinaturaGuest } from '@/lib/pagamento/confirmar-assinatura-guest'

export const dynamic = 'force-dynamic'

// Asaas: status de cobrança quando o PIX foi creditado (inglês, PT e variações)
const STATUS_PAGO = [
  'RECEIVED',
  'CONFIRMED',
  'RECEIVED_IN_CASH',
  'RECEBIDO',
  'CONFIRMADO',
  'RECEIVED_IN_CASH_AND_CONFIRMED',
]

function normaliza(s: string): string {
  return String(s || '').toUpperCase().trim()
}

function isStatusPago(p: any): boolean {
  const status = normaliza(
    p?.status ?? p?.paymentStatus ?? p?.payment?.status ?? ''
  )
  if (!status) return false
  if (STATUS_PAGO.some((s) => normaliza(s) === status)) return true
  if (status.includes('RECEIVED') || status.includes('CONFIRM') || status.includes('RECEBID')) return true
  return false
}

export async function GET(request: NextRequest) {
  const subscriptionId = request.nextUrl.searchParams.get('subscriptionId')
  const paymentId = request.nextUrl.searchParams.get('paymentId')
  if (!subscriptionId) {
    return NextResponse.json(
      { success: false, error: 'subscriptionId é obrigatório' },
      { status: 400 }
    )
  }

  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
  }

  try {
    const admin = createAdminClient()
    if (admin) {
      try {
        const { data: cached } = await admin
          .from('pagamento_webhook_confirmations')
          .select('subscription_id')
          .eq('subscription_id', subscriptionId)
          .maybeSingle()
        if (cached) {
          return NextResponse.json(
            { success: true, pago: true, plano: 'premium' },
            { headers: noCacheHeaders }
          )
        }
      } catch {
        // Tabela pode não existir ainda; segue para Asaas
      }
    }

    // Se temos paymentId, checar status direto da cobrança (mais confiável e rápido que listar payments da assinatura)
    if (paymentId) {
      try {
        const payment = await buscarPagamentoAsaas(paymentId)
        const paymentStatus = normaliza(payment?.status ?? payment?.paymentStatus ?? '')
        const pago = isStatusPago(payment)
        console.log('[status-guest] paymentId check', {
          subscriptionId,
          paymentId,
          paymentStatus,
          pago,
        })
        if (!pago) {
          return NextResponse.json(
            { success: true, pago: false, paymentStatus },
            { headers: noCacheHeaders }
          )
        }
        const { ok } = await confirmarAssinaturaGuest(subscriptionId)
        if (ok && admin) {
          try {
            await admin.from('pagamento_webhook_confirmations').upsert(
              { subscription_id: subscriptionId, confirmed_at: new Date().toISOString() },
              { onConflict: 'subscription_id' }
            )
          } catch {
            // ignora
          }
        }
        return NextResponse.json(
          { success: true, pago: true, plano: 'premium', paymentStatus },
          { headers: noCacheHeaders }
        )
      } catch (err: any) {
        console.warn('[status-guest] paymentId check falhou', {
          subscriptionId,
          paymentId,
          error: err?.message ?? String(err),
        })
        // Se falhar, cai no fluxo por assinatura/pagamentos
      }
    }

    const subscription = await buscarAssinaturaAsaas(subscriptionId)
    const userId = subscription?.externalReference
    if (!userId) {
      return NextResponse.json({ success: true, pago: false }, { headers: noCacheHeaders })
    }

    const payments = await buscarPagamentosAssinatura(subscriptionId)
    const paymentPago = Array.isArray(payments) ? payments.find(isStatusPago) : null

    if (!paymentPago) {
      return NextResponse.json({ success: true, pago: false }, { headers: noCacheHeaders })
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

    return NextResponse.json(
      { success: true, pago: true, plano: 'premium' },
      { headers: noCacheHeaders }
    )
  } catch (error: any) {
    console.error('❌ [status-guest] Erro:', error?.message ?? error)
    return NextResponse.json({ success: true, pago: false }, { headers: noCacheHeaders })
  }
}
