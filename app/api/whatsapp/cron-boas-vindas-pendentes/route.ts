/**
 * Automação a cada 5 minutos: envia as 3 mensagens de boas-vindas para quem ainda não recebeu.
 * Lista contatos em whatsapp_contatos com welcome_sent_at = null (últimos 7 dias) e envia para cada um.
 * Se API Fácil estiver configurada, antes faz backfill das notificações (48h) para preencher a tabela.
 * Configure um cron externo para chamar este endpoint a cada 5 minutos (cron-job.org, Railway cron, etc.).
 *
 * URL: GET ou POST /api/whatsapp/cron-boas-vindas-pendentes
 * Autenticação: header Authorization: Bearer <CRON_SECRET> ou X-Cron-Secret: <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { runBoasVindasPendentes } from '@/lib/whatsapp-cron-boas-vindas'
import { isBoasVindasConfigured } from '@/lib/whatsapp-enviar-boas-vindas-lib'

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
  if (!isBoasVindasConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Nenhum provedor de boas-vindas configurado (Z-API ou API Fácil)' },
      { status: 503 }
    )
  }

  const result = await runBoasVindasPendentes(168)
  return NextResponse.json(result)
}
