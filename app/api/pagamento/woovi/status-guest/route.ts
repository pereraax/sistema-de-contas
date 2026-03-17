import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { wooviGetCharge } from '@/lib/woovi'
import { ativarPlanoPremiumEEnviarEmail } from '@/lib/pagamento/ativar-plano-e-enviar-email'

export const dynamic = 'force-dynamic'

function extractUserId(correlationID?: string | null): string | null {
  const c = String(correlationID || '')
  // pleni_<userId>_<ts>
  if (!c.startsWith('pleni_')) return null
  const parts = c.split('_')
  if (parts.length < 3) return null
  return parts[1] || null
}

export async function GET(request: NextRequest) {
  const chargeId = request.nextUrl.searchParams.get('chargeId')
  if (!chargeId) {
    return NextResponse.json({ success: false, error: 'chargeId é obrigatório' }, { status: 400 })
  }

  const noCacheHeaders = { 'Cache-Control': 'no-store, no-cache, must-revalidate', Pragma: 'no-cache' }

  try {
    const charge = await wooviGetCharge(chargeId)
    const status = String(charge?.status || '').toUpperCase().trim()
    const pago = status === 'COMPLETED' || status === 'PAID'

    if (!pago) {
      return NextResponse.json({ success: true, pago: false, paymentStatus: status }, { headers: noCacheHeaders })
    }

    const userId = extractUserId(charge?.correlationID) || extractUserId((charge as any)?.customer?.correlationID)
    if (userId) {
      const { ok } = await ativarPlanoPremiumEEnviarEmail({ userId, fonte: 'woovi', referenceId: chargeId })
      if (ok) {
        const admin = createAdminClient()
        if (admin) {
          try {
            await admin.from('pagamento_webhook_confirmations').upsert(
              { subscription_id: `woovi:${chargeId}`, confirmed_at: new Date().toISOString() },
              { onConflict: 'subscription_id' }
            )
          } catch {
            // ignore
          }
        }
      }
    }

    return NextResponse.json({ success: true, pago: true, paymentStatus: status }, { headers: noCacheHeaders })
  } catch (err: any) {
    console.error('[woovi/status-guest] erro:', err?.message ?? err)
    return NextResponse.json({ success: true, pago: false }, { headers: noCacheHeaders })
  }
}

