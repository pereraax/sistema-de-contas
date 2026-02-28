import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { listarNotificacoesRecebidas } from '@/lib/whatsapp-apifacil-notificacoes'
import { backfillFromNotificacoes } from '@/lib/whatsapp-contatos-pendentes'

/** POST: puxa do histórico da API Fácil as mensagens recebidas (webhook) e preenche a tabela de pendentes com quem enviou "quero utilizar plenipay". */
export async function POST() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const dataFinal = new Date()
  const dataInicial = new Date()
  dataInicial.setDate(dataInicial.getDate() - 90)
  const dataInicialStr = dataInicial.toISOString().slice(0, 10)
  const dataFinalStr = dataFinal.toISOString().slice(0, 10)
  const { notificacoes, error: errList } = await listarNotificacoesRecebidas(dataInicialStr, dataFinalStr)
  if (errList) {
    return NextResponse.json(
      { success: false, error: errList, importados: 0 },
      { status: 502 }
    )
  }
  const paraBackfill = notificacoes.map((n) => ({
    origem: n.origem,
    mensagem: n.mensagem,
    created_at: n.created_at,
  }))
  const { importados, error: errBackfill } = await backfillFromNotificacoes(paraBackfill)
  if (errBackfill) {
    return NextResponse.json(
      { success: false, error: errBackfill, importados: 0 },
      { status: 500 }
    )
  }
  return NextResponse.json({
    success: true,
    importados,
    total_notificacoes: notificacoes.length,
    periodo: `${dataInicialStr} a ${dataFinalStr}`,
  })
}
