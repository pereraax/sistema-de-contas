/**
 * Cron: mensagens inteligentes da Plen (AHA moments).
 * Limitado e com intervalos longos (60–90 s entre envios) para evitar banimento por spam no WhatsApp.
 * Definir WHATSAPP_CRON_VACUUM_DISABLED=true para desativar toda automação de vácuo (recovery + follow-up + smart).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getEligibleUsers, sendSmartMessage } from '@/lib/plen-smart-messages'
import { runLead10MinFollowUp } from '@/lib/whatsapp-lead-followup'
import { runLeadRecoveryFollowUps } from '@/lib/whatsapp-lead-recovery'
import { isZapiConfigured } from '@/lib/whatsapp-zapi'
import { isApifacilConfigured } from '@/lib/whatsapp-apifacil'

const CRON_SECRET = process.env.CRON_SECRET?.trim()
const VACUUM_DISABLED = process.env.WHATSAPP_CRON_VACUUM_DISABLED === 'true' || process.env.WHATSAPP_CRON_VACUUM_DISABLED === '1'
const MAX_SMART_PER_RUN = 2

function isAuthorized(request: NextRequest): boolean {
  if (!CRON_SECRET) return false
  const urlSecret = request.nextUrl.searchParams.get('secret')?.trim()
  if (urlSecret && urlSecret === CRON_SECRET) return true
  const auth = request.headers.get('authorization')
  const secret = request.headers.get('x-cron-secret')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : secret?.trim()
  return token === CRON_SECRET
}

export async function GET(request: NextRequest) {
  return runCron(request)
}

export async function POST(request: NextRequest) {
  return runCron(request)
}

async function runCron(request: NextRequest): Promise<NextResponse> {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET não configurado' },
      { status: 503 }
    )
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }
  if (VACUUM_DISABLED) {
    return NextResponse.json({ ok: true, sent: 0, vacuumDisabled: true, message: 'Automação de vácuo desativada (WHATSAPP_CRON_VACUUM_DISABLED)' })
  }

  if (!isZapiConfigured() && !isApifacilConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'WhatsApp não configurado (Z-API ou API Fácil)' },
      { status: 503 }
    )
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin não disponível' },
      { status: 503 }
    )
  }

  const sendTextMessage = isZapiConfigured()
    ? (await import('@/lib/whatsapp-zapi')).sendTextMessage
    : (await import('@/lib/whatsapp-apifacil')).sendTextMessage

  const sendOne = async (phone: string, text: string) => {
    const r = await sendTextMessage(phone, text, { delayTyping: 1 })
    return { success: r?.success ?? false, error: r?.error }
  }

  // 1) Follow-up 10 min para leads inativos (fluxo de teste, ainda sem cadastro)
  const leadFollowUp = await runLead10MinFollowUp()
  const errors: string[] = leadFollowUp.errors ?? []

  // 2) Recuperação de leads que pararam após o pedido de e-mail (5m, 10m, 15h, 24h, 48h)
  const recovery = await runLeadRecoveryFollowUps(sendOne)
  if (recovery.errors?.length) errors.push(...recovery.errors)

  // 3) Mensagens inteligentes para usuários já cadastrados (limitado por run para evitar spam)
  const eligible = (await getEligibleUsers(supabase)).slice(0, MAX_SMART_PER_RUN)
  let sent = leadFollowUp.sent + recovery.sent

  for (const { userId, eventType, payload } of eligible) {
    const result = await sendSmartMessage(supabase, userId, eventType, payload)
    if (result.success) {
      sent += 1
    } else {
      errors.push(`${userId} ${eventType}: ${result.error ?? 'erro'}`)
    }
  }

  if (recovery.listError) {
    console.error('[Cron plen-smart] lead recovery listError:', recovery.listError)
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: leadFollowUp.total + recovery.total + eligible.length,
    leadFollowUp10min: { sent: leadFollowUp.sent, total: leadFollowUp.total },
    leadRecovery: {
      sent: recovery.sent,
      total: recovery.total,
      listError: recovery.listError,
    },
    errors: errors.length ? errors : undefined,
  })
}
