import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  buscarPagamentoAsaas,
  buscarPagamentosAssinatura,
  buscarAssinaturaAsaas,
  buscarStatusPagamentoAsaas,
} from '@/lib/asaas'
import {
  confirmarAssinaturaGuest,
  confirmarPagamentoPixGuest,
} from '@/lib/pagamento/confirmar-assinatura-guest'

export const dynamic = 'force-dynamic'

// Asaas: status de cobrança quando o PIX foi creditado (inglês, PT e variações)
const STATUS_PAGO = [
  'RECEIVED',
  'CONFIRMED',
  'RECEIVED_IN_CASH',
  'RECEBIDO',
  'CONFIRMADO',
  'RECEIVED_IN_CASH_AND_CONFIRMED',
  /** Cobrança quitada via negativação / recuperação (Asaas enum) */
  'DUNNING_RECEIVED',
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

/** Cobrança PIX avulsa guest: usamos o id `pay_...` no lugar de subscription */
function isAsaasPaymentId(id: string) {
  return typeof id === 'string' && id.startsWith('pay_')
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
        const keys = [subscriptionId, paymentId].filter((k): k is string => Boolean(k && k.trim()))
        let cached: { subscription_id?: string } | null = null
        for (const k of keys) {
          const { data } = await admin
            .from('pagamento_webhook_confirmations')
            .select('subscription_id')
            .eq('subscription_id', k)
            .maybeSingle()
          if (data) {
            cached = data
            break
          }
        }
        if (cached) {
          return NextResponse.json(
            { success: true, pago: true, plano: 'basico' },
            { headers: noCacheHeaders }
          )
        }
      } catch {
        // Tabela pode não existir ainda; segue para Asaas
      }
    }

    // Se temos paymentId, checar status direto da cobrança (mais confiável e rápido que listar payments da assinatura)
    const effectivePaymentId = paymentId || (isAsaasPaymentId(subscriptionId) ? subscriptionId : null)

    if (effectivePaymentId) {
      try {
        const [statusRes, payment] = await Promise.all([
          buscarStatusPagamentoAsaas(effectivePaymentId).catch((e: any) => {
            console.warn('[status-guest] /payments/.../status falhou', e?.message)
            return null
          }),
          buscarPagamentoAsaas(effectivePaymentId).catch((e: any) => {
            console.warn('[status-guest] GET payment falhou', e?.message)
            return null
          }),
        ])

        const paymentStatus = normaliza(
          statusRes?.status ?? payment?.status ?? payment?.paymentStatus ?? ''
        )
        const pago =
          isStatusPago({ status: paymentStatus }) ||
          (payment != null && isStatusPago(payment))
        console.log('[status-guest] paymentId check', {
          subscriptionId,
          paymentId: effectivePaymentId,
          paymentStatus,
          statusEndpoint: statusRes?.status ?? null,
          paymentObjectStatus: payment?.status ?? null,
          pago,
        })
        if (!pago) {
          return NextResponse.json(
            { success: true, pago: false, paymentStatus },
            { headers: noCacheHeaders }
          )
        }
        if (isAsaasPaymentId(subscriptionId)) {
          await confirmarPagamentoPixGuest(effectivePaymentId)
        } else {
          await confirmarAssinaturaGuest(subscriptionId)
        }
        return NextResponse.json(
          { success: true, pago: true, plano: 'basico', paymentStatus },
          { headers: noCacheHeaders }
        )
      } catch (err: any) {
        console.warn('[status-guest] paymentId check falhou', {
          subscriptionId,
          paymentId: effectivePaymentId,
          error: err?.message ?? String(err),
        })
        if (isAsaasPaymentId(subscriptionId)) {
          return NextResponse.json({ success: true, pago: false }, { headers: noCacheHeaders })
        }
      }
    }

    if (isAsaasPaymentId(subscriptionId)) {
      return NextResponse.json({ success: true, pago: false }, { headers: noCacheHeaders })
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

    // confirmarAssinaturaGuest já registra cache por subscriptionId/email e envia e-mail.
    await confirmarAssinaturaGuest(subscriptionId)

    return NextResponse.json(
      { success: true, pago: true, plano: 'basico' },
      { headers: noCacheHeaders }
    )
  } catch (error: any) {
    console.error('❌ [status-guest] Erro:', error?.message ?? error)
    return NextResponse.json({ success: true, pago: false }, { headers: noCacheHeaders })
  }
}
