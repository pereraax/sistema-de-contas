/**
 * Cron: envia mensagens de lembrete no dia (preciso pagar/receber dia X).
 * Chamar 1x por dia (ex.: 9h). GET/POST com Authorization: Bearer CRON_SECRET.
 */

import { NextResponse } from 'next/server'
import { getPlenLembretesParaHoje, markPlenLembreteEnviado } from '@/lib/plen/lembretes/plen-lembretes'
import { enqueuePlenMessage } from '@/lib/plen/queue/message-queue'

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.PLEN_QUEUE_SECRET

function auth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = authHeader?.replace(/^Bearer\s+/i, '') ?? new URL(request.url).searchParams.get('secret')
  return !!(CRON_SECRET && secret === CRON_SECRET)
}

export async function GET(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const lembretes = await getPlenLembretesParaHoje()
    let sent = 0
    for (const l of lembretes) {
      const msg =
        l.tipo === 'pagar'
          ? `📅 Lembrete: hoje é dia de ${l.descricao}. Não esqueça! 💙`
          : `📅 Lembrete: hoje você deve receber: ${l.descricao}. 💙`
      await enqueuePlenMessage(l.contact_id, msg)
      await markPlenLembreteEnviado(l.id)
      sent++
    }
    return NextResponse.json({ ok: true, sent, total: lembretes.length })
  } catch (e) {
    const err = e as Error
    console.error('[plen/lembretes-cron]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
