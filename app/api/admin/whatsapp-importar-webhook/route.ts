import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import {
  listarNotificacoesRecebidas,
  listarNotificacoesEnviadas,
} from '@/lib/whatsapp-apifacil-notificacoes'
import { backfillFromNotificacoes, isQueroUtilizarPlenipay } from '@/lib/whatsapp-contatos-pendentes'

function normalizarPhone(phone: string): string {
  const limpo = String(phone).replace(/\D/g, '')
  return limpo.length >= 10 && !limpo.startsWith('55') ? `55${limpo}` : limpo
}

/** Número mínimo de mensagens nossas depois da mensagem deles para considerar "já respondido". Quem recebeu 0, 1 ou 2 aparece como pendente. */
const MIN_RESPOSTAS_PARA_CONSIDERAR_RESPONDIDO = 3

/** POST: importa quem enviou "Olá! Quero utilizar a Plenipay" e recebeu no máximo 2 respostas nossas (0, 1 ou 2 = pendente). */
export async function POST() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const dataFinal = new Date()
  const dataInicial = new Date()
  dataInicial.setDate(dataInicial.getDate() - 30)
  const dataInicialStr = dataInicial.toISOString().slice(0, 10)
  const dataFinalStr = dataFinal.toISOString().slice(0, 10)

  // Chamar SEM instancia_id primeiro: a API Fácil costuma retornar dados assim; com instancia_id às vezes vem vazio
  const optsSemInstancia = { omitirInstanciaId: true }
  let resRecebidas = await listarNotificacoesRecebidas(dataInicialStr, dataFinalStr, 50, optsSemInstancia)
  let resEnviadas = await listarNotificacoesEnviadas(dataInicialStr, dataFinalStr, 50, optsSemInstancia)
  if (resRecebidas.error) {
    return NextResponse.json(
      { success: false, error: resRecebidas.error, importados: 0 },
      { status: 502 }
    )
  }
  if (resEnviadas.error) {
    return NextResponse.json(
      { success: false, error: resEnviadas.error, importados: 0 },
      { status: 502 }
    )
  }

  // Se ainda 0 recebidas, tentar COM instancia_id (caso a API exija para algumas contas)
  if (resRecebidas.notificacoes.length === 0) {
    const retryR = await listarNotificacoesRecebidas(dataInicialStr, dataFinalStr, 50)
    const retryE = await listarNotificacoesEnviadas(dataInicialStr, dataFinalStr, 50)
    if (retryR.notificacoes.length > 0 && !retryR.error) resRecebidas = retryR
    if (retryE.notificacoes.length > 0 && !retryE.error) resEnviadas = retryE
  }

  const recebidas = resRecebidas.notificacoes
  const enviadas = resEnviadas.notificacoes

  // Quem enviou "Olá, quero utilizar a Plenipay" (ou similar) — aceitar variações de texto
  const queroUtilizar = recebidas.filter((n) => {
    const msg = (n.mensagem ?? '').trim()
    return msg && isQueroUtilizarPlenipay(msg)
  })
  // Por número: ficamos com a mensagem mais recente
  const porPhone = new Map<string, { origem: string; mensagem: string; created_at: string }>()
  for (const n of queroUtilizar) {
    const p = normalizarPhone(n.origem)
    if (p.length < 10) continue
    const existente = porPhone.get(p)
    if (!existente || new Date(n.created_at) > new Date(existente.created_at)) {
      porPhone.set(p, { origem: n.origem, mensagem: n.mensagem, created_at: n.created_at })
    }
  }

  // Montar set: para cada (destino, data_envio) das nossas respostas
  const respostasPorDestino = new Map<string, number[]>()
  for (const e of enviadas) {
    const dest = normalizarPhone(e.destino)
    if (dest.length < 10) continue
    const ts = new Date(e.created_at).getTime()
    if (!respostasPorDestino.has(dest)) respostasPorDestino.set(dest, [])
    respostasPorDestino.get(dest)!.push(ts)
  }
  for (const [, timestamps] of respostasPorDestino) {
    timestamps.sort((a, b) => a - b)
  }

  // Incluir quem recebeu menos de MIN_RESPOSTAS (0, 1 ou 2 mensagens nossas depois da mensagem "quero utilizar plenipay")
  const paraImportar: { origem: string; mensagem: string; created_at: string }[] = []
  for (const [, info] of porPhone) {
    const p = normalizarPhone(info.origem)
    const tsMensagem = new Date(info.created_at).getTime()
    const nossosEnvios = respostasPorDestino.get(p) ?? []
    const qtdRespostasDepois = nossosEnvios.filter((ts) => ts > tsMensagem).length
    if (qtdRespostasDepois < MIN_RESPOSTAS_PARA_CONSIDERAR_RESPONDIDO) {
      paraImportar.push({ origem: info.origem, mensagem: info.mensagem, created_at: info.created_at })
    }
  }

  const { importados, error: errBackfill } = await backfillFromNotificacoes(paraImportar)
  if (errBackfill) {
    return NextResponse.json(
      { success: false, error: errBackfill, importados: 0 },
      { status: 500 }
    )
  }
  const mensagem =
    recebidas.length === 0
      ? 'Nenhuma mensagem recebida na API Fácil nos últimos 30 dias. Verifique: 1) APIFACIL_TOKEN no servidor; 2) no painel apifacil.dev se há notificações/histórico; 3) se o endpoint de notificações está habilitado para sua conta.'
      : paraImportar.length === 0
        ? `Encontradas ${recebidas.length} mensagens recebidas, ${porPhone.size} com "quero utilizar plenipay", mas todos já receberam 3 ou mais respostas nossas nos últimos 30 dias.`
        : undefined

  return NextResponse.json({
    success: true,
    importados,
    total_recebidas: recebidas.length,
    total_quero_utilizar: porPhone.size,
    total_nao_respondidos: paraImportar.length,
    periodo: `${dataInicialStr} a ${dataFinalStr}`,
    mensagem,
  })
}
