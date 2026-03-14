/**
 * Cron: reengajamento por tier (5 min, 2 h, 24 h) + follow-up de cadastro ignorado.
 * Cadastro ignorado: usuário parou em "Qual é o seu nome?" ou "Me diga seu email" e não respondeu;
 * após 5 min a 1 h enviamos: "Vamos terminar seu cadastro? Ter um controle do seu dinheiro..."
 * Rodar a cada 5–10 min (ex.: GET /api/plen/reengagement-cron com CRON_SECRET).
 */

import { NextResponse } from 'next/server'
import { getContactsParaReengajarPorTier, getMensagemReengajamentoTier } from '@/lib/plen/reengagement/reeng-tiers'
import {
  getContactsComCadastroIgnorado,
  getMensagemCadastroIgnorado,
  markIgnoredCadastroFollowupSent,
} from '@/lib/plen/reengagement/ignored-cadastro'
import { setReengTierSentAt } from '@/lib/plen/state/user-state-manager'
import { enqueuePlenMessage } from '@/lib/plen/queue/message-queue'
import { processPlenQueue } from '@/lib/plen/queue/queue-worker'

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.PLEN_QUEUE_SECRET

const LIMIT_PER_RUN = 15
const LIMIT_IGNORED_CADASTRO = 20

function auth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = authHeader?.replace(/^Bearer\s+/i, '') ?? new URL(request.url).searchParams.get('secret')
  return !!(CRON_SECRET && secret === CRON_SECRET)
}

export async function GET(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let sentIgnoredCadastro = 0
    const ignoredCadastro = await getContactsComCadastroIgnorado(LIMIT_IGNORED_CADASTRO)
    const msgCadastro = getMensagemCadastroIgnorado()
    for (const c of ignoredCadastro) {
      await enqueuePlenMessage(c.contact_id, msgCadastro, new Date())
      const ok = await markIgnoredCadastroFollowupSent(c.contact_id, c.flow_id, c.current_node_id)
      if (ok) sentIgnoredCadastro++
    }

    const contacts = await getContactsParaReengajarPorTier(LIMIT_PER_RUN)
    let sentTiers = 0
    for (const c of contacts) {
      const nome = c.nome?.trim() && c.nome.length >= 2 ? c.nome : 'amigo'
      const msg = getMensagemReengajamentoTier(c.tier, nome)
      await enqueuePlenMessage(c.contact_id, msg, new Date())
      await setReengTierSentAt(c.contact_id, c.tier)
      sentTiers++
    }

    const totalSent = sentIgnoredCadastro + sentTiers
    if (totalSent > 0) await processPlenQueue(totalSent + 5).catch(() => {})

    return NextResponse.json({
      ok: true,
      sent: totalSent,
      ignored_cadastro: sentIgnoredCadastro,
      tiers: sentTiers,
      total_tiers: contacts.length,
      tiers_detail: contacts.reduce((acc, c) => ({ ...acc, [c.tier]: (acc[c.tier] ?? 0) + 1 }), {} as Record<string, number>),
    })
  } catch (e) {
    const err = e as Error
    console.error('[plen/reengagement-cron]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
