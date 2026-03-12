/**
 * PLEN — Queue worker: processa fila de mensagens (1 a cada 2s).
 * Chamar via cron (ex.: a cada 1 min) ou manualmente.
 * GET: processa até 5 mensagens. Use header ou query para autorização.
 */

import { NextResponse } from 'next/server'
import { processPlenQueue } from '@/lib/plen/queue/queue-worker'

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.PLEN_QUEUE_SECRET

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = request.nextUrl.searchParams.get('secret') ?? authHeader?.replace(/^Bearer\s+/i, '')
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { sent, failed } = await processPlenQueue(5)
    return NextResponse.json({ ok: true, sent, failed })
  } catch (e) {
    const err = e as Error
    console.error('[plen/queue-worker]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
