/**
 * POST: dispara uma revisão de leads "no vácuo" (quem enviou mensagem e não recebeu resposta).
 * Responde cada um com a mesma lógica do webhook (PLEN), com delay 3–5 s entre envios.
 * Requer autenticação admin.
 */

import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { runRevisaoVacuo } from '@/lib/whatsapp-revisao-vacuo'
import { isZapiConfigured } from '@/lib/whatsapp-zapi'

export async function POST() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }
  if (!isZapiConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Z-API não configurada' },
      { status: 503 }
    )
  }
  try {
    const result = await runRevisaoVacuo(2, 48)
    return NextResponse.json({
      success: result.ok,
      processed: result.processed,
      errors: result.errors ?? [],
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[admin/whatsapp-revisao-vacuo]', msg)
    return NextResponse.json(
      { success: false, error: msg, processed: 0, errors: [msg] },
      { status: 500 }
    )
  }
}
