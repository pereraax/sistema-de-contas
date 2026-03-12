/**
 * POST: processa até 5 itens da fila PLEN (admin only).
 */

import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { processPlenQueue } from '@/lib/plen/queue/queue-worker'

export async function POST() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { sent, failed } = await processPlenQueue(5)
    return NextResponse.json({ ok: true, sent, failed })
  } catch (e) {
    const err = e as Error
    console.error('[admin/plen-process-queue]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
