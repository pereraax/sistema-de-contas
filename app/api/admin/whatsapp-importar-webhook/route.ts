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

/** POST: importa só quem enviou "Olá! Quero utilizar a Plenipay" e NÃO recebeu nenhuma resposta da assistente (zero = não foi respondido). */
export async function POST() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const dataFinal = new Date()
  const dataInicial = new Date()
  dataInicial.setDate(dataInicial.getDate() - 7)
  const dataInicialStr = dataInicial.toISOString().slice(0, 10)
  const dataFinalStr = dataFinal.toISOString().slice(0, 10)

  let resRecebidas = await listarNotificacoesRecebidas(dataInicialStr, dataFinalStr)
  let resEnviadas = await listarNotificacoesEnviadas(dataInicialStr, dataFinalStr)
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

  // Se a API retornou 0 recebidas mas estamos com instancia_id, tentar sem filtro de instância (algumas APIs tratam diferente)
  if (resRecebidas.notificacoes.length === 0) {
    const retryRecebidas = await listarNotificacoesRecebidas(dataInicialStr, dataFinalStr, 50, {
      omitirInstanciaId: true,
    })
    const retryEnviadas = await listarNotificacoesEnviadas(dataInicialStr, dataFinalStr, 50, {
      omitirInstanciaId: true,
    })
    if (retryRecebidas.notificacoes.length > 0 && !retryRecebidas.error) {
      resRecebidas = retryRecebidas
    }
    if (retryEnviadas.notificacoes.length > 0 && !retryEnviadas.error) {
      resEnviadas = retryEnviadas
    }
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

  // Incluir só quem NÃO FOI RESPONDIDO: zero respostas nossas depois da mensagem "Olá! Quero utilizar a Plenipay"
  const paraImportar: { origem: string; mensagem: string; created_at: string }[] = []
  for (const [, info] of porPhone) {
    const p = normalizarPhone(info.origem)
    const tsMensagem = new Date(info.created_at).getTime()
    const nossosEnvios = respostasPorDestino.get(p) ?? []
    const teveAlgumaResposta = nossosEnvios.some((ts) => ts > tsMensagem)
    if (!teveAlgumaResposta) {
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
      ? 'Nenhuma mensagem recebida na API Fácil nos últimos 7 dias. Verifique: 1) APIFACIL_INSTANCE_ID e APIFACIL_TOKEN no servidor; 2) no painel apifacil.dev se há notificações/histórico nesse período; 3) se o endpoint de notificações está habilitado para sua conta.'
      : paraImportar.length === 0
        ? `Encontradas ${recebidas.length} mensagens recebidas, ${porPhone.size} com "quero utilizar plenipay", mas todos já foram respondidos (receberam pelo menos 1 mensagem nossa).`
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
