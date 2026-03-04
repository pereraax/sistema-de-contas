/**
 * GET: histórico da conversa com um número (mensagens recebidas + enviadas da API Fácil).
 * Query: phone=5511999999999
 * Retorna mensagens ordenadas por data para exibir no painel tipo WhatsApp.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { listarNotificacoesRecebidas, listarNotificacoesEnviadas } from '@/lib/whatsapp-apifacil-notificacoes'
import { normalizarPhone } from '@/lib/whatsapp-contatos-pendentes'

function norm(s: string): string {
  const limpo = String(s).replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}

export interface MensagemConversa {
  from: 'us' | 'them'
  text: string
  date: string
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const phone = request.nextUrl.searchParams.get('phone')
  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: 'Query phone é obrigatório (ex: 5511999999999)' }, { status: 400 })
  }
  const phoneNorm = normalizarPhone(phone)
  if (phoneNorm.length < 10) {
    return NextResponse.json({ mensagens: [] })
  }

  const dataFinal = new Date()
  const dataInicial = new Date()
  dataInicial.setDate(dataInicial.getDate() - 30)
  const dataIni = dataInicial.toISOString().slice(0, 10)
  const dataFim = dataFinal.toISOString().slice(0, 10)

  const [rec, env] = await Promise.all([
    listarNotificacoesRecebidas(dataIni, dataFim, 100, { omitirInstanciaId: true }),
    listarNotificacoesEnviadas(dataIni, dataFim, 100, { omitirInstanciaId: true }),
  ])

  const mensagens: MensagemConversa[] = []
  for (const r of rec.notificacoes ?? []) {
    if (norm(r.origem) !== phoneNorm) continue
    mensagens.push({
      from: 'them',
      text: r.mensagem ?? '',
      date: r.created_at,
    })
  }
  for (const e of env.notificacoes ?? []) {
    if (norm(e.destino) !== phoneNorm) continue
    mensagens.push({
      from: 'us',
      text: e.mensagem ?? '',
      date: e.created_at,
    })
  }
  mensagens.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return NextResponse.json({ mensagens })
}
