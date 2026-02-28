/**
 * Checagem periódica: envia as 3 mensagens de boas-vindas para quem ainda não recebeu.
 * Chamar a cada 1 minuto via cron (cron-job.org, Railway cron, etc.).
 *
 * Autenticação: header Authorization: Bearer <CRON_SECRET> ou X-Cron-Secret: <CRON_SECRET>
 * GET ou POST.
 */

import { NextRequest, NextResponse } from 'next/server'
import { listPhonesPendentesParaCron, markWelcomeSent } from '@/lib/whatsapp-contatos-pendentes'
import { sendBoasVindasToNumber } from '@/lib/whatsapp-enviar-boas-vindas-lib'
import { isApifacilConfigured } from '@/lib/whatsapp-apifacil'

const CRON_SECRET = process.env.CRON_SECRET?.trim()

function isAuthorized(request: NextRequest): boolean {
  if (!CRON_SECRET) return false
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
  if (!isApifacilConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'API Fácil não configurada' },
      { status: 503 }
    )
  }

  // Últimos 7 dias: quem mandou mensagem e ainda não tem welcome_sent_at
  const pendentes = await listPhonesPendentesParaCron(168)
  const errors: string[] = []
  let processed = 0

  for (const { phone } of pendentes) {
    try {
      const result = await sendBoasVindasToNumber(phone)
      if (result.success) {
        await markWelcomeSent(phone)
        processed += 1
      } else {
        errors.push(`${phone}: ${result.error ?? 'erro ao enviar'}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${phone}: ${msg}`)
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    total: pendentes.length,
    errors: errors.length ? errors : undefined,
  })
}
