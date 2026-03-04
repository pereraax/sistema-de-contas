/**
 * Cron: no dia do lembrete, envia mensagem no WhatsApp para o usuário.
 * Ex.: "Olá! Hoje você precisa: pagar minha dívida de 11/03. Ok?"
 *
 * Chamar diariamente (ex.: 8h BRT) via cron-job.org ou similar.
 * Autenticação: Authorization: Bearer <CRON_SECRET> ou X-Cron-Secret: <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendTextMessage } from '@/lib/whatsapp-apifacil'
import { isApifacilConfigured } from '@/lib/whatsapp-apifacil'

const CRON_SECRET = process.env.CRON_SECRET?.trim()

function isAuthorized(request: NextRequest): boolean {
  if (!CRON_SECRET) return false
  const auth = request.headers.get('authorization')
  const secret = request.headers.get('x-cron-secret')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : secret?.trim()
  return token === CRON_SECRET
}

/** Retorna início e fim do dia "hoje" em America/Sao_Paulo em ISO UTC (para comparar com data_lembrete). */
function hojeBR(): { inicio: string; fim: string } {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const y = parseInt(parts.find((p) => p.type === 'year')!.value, 10)
  const m = parseInt(parts.find((p) => p.type === 'month')!.value, 10) - 1
  const d = parseInt(parts.find((p) => p.type === 'day')!.value, 10)
  // 00:00 BRT = 03:00 UTC; 23:59:59 BRT = 02:59:59 UTC do dia seguinte
  const inicio = new Date(Date.UTC(y, m, d, 3, 0, 0, 0))
  const fim = new Date(Date.UTC(y, m, d + 1, 2, 59, 59, 999))
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
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

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase admin não disponível' },
      { status: 503 }
    )
  }

  const { inicio, fim } = hojeBR()

  // Lembretes com data_lembrete hoje, pendentes, ainda não notificados por WhatsApp
  const { data: lembretes, error: errLembretes } = await supabase
    .from('lembretes')
    .select('id, descricao, account_owner_id')
    .eq('status', 'pendente')
    .gte('data_lembrete', inicio)
    .lte('data_lembrete', fim)
    .is('whatsapp_lembrete_enviado_at', null)
    .not('account_owner_id', 'is', null)

  if (errLembretes) {
    console.error('[cron-lembretes] Erro ao buscar lembretes:', errLembretes)
    return NextResponse.json(
      { ok: false, error: errLembretes.message },
      { status: 500 }
    )
  }

  if (!lembretes?.length) {
    return NextResponse.json({ ok: true, processed: 0, total: 0 })
  }

  const accountOwnerIds = [...new Set(lembretes.map((l) => l.account_owner_id).filter(Boolean))] as string[]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, whatsapp')
    .in('id', accountOwnerIds)

  const whatsappByOwner: Record<string, string> = {}
  for (const p of profiles ?? []) {
    const w = (p.whatsapp ?? '').trim().replace(/\D/g, '')
    if (w.length >= 10) {
      whatsappByOwner[p.id] = w.startsWith('55') ? w : `55${w}`
    }
  }

  const errors: string[] = []
  let processed = 0

  for (const lembrete of lembretes) {
    const phone = lembrete.account_owner_id ? whatsappByOwner[lembrete.account_owner_id] : null
    if (!phone) {
      continue
    }
    const descricao = (lembrete.descricao ?? '').trim() || 'cumprir seu compromisso'
    const mensagem = `Olá! Hoje você precisa: ${descricao}. Ok? 📌`
    try {
      const result = await sendTextMessage(phone, mensagem)
      if (result.success) {
        await supabase
          .from('lembretes')
          .update({ whatsapp_lembrete_enviado_at: new Date().toISOString() })
          .eq('id', lembrete.id)
        processed += 1
      } else {
        errors.push(`lembrete ${lembrete.id}: ${result.error ?? 'erro ao enviar'}`)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`lembrete ${lembrete.id}: ${msg}`)
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    total: lembretes.length,
    errors: errors.length ? errors : undefined,
  })
}
