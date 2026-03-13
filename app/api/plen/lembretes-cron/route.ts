/**
 * Cron: envia mensagens de lembrete no dia (e horário quando informado).
 * Mensagem pergunta "Você já pagou?" e guarda lembretePerguntaId no state para tratar sim/não.
 * Chamar a cada hora (ex.: :00) para respeitar horário. GET/POST com Authorization: Bearer CRON_SECRET.
 */

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getPlenLembretesParaHoje, markPlenLembreteEnviado } from '@/lib/plen/lembretes/plen-lembretes'
import { enqueuePlenMessage } from '@/lib/plen/queue/message-queue'

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.PLEN_QUEUE_SECRET

function auth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = authHeader?.replace(/^Bearer\s+/i, '') ?? new URL(request.url).searchParams.get('secret')
  return !!(CRON_SECRET && secret === CRON_SECRET)
}

function normalizeContext(ctx: Record<string, unknown> | string | null | undefined): Record<string, unknown> {
  if (ctx == null) return {}
  if (typeof ctx === 'object' && !Array.isArray(ctx)) return ctx
  if (typeof ctx === 'string') {
    try {
      const parsed = JSON.parse(ctx) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
    } catch {
      return {}
    }
  }
  return {}
}

export async function GET(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const lembretes = await getPlenLembretesParaHoje()
    const supabase = createAdminClient()
    let sent = 0
    for (const l of lembretes) {
      const msg =
        l.tipo === 'pagar'
          ? `📅 Não esqueça que você precisa pagar *${l.descricao}* hoje!! Você já pagou?\n\nSe sim, diga *sim*!\nSe não, diga *não*! 💙`
          : `📅 Hoje você deve receber: *${l.descricao}*. Já recebeu?\n\nSe sim, diga *sim*!\nSe não, diga *não*! 💙`
      await enqueuePlenMessage(l.contact_id, msg)
      if (supabase) {
        const { data: row } = await supabase
          .from('chatbot_flow_state')
          .select('flow_id, current_node_id, context')
          .eq('contact_id', l.contact_id)
          .maybeSingle()
        if (row) {
          const ctx = normalizeContext((row as { context?: unknown })?.context)
          await supabase
            .from('chatbot_flow_state')
            .update({
              context: { ...ctx, lembretePerguntaId: l.id },
              updated_at: new Date().toISOString(),
            })
            .eq('contact_id', l.contact_id)
        }
      }
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
