/**
 * Cron: mensagens inteligentes da Plen (AHA moments).
 * Analisa contatos em plen_user_activity (quem já interagiu pelo WhatsApp) e envia uma
 * mensagem por inatividade: 10min, 1h ou 24h sem interação (+ eventos de 10/20 registros, categorias).
 * Chamar a cada 10–15 min (ex.: Railway Cron, Vercel Cron). Header: Authorization: Bearer <CRON_SECRET> ou x-cron-secret.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getEligibleUsers, sendSmartMessage } from '@/lib/plen-smart-messages'
import { isZapiConfigured } from '@/lib/whatsapp-zapi'
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

  const eligible = await getEligibleUsers(supabase)
  const errors: string[] = []
  let sent = 0

  for (const { userId, eventType, payload } of eligible) {
    const result = await sendSmartMessage(supabase, userId, eventType, payload)
    if (result.success) {
      sent += 1
    } else {
      errors.push(`${userId} ${eventType}: ${result.error ?? 'erro'}`)
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: eligible.length,
    errors: errors.length ? errors : undefined,
  })
}
