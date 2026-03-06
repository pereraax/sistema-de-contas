/**
 * Automação a cada 2 minutos:
 * 1) Envia mensagem de boas-vindas para quem ainda não recebeu.
 * 2) Recuperação de leads que abandonaram o chat após "Qual seu e-mail?" (5m, 10m, 15h, 24h, 48h).
 *
 * Chamar a cada 2 min via cron-job.org, Railway cron ou similar.
 * URL: GET /api/whatsapp/cron-boas-vindas-pendentes?secret=SEU_CRON_SECRET
 * Ou header: Authorization: Bearer SEU_CRON_SECRET ou X-Cron-Secret: SEU_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { runBoasVindasPendentes } from '@/lib/whatsapp-cron-boas-vindas'
import { isBoasVindasConfigured } from '@/lib/whatsapp-enviar-boas-vindas-lib'
import { runLeadRecoveryFollowUps } from '@/lib/whatsapp-lead-recovery'
import { runRevisaoVacuo } from '@/lib/whatsapp-revisao-vacuo'
import { isZapiConfigured } from '@/lib/whatsapp-zapi'
import { sendTextMessage as zapiSendText } from '@/lib/whatsapp-zapi'
import { isApifacilConfigured } from '@/lib/whatsapp-apifacil'
import { sendTextMessage as apifacilSendText } from '@/lib/whatsapp-apifacil'

const CRON_SECRET = process.env.CRON_SECRET?.trim()

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
  if (!isBoasVindasConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Nenhum provedor de boas-vindas configurado (Z-API ou API Fácil)' },
      { status: 503 }
    )
  }

  const result = await runBoasVindasPendentes(168)

  // Recuperação de leads que pararam após "Qual seu e-mail?" — follow-up em 5m, 10m, 15h, 24h, 48h (Z-API ou API Fácil)
  let leadRecovery: { sent: number; total: number; errors?: string[]; listError?: string } = { sent: 0, total: 0 }
  if (isZapiConfigured() || isApifacilConfigured()) {
    const sendTextMessage = isZapiConfigured() ? zapiSendText : apifacilSendText
    const sendOne = async (phone: string, text: string) => {
      const r = await sendTextMessage(phone, text, { delayTyping: 1 })
      return { success: r?.success ?? false, error: r?.error }
    }
    try {
      const recovery = await runLeadRecoveryFollowUps(sendOne)
      leadRecovery = { sent: recovery.sent, total: recovery.total, errors: recovery.errors, listError: recovery.listError }
      if (recovery.listError) {
        console.error('[Cron boas-vindas] lead recovery listError:', recovery.listError)
      }
      if (recovery.errors?.length) {
        (result as { errors?: string[] }).errors = [...((result as { errors?: string[] }).errors ?? []), ...recovery.errors]
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[Cron boas-vindas] runLeadRecoveryFollowUps exceção:', msg)
      leadRecovery = { sent: 0, total: 0, listError: msg }
    }
  }

  // Revisão de leads no vácuo: quem enviou mensagem e não recebeu resposta (a cada 2 min, responde com PLEN)
  let revisaoVacuo: { processed: number; errors: string[] } = { processed: 0, errors: [] }
  if (isZapiConfigured()) {
    try {
      const rev = await runRevisaoVacuo(2, 48)
      revisaoVacuo = { processed: rev.processed, errors: rev.errors ?? [] }
      if (rev.errors?.length) {
        (result as { errors?: string[] }).errors = [...((result as { errors?: string[] }).errors ?? []), ...rev.errors]
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[Cron boas-vindas] runRevisaoVacuo exceção:', msg)
      revisaoVacuo = { processed: 0, errors: [msg] }
    }
  }

  return NextResponse.json({
    ...result,
    leadRecovery,
    revisaoVacuo,
  })
}
