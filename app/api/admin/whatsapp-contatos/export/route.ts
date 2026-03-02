/**
 * GET: exporta contatos WhatsApp que entraram em contato com o assistente.
 * Query: days (número, opcional) — últimos N dias (padrão: 3).
 * Retorna CSV com: phone, última_mensagem_em, última_mensagem, boas_vindas_enviadas_em.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

const TABLE = 'whatsapp_contatos'

function escapeCsvField(value: string | null | undefined): string {
  if (value == null) return ''
  const s = String(value).trim()
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get('days')
  const days = Math.min(90, Math.max(1, parseInt(daysParam || '3', 10) || 3))

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  const { data, error } = await supabase
    .from(TABLE)
    .select('phone, last_message_at, last_message, welcome_sent_at')
    .gte('last_message_at', sinceIso)
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('[whatsapp-contatos/export] Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
  }

  const rows = (data ?? []) as { phone: string; last_message_at: string | null; last_message: string | null; welcome_sent_at: string | null }[]
  const header = 'phone,última_mensagem_em,última_mensagem,boas_vindas_enviadas_em'
  const csvLines = [
    header,
    ...rows.map((r) => {
      const date = r.last_message_at ? new Date(r.last_message_at).toLocaleString('pt-BR') : ''
      const welcome = r.welcome_sent_at ? new Date(r.welcome_sent_at).toLocaleString('pt-BR') : ''
      return [r.phone, date, escapeCsvField(r.last_message ?? ''), welcome].join(',')
    }),
  ]
  const csv = csvLines.join('\r\n')
  const filename = `contatos-whatsapp-ultimos-${days}-dias.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
