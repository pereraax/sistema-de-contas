/**
 * Cron: reengajamento — envia mensagem amigável para conversas paradas.
 * Intervalos grandes e aleatórios (ex.: 1x a cada 72h por contato). GET/POST com CRON_SECRET.
 */

import { NextResponse } from 'next/server'
import { getContactsParaReengajar } from '@/lib/plen/reengagement/reengagement-cron'
import { setReengagementSentAt } from '@/lib/plen/state/user-state-manager'
import { enqueuePlenMessage } from '@/lib/plen/queue/message-queue'

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.PLEN_QUEUE_SECRET

const MENSAGENS_REENGAJAMENTO = (nome: string) => [
  `Ei ${nome} 💬 Posso continuar te mostrando como funciona?`,
  `Oi ${nome}! 💙 Sumiu? Estou aqui quando quiser registrar seus gastos.`,
  `${nome}, ainda posso te ajudar a organizar suas finanças. É só mandar uma mensagem! 💙`,
]

function auth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = authHeader?.replace(/^Bearer\s+/i, '') ?? new URL(request.url).searchParams.get('secret')
  return !!(CRON_SECRET && secret === CRON_SECRET)
}

export async function GET(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const contacts = await getContactsParaReengajar(5)
    let sent = 0
    for (const c of contacts) {
      const nome = c.nome?.trim() && c.nome.length >= 2 ? c.nome : 'amigo'
      const msg = MENSAGENS_REENGAJAMENTO(nome)[Math.floor(Math.random() * MENSAGENS_REENGAJAMENTO(nome).length)]
      await enqueuePlenMessage(c.contact_id, msg)
      await setReengagementSentAt(c.contact_id)
      sent++
    }
    return NextResponse.json({ ok: true, sent, total: contacts.length })
  } catch (e) {
    const err = e as Error
    console.error('[plen/reengagement-cron]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
