/**
 * Checagem periódica: envia as 3 mensagens de boas-vindas para quem ainda não recebeu.
 * Antes de enviar, busca mensagens recebidas na API Fácil (últimas 48h) e preenche a tabela,
 * assim quem mandou mensagem mas o webhook não foi chamado também entra na fila.
 * Chamar a cada 1 minuto via cron (cron-job.org, Railway cron, etc.).
 *
 * Autenticação: header Authorization: Bearer <CRON_SECRET> ou X-Cron-Secret: <CRON_SECRET>
 * GET ou POST.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  listPhonesPendentesParaCron,
  markWelcomeSent,
  backfillFromNotificacoes,
  isQueroUtilizarPlenipay,
} from '@/lib/whatsapp-contatos-pendentes'
import { listarNotificacoesRecebidas } from '@/lib/whatsapp-apifacil-notificacoes'
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

  // 1) Buscar na API Fácil mensagens recebidas nas últimas 48h ("quero utilizar plenipay") e preencher a tabela.
  // Assim, mesmo quando o webhook não foi chamado, o contato entra na fila e recebe as 3 mensagens.
  let backfillImported = 0
  try {
    const dataFinal = new Date()
    const dataInicial = new Date()
    dataInicial.setHours(dataInicial.getHours() - 48)
    const dataInicialStr = dataInicial.toISOString().slice(0, 10)
    const dataFinalStr = dataFinal.toISOString().slice(0, 10)
    const res = await listarNotificacoesRecebidas(dataInicialStr, dataFinalStr, 100, { omitirInstanciaId: true })
    if (!res.error && res.notificacoes?.length) {
      const paraBackfill = res.notificacoes
        .filter((n) => isQueroUtilizarPlenipay((n.mensagem ?? '').trim()))
        .map((n) => ({ origem: n.origem, mensagem: n.mensagem ?? '', created_at: n.created_at }))
      const { importados } = await backfillFromNotificacoes(paraBackfill)
      backfillImported = importados
    }
  } catch (e) {
    console.error('[cron-boas-vindas-pendentes] backfill from API Fácil:', e)
  }

  // 2) Últimos 7 dias: quem está na tabela sem welcome_sent_at recebe as 3 mensagens
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
    backfillImported,
    processed,
    total: pendentes.length,
    errors: errors.length ? errors : undefined,
  })
}
