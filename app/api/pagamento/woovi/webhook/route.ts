import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ativarPlanoPremiumEEnviarEmail } from '@/lib/pagamento/ativar-plano-e-enviar-email'

export const dynamic = 'force-dynamic'

function extractUserId(correlationID?: string | null): string | null {
  const c = String(correlationID || '')
  if (!c.startsWith('pleni_')) return null
  const parts = c.split('_')
  if (parts.length < 3) return null
  return parts[1] || null
}

export async function POST(request: NextRequest) {
  try {
    const tokenEnv = process.env.WOOVI_WEBHOOK_TOKEN?.trim()
    if (tokenEnv) {
      const headerToken =
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
        request.headers.get('x-woovi-token')?.trim() ||
        ''
      if (!headerToken || headerToken !== tokenEnv) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      }
    }

    const body = await request.json().catch(() => ({}))
    const event = String(body?.event || '').trim()
    if (event !== 'woovi:CHARGE_COMPLETED' && event !== 'OPENPIX:CHARGE_COMPLETED') {
      return NextResponse.json({ received: true })
    }

    const charge = body?.charge || {}
    const chargeId = String(charge?.identifier || charge?.transactionID || '').trim()
    const userId =
      extractUserId(charge?.correlationID) ||
      extractUserId(charge?.customer?.correlationID) ||
      null

    console.log('[woovi/webhook] recebido', {
      event,
      chargeId: chargeId || null,
      status: charge?.status || null,
      hasUserId: !!userId,
    })

    if (userId) {
      const { ok } = await ativarPlanoPremiumEEnviarEmail({ userId, fonte: 'woovi', referenceId: chargeId || null })
      if (ok && chargeId) {
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

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[woovi/webhook] erro:', err?.message ?? err)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}

