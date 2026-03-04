import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { listPendentes, addPendenteManualmente, normalizarPhone } from '@/lib/whatsapp-contatos-pendentes'
import { listarNotificacoesEnviadas } from '@/lib/whatsapp-apifacil-notificacoes'

/** GET: lista só quem NÃO recebeu as 3 mensagens (0, 1 ou 2 = ainda esperando resposta). Quem já recebeu 3 ou mais NÃO aparece. */
export async function GET() {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const list = await listPendentes()
  if (list.length === 0) {
    return NextResponse.json({ pendentes: [] })
  }

  const dataFinal = new Date()
  const dataInicial = new Date()
  dataInicial.setDate(dataInicial.getDate() - 30)
  // Buscar mais notificações (500) para contar corretamente — cada fluxo pode gerar 4+ envios (ex.: botão URL = 2 mensagens)
  const { notificacoes: enviadas, error: errEnviadas } = await listarNotificacoesEnviadas(
    dataInicial.toISOString().slice(0, 10),
    dataFinal.toISOString().slice(0, 10),
    500,
    { omitirInstanciaId: true }
  )
  if (errEnviadas) {
    console.error('[whatsapp-pendentes] Erro ao listar enviadas:', errEnviadas)
    return NextResponse.json({ pendentes: [] })
  }

  const respostasPorDestino = new Map<string, { ts: number; mensagem?: string }[]>()
  for (const e of enviadas) {
    const dest = normalizarPhone(String(e.destino ?? ''))
    if (dest.length < 10) continue
    const ts = new Date(e.created_at).getTime()
    const mensagem = e.mensagem ?? ''
    if (!respostasPorDestino.has(dest)) respostasPorDestino.set(dest, [])
    respostasPorDestino.get(dest)!.push({ ts, mensagem: mensagem || undefined })
  }
  for (const [, arr] of respostasPorDestino) {
    arr.sort((a, b) => a.ts - b.ts)
  }

  // Mostrar só quem NÃO recebeu 3 mensagens nossas (recebeu 0, 1 ou 2 = ainda esperando). Quem recebeu 3+ sai da lista.
  const MIN_RESPOSTAS_PARA_CONSIDERAR_RESPONDIDO = 3
  const pendentesFiltrados = list.filter((row) => {
    const p = normalizarPhone(row.phone)
    const tsMensagem = (row.last_message_at || row.created_at)
      ? new Date(row.last_message_at || row.created_at).getTime()
      : 0
    const nossosEnvios = respostasPorDestino.get(p) ?? []
    const qtdNossasMensagensDepois = nossosEnvios.filter((x) => x.ts > tsMensagem).length
    const naoRecebeuAsTres = qtdNossasMensagensDepois < MIN_RESPOSTAS_PARA_CONSIDERAR_RESPONDIDO
    return naoRecebeuAsTres
  })

  return NextResponse.json({ pendentes: pendentesFiltrados })
}

/** POST: adiciona um número manualmente à lista de pendentes (para reenvio). Body: { "phone": "5511999999999" }. */
export async function POST(request: NextRequest) {
  const admin = await verifyAdminToken()
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  let body: { phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body deve ser JSON com campo "phone"' }, { status: 400 })
  }
  const phone = String(body.phone ?? '').trim()
  if (!phone) {
    return NextResponse.json({ error: 'Campo "phone" é obrigatório' }, { status: 400 })
  }
  const result = await addPendenteManualmente(phone)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Erro ao adicionar' }, { status: 400 })
  }
  return NextResponse.json({ success: true, message: 'Número adicionado. Aparecerá na lista em até 10s ou clique em Atualizar.' })
}
