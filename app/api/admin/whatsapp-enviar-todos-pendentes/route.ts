/**
 * POST: executa a mesma lógica do cron de boas-vindas (backfill API Fácil + envio das 3 mensagens para todos pendentes).
 * Protegido por sessão admin. Use o botão "Enviar para todos pendentes agora" no painel WhatsApp.
 */

import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { runBoasVindasPendentes } from '@/lib/whatsapp-cron-boas-vindas'
import { isBoasVindasConfigured } from '@/lib/whatsapp-enviar-boas-vindas-lib'

export async function POST() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }
  if (!isBoasVindasConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Nenhum provedor configurado. Configure Z-API (ZAPI_*) ou API Fácil (APIFACIL_*).' },
      { status: 503 }
    )
  }

  const result = await runBoasVindasPendentes(168)
  return NextResponse.json(result)
}
