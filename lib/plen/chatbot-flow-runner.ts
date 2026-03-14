/**
 * Motor de execução dos fluxos do Chatbot Builder.
 * Única fonte de mensagens/automação Plen: fluxo ativo em chatbot_flows.
 * Se não houver fluxo ativo, usa o fluxo padrão em memória para a Plen responder.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { getDefaultPlenFlow } from '@/lib/plen/chatbot-default-flow'
import { getContactById, updateContact } from '@/lib/crm/contacts'
import { enqueuePlenMessage } from '@/lib/plen/queue/message-queue'
import { getAssistenteGlobalPausada } from '@/lib/assistente-global-pausada'
import { getPlenLLMResponse } from '@/lib/plen-llm-fallback'
import { createUserAndSendCode, resendCodeForPlen, verifyCodeForPlen, upsertProfileFromPlenContact } from '@/lib/plen/auth/email-verification'
import {
  sendWhatsAppButtonReply,
  sendWhatsAppMenuButtons,
  sendWhatsAppMessageWithResult,
  sendWhatsAppMessageWithButtons,
} from '@/lib/whatsapp/sender'
import { parseExpenseOrReceita, parseMultipleExpensesOrReceita } from '@/lib/plen/ai/expense-parser'
import { createPlenLembrete, markPlenLembreteConcluido, getPlenLembreteById } from '@/lib/plen/lembretes/plen-lembretes'
import { parseLembreteMensagem } from '@/lib/plen/lembretes/parse-lembrete'
import { logPlenInteraction, getPlenRegistroCount } from '@/lib/plen/interaction/interaction-logs'

const LIMITE_REGISTROS_GRATUITOS = 10

/** URL do painel para links enviados no WhatsApp. Sempre plenipay.com (nunca localhost). */
const PLEN_DASHBOARD_URL = (process.env.PLEN_DASHBOARD_URL || 'https://plenipay.com').toString().replace(/\/$/, '')

/** Mensagem fixa do plano R$ 9,90 (usada quando o usuário escolhe "Assinatura R$9,90" e o fluxo no DB tem conteúdo errado). */
const MSG_PLANO_BASICO_9_90 =
  '💙 *Plano Básico — R$ 9,90/mês*\n\n' +
  'Com a assinatura você desbloqueia tudo que a PLEN oferece:\n\n' +
  '• *Controle ilimitado* de gastos e receitas\n' +
  '• *Lembretes* para não esquecer de registrar\n' +
  '• *Relatórios e visão do seu dinheiro* na plataforma\n' +
  '• *Metas* para guardar e planejar\n' +
  '• Acesso pelo celular e pelo computador, quando quiser\n\n' +
  'Por menos de R$ 0,35 por dia você organiza suas contas de forma simples e segura. Quer assinar? Use o botão abaixo para ir direto à plataforma.'
const BOTOES_PLANO_BASICO = [{ titulo: 'Ver plano e assinar na plataforma', link: '{dashboardUrl}/upgrade' }]

/** Lead só é considerado cadastrado se concluiu o fluxo: status ativo/cliente ou flag + data_cadastro. */
function isLeadCadastrado(contact: { status?: string; usuario_cadastrado?: boolean; data_cadastro?: string | null } | null): boolean {
  if (!contact) return false
  if (contact.status === 'usuario_ativo' || contact.status === 'cliente_pago') return true
  if (contact.usuario_cadastrado === true && contact.data_cadastro && String(contact.data_cadastro).trim() !== '') return true
  return false
}

/** Verifica se existe conta real no auth (profiles) para o email ou telefone do contato. Fonte de verdade: se não há user no painel, não é cadastrado. */
async function contactTemContaAuth(contact: { email?: string | null; telefone?: string } | null): Promise<boolean> {
  if (!contact) return false
  const supabase = createAdminClient()
  if (!supabase) return false
  const emailNorm = (contact.email ?? '').trim().toLowerCase()
  const phoneNorm = (contact.telefone ?? '').replace(/\D/g, '').trim()
  if (emailNorm && emailNorm.includes('@')) {
    const { data: byEmail } = await supabase.from('profiles').select('id').eq('email', emailNorm).limit(1).maybeSingle()
    if (byEmail?.id) return true
  }
  if (phoneNorm.length >= 8) {
    const { data: byPhone } = await supabase
      .from('profiles')
      .select('id')
      .or(`telefone.eq.${phoneNorm},whatsapp.eq.${phoneNorm}`)
      .limit(1)
      .maybeSingle()
    if (byPhone?.id) return true
  }
  return false
}

/** Para saudação (oi/olá): só trata como cadastrado se o CRM indicar cadastro E existir conta no auth (profiles). Assim lead sem user no painel nunca recebe "vamos registrar?". */
async function isCadastradoParaSaudacao(
  contact: { status?: string; usuario_cadastrado?: boolean; data_cadastro?: string | null; email?: string | null; telefone?: string } | null
): Promise<boolean> {
  if (!contact) return false
  if (contact.status !== 'usuario_ativo' && contact.status !== 'cliente_pago') return false
  const temDataCadastro = contact.data_cadastro != null && String(contact.data_cadastro).trim() !== ''
  const flagCadastrado = contact.usuario_cadastrado === true
  if (!flagCadastrado || !temDataCadastro) return false
  return contactTemContaAuth(contact)
}

type EdgeRow = { source: string; target: string; sourceHandle?: string | null }
type ChatbotFlowRow = { id: string; nome: string; estrutura_json: { nodes: unknown[]; edges: EdgeRow[] } }

type FlowStateRow = { contact_id: string; flow_id: string; current_node_id: string; context: Record<string, unknown> | string; updated_at: string }

/** Garante context como objeto (Supabase às vezes devolve JSONB como string). */
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

function getNodes(flow: ChatbotFlowRow): Array<{ id: string; data?: { nodeType?: string; config?: Record<string, unknown> } }> {
  const j = flow?.estrutura_json
  if (!j || !Array.isArray(j.nodes)) return []
  return j.nodes
}

function getEdges(flow: ChatbotFlowRow): EdgeRow[] {
  const j = flow?.estrutura_json
  if (!j || !Array.isArray(j.edges)) return []
  return j.edges
}

function getNodeById(flow: ChatbotFlowRow, nodeId: string) {
  return getNodes(flow).find((n) => n.id === nodeId)
}

/** Retorna o primeiro nó do tipo menu no fluxo. Aceita nodeType === 'menu' ou config.menuOpcoes (fluxo salvo pode variar). */
function getFirstMenuNodeId(flow: ChatbotFlowRow): string | null {
  const nodes = getNodes(flow)
  let node = nodes.find((n) => n.data?.nodeType === 'menu')
  if (!node) {
    node = nodes.find((n) => {
      const cfg = n.data?.config as Record<string, unknown> | undefined
      return cfg && typeof cfg.menuOpcoes === 'string' && (cfg.menuOpcoes as string).trim().length > 0
    })
  }
  return node?.id ?? null
}

function getOutgoingTargets(flow: ChatbotFlowRow, sourceId: string): string[] {
  return getEdges(flow)
    .filter((e) => e.source === sourceId)
    .map((e) => e.target)
}

/** Aliases para opções de menu (ex.: botão "Total / saldo" vs nó "Ver saldo"; "Plano R$9,90" vs "Assinatura"). */
const MENU_LABEL_ALIASES: [string, string][] = [
  ['total / saldo', 'ver saldo'],
  ['total/saldo', 'ver saldo'],
  ['consultar saldo', 'ver saldo'],
  ['saldo', 'ver saldo'],
  ['plano r$9,90', 'assinatura'],
  ['plano r$9,90/mês', 'assinatura'],
  ['assinatura r$9,90', 'assinatura'],
  ['assinatura r$9.90', 'assinatura'],
  ['atendimento humano', 'falar com humano'],
]
function menuLabelsMatch(msg: string, label: string): boolean {
  const t = (msg || '').trim().toLowerCase().replace(/\s+/g, ' ')
  const l = (label || '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!t) return false
  if (t === l || t.includes(l) || l.includes(t)) return true
  if (t.includes('saldo') && l.includes('saldo')) return true
  for (const [a, b] of MENU_LABEL_ALIASES) {
    if ((t === a || t.includes(a)) && (l === b || l.includes(b))) return true
    if ((t === b || t.includes(b)) && (l === a || l.includes(a))) return true
  }
  return false
}

/** Retorna o targetId da opção do menu que corresponde à mensagem (match pelo label do nó de destino; não depende da ordem das edges). */
function getMenuTargetByMessage(flow: ChatbotFlowRow, menuNodeId: string, messageText: string): string | null {
  const targets = getOutgoingTargets(flow, menuNodeId)
  const t = (messageText || '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!t) return null
  // "Assinatura R$9,90" deve ir SEMPRE para o nó da assinatura (plano básico), nunca para o nó "Funções premium" (R$49,90).
  const isPlanoBasico = /\b(9[,.]90|r\s*\$?\s*9\b)/.test(t) && !/49/.test(t)
  const isPremium = /premium|49[,.]90|r\s*\$?\s*49/.test(t)
  if (isPlanoBasico) {
    for (const targetId of targets) {
      const node = getNodeById(flow, targetId)
      const label = (node?.data?.label ?? (node?.data?.config as Record<string, unknown>)?.preview ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ')
      if (!label || label.includes('premium')) continue
      if (label.includes('assinatura') && menuLabelsMatch(messageText.trim(), label)) return targetId
      if (menuLabelsMatch(messageText.trim(), label)) return targetId
    }
  }
  if (isPremium) {
    for (const targetId of targets) {
      const node = getNodeById(flow, targetId)
      const label = (node?.data?.label ?? (node?.data?.config as Record<string, unknown>)?.preview ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ')
      if (!label || !label.includes('premium')) continue
      if (menuLabelsMatch(messageText.trim(), label)) return targetId
    }
  }
  for (const targetId of targets) {
    const node = getNodeById(flow, targetId)
    const label = (node?.data?.label ?? (node?.data?.config as Record<string, unknown>)?.preview ?? '').toString().trim().toLowerCase().replace(/\s+/g, ' ')
    if (!label) continue
    if (menuLabelsMatch(messageText.trim(), label)) return targetId
    const labelSemNum = label.replace(/^\d+\s*/, '')
    if (labelSemNum && menuLabelsMatch(messageText.trim(), labelSemNum)) return targetId
  }
  return null
}

/** Para Condição: 1ª saída = sim (sourceHandle "sim"), 2ª = nao. */
function getConditionTargets(flow: ChatbotFlowRow, sourceId: string): { sim: string | null; nao: string | null } {
  const edges = getEdges(flow).filter((e) => e.source === sourceId)
  let sim: string | null = null
  let nao: string | null = null
  for (const e of edges) {
    if (e.sourceHandle === 'sim') sim = e.target
    else if (e.sourceHandle === 'nao') nao = e.target
  }
  if (!sim && edges[0]) sim = edges[0].target
  if (!nao && edges[1]) nao = edges[1].target
  return { sim, nao }
}

/** Retorna o fluxo ativo (ativo = true; o mais recente se houver vários). Se não houver, retorna o fluxo padrão. */
async function getActiveFlow(): Promise<ChatbotFlowRow | null> {
  const supabase = createAdminClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('chatbot_flows')
      .select('id, nome, estrutura_json')
      .eq('ativo', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!error && data) {
      const est = (data as { estrutura_json?: unknown }).estrutura_json
      if (est && typeof est === 'object' && 'nodes' in est) return data as ChatbotFlowRow
    }
  }
  const { nodes, edges } = getDefaultPlenFlow()
  return { id: 'default', nome: 'Fluxo principal Plen', estrutura_json: { nodes, edges } }
}

async function getChatbotFlowState(contactId: string): Promise<FlowStateRow | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('chatbot_flow_state')
    .select('*')
    .eq('contact_id', contactId)
    .maybeSingle()
  if (error || !data) return null
  return data as FlowStateRow
}

export async function setChatbotFlowState(
  contactId: string,
  flowId: string,
  currentNodeId: string,
  context?: Record<string, unknown>
): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase
    .from('chatbot_flow_state')
    .upsert(
      {
        contact_id: contactId,
        flow_id: flowId,
        current_node_id: currentNodeId,
        context: context ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'contact_id' }
    )
  return !error
}

/** Remove o estado do fluxo do contato (para comando reset/resetar). */
export async function clearChatbotFlowState(contactId: string): Promise<boolean> {
  const supabase = createAdminClient()
  if (!supabase) return false
  const { error } = await supabase.from('chatbot_flow_state').delete().eq('contact_id', contactId)
  return !error
}

/** Nó Início: no builder é data.nodeType === 'inicio' e config em data.config. */
function findInicioNode(flow: ChatbotFlowRow): { id: string; config?: Record<string, unknown> } | null {
  const nodes = getNodes(flow)
  const n = nodes.find((node) => node.data?.nodeType === 'inicio')
  if (!n) return null
  const config = (n.data?.config ?? n.data) as Record<string, unknown> | undefined
  return { id: n.id, config }
}

/** Verifica se a mensagem dispara o nó Início (frasesGatilho e inicioTipo). */
function matchInicio(
  flow: ChatbotFlowRow,
  messageText: string,
  isNewLead: boolean
): { matched: boolean; inicioNodeId: string } | null {
  const inicio = findInicioNode(flow)
  if (!inicio) return null
  const config = inicio.config ?? {}
  const tipo = (config.inicioTipo as string) || 'mensagem_recebida'
  const frases = Array.isArray(config.frasesGatilho)
    ? (config.frasesGatilho as string[])
    : typeof config.frasesGatilho === 'string'
      ? [config.frasesGatilho]
      : []
  const text = (messageText || '').trim().toLowerCase()

  if (tipo === 'novo_lead') {
    if (!isNewLead) return null
    if (frases.length === 0) return { matched: true, inicioNodeId: inicio.id }
    const match = frases.some((f) => text.includes((f || '').trim().toLowerCase()))
    return match ? { matched: true, inicioNodeId: inicio.id } : null
  }

  if (tipo === 'palavra_especifica') {
    if (frases.length === 0) return null
    const match = frases.some((f) => text.includes((f || '').trim().toLowerCase()))
    return match ? { matched: true, inicioNodeId: inicio.id } : null
  }

  if (tipo === 'mensagem_recebida') {
    if (frases.length === 0) return { matched: true, inicioNodeId: inicio.id }
    const match = frases.some((f) => text.includes((f || '').trim().toLowerCase()))
    if (match) return { matched: true, inicioNodeId: inicio.id }
    // Novo lead: SEMPRE disparar Início (Plen 24h — qualquer primeira mensagem recebe boas-vindas).
    if (isNewLead) return { matched: true, inicioNodeId: inicio.id }
    // Lead já existente que não bateu nas frases: só aceitar saudações curtas para não ignorar "oi" após tempo parado.
    const saudacao =
      /^(oi|ol[aá]|ola|oii+|opa|e\s*a[ií]|eai|hey|fala|salve|bom\s*dia|boa\s*tarde|boa\s*noite)[\s!.]*$/i.test(text) ||
      /quero\s+utilizar|plenipay|quero\s+usar|quero\s+cadastr/i.test(text) ||
      (text.length <= 60 && /^(ol[aá]|oi)\s*[!.]?\s*/i.test(text))
    if (saudacao) return { matched: true, inicioNodeId: inicio.id }
    return null
  }

  return { matched: true, inicioNodeId: inicio.id }
}

function applyReplacements(text: string, vars: { nome?: string; valor?: string; categoria?: string; dashboardUrl?: string }): string {
  let out = text
  if (vars.nome != null) {
    out = out.replace(/\{\{nome\}\}/g, vars.nome).replace(/\{nome\}/g, vars.nome)
  }
  if (vars.valor != null) out = out.replace(/\{\{valor\}\}/g, String(vars.valor)).replace(/\{valor\}/g, String(vars.valor))
  if (vars.categoria != null) out = out.replace(/\{\{categoria\}\}/g, vars.categoria).replace(/\{categoria\}/g, vars.categoria)
  if (vars.dashboardUrl != null) {
    out = out.replace(/\{\{dashboardUrl\}\}/g, vars.dashboardUrl).replace(/\{dashboardUrl\}/g, vars.dashboardUrl)
  }
  return out
}

/**
 * Extrai apenas o nome do registro para exibição.
 * Ex.: "gastei 392 na sala" → "Sala"; "recebi 2190 de joana" → "Joana"; "gastei 876 carro" → "Carro".
 * 1) Se tiver preposição (no/na/de/da/do/em/com/para), usa o trecho após a última.
 * 2) Senão, remove verbo + número do início (gastei 876 carro → carro) e usa o resto.
 * 3) Se ainda sobrar só número ou vazio, usa a última palavra que não seja número.
 */
function extrairNomeRegistroCurto(descricao: string, intent: 'registrar_despesa' | 'registrar_receita'): string {
  const d = (descricao || '').trim().toLowerCase()
  if (!d || /^(gastei|gastou|paguei|pagou|gasto)$/.test(d)) return 'Gasto'
  if (/^(recebi|ganhei|entrada)$/.test(d)) return 'Entrada'

  let candidato = d

  const preposicoes = /\s+(no|na|de|da|do|em|com|para)\s+/gi
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = preposicoes.exec(d)) !== null) lastIndex = match.index + match[0].length
  if (lastIndex > 0) {
    candidato = d.slice(lastIndex).trim()
  } else {
    const semVerboValor = candidato.replace(
      /^(gastei|gasteu|paguei|pagou|recebi|recebeu|ganhei|ganhou|ganhamos)\s+[\d.,]+\s*(?:reais?|r\$|r\b)?\s*/i,
      ''
    ).trim()
    if (semVerboValor && !/^[\d.,\s]+$/.test(semVerboValor)) {
      candidato = semVerboValor
    } else {
      const palavras = d.split(/\s+/).filter((p) => p && !/^[\d.,]+$/.test(p))
      if (palavras.length > 0) candidato = palavras[palavras.length - 1]
    }
  }

  const nome = candidato || d
  const capitalizado = nome.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 100)
  return capitalizado || (intent === 'registrar_receita' ? 'Entrada' : 'Gasto')
}

/** Data de hoje no formato DD/MM/AAAA. */
function formatarDataHoje(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/** Extrai valor e categoria da mensagem (ex.: "219 carro" -> { valor: "219", categoria: "Carro" }; "cafe 12" -> { valor: "12", categoria: "Cafe" }). */
function parseGastoOuReceita(messageText: string): { valor: string; categoria: string } {
  const t = (messageText || '').trim()
  const numMatch = t.match(/\d+(?:[.,]\d+)?/)
  const valor = numMatch ? numMatch[0].replace(',', '.') : ''
  const resto = t.replace(/\d+(?:[.,]\d+)?/g, '').replace(/\s+/g, ' ').trim()
  const categoria = resto ? resto.charAt(0).toUpperCase() + resto.slice(1).toLowerCase() : 'Outros'
  return { valor, categoria }
}

/** Envia o texto do nó Mensagem e retorna o nodeId para ser o novo current. */
async function sendMessageNodeAndReturnNext(
  flow: ChatbotFlowRow,
  nodeId: string,
  contactId: string,
  nome: string,
  vars?: { valor?: string; categoria?: string; dashboardUrl?: string }
): Promise<{ sent: boolean; nextNodeId: string | null }> {
  const node = getNodeById(flow, nodeId)
  if (!node) return { sent: false, nextNodeId: null }
  const nodeType = node.data?.nodeType
  if (nodeType !== 'mensagem') {
    const targets = getOutgoingTargets(flow, nodeId)
    return { sent: false, nextNodeId: targets[0] ?? null }
  }
  const rawConfig = (node.data?.config ?? node.data) as Record<string, unknown> | undefined
  const config = rawConfig && typeof rawConfig === 'object' ? rawConfig : undefined
  const texto = (config?.texto as string)?.trim() || ''
  if (!texto) {
    const targets = getOutgoingTargets(flow, nodeId)
    return { sent: false, nextNodeId: targets[0] ?? null }
  }
  const msg = applyReplacements(texto, { nome, dashboardUrl: PLEN_DASHBOARD_URL, ...vars })
  const botoesRaw = config?.botoes as Array<{ titulo?: string; link?: string }> | undefined
  const botoes = Array.isArray(botoesRaw)
    ? botoesRaw
        .filter((b) => (b?.titulo ?? '').trim().length > 0)
        .map((b) => ({ titulo: (b?.titulo ?? '').trim(), link: (b?.link ?? '').trim() || undefined }))
    : []
  const botoesFinal =
    botoes.length > 0
      ? botoes.map((b) => ({ ...b, link: b.link ? applyReplacements(b.link, { nome, dashboardUrl: PLEN_DASHBOARD_URL, ...vars }) : b.link }))
      : botoes
  if (botoes.length > 0) {
    const result = await sendWhatsAppMessageWithButtons(contactId, msg, botoesFinal)
    if (!result.success) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[chatbot-flow-runner] envio com botões falhou, enviando só texto:', result.error)
      } else {
        console.warn('[chatbot-flow-runner] envio com botões falhou:', result.error)
      }
      await enqueuePlenMessage(contactId, msg)
    }
  } else {
    await enqueuePlenMessage(contactId, msg)
  }
  const comandos = config?.comandosAoEnviar
  const urls = Array.isArray(comandos)
    ? (comandos as string[]).map((s) => (s || '').trim()).filter((s) => s.startsWith('http'))
    : []
  for (const url of urls) {
    fetch(url, { method: 'GET' }).catch(() => {})
  }
  const targets = getOutgoingTargets(flow, nodeId)
  return { sent: true, nextNodeId: targets[0] ?? null }
}

const MENU_BUTTON_LABEL_MAX = 20

function formatCurrencyBRL(v: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  } catch {
    return `R$${v.toFixed(2)}`
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/** Semana/mês/ano em UTC para bater com data_registro (guardado em ISO/UTC). Evita fuso excluir registros. */
function getPeriodoFromText(textLower: string): { label: string; start?: Date; end?: Date } {
  const now = new Date()
  const t = (textLower || '').trim()
  const wantsYear = /\bano\b|\banu(al)?\b/.test(t)
  const wantsMonth = /\bm[eê]s\b|\bmensal\b/.test(t)
  const wantsWeek = /\bsemana\b|\bsemanal\b/.test(t)
  const wantsTotal = /\btotal\b|\btudo\b|\bdesde\b/.test(t)

  if (wantsTotal) return { label: 'total', start: undefined, end: undefined }
  // Usar UTC para limites: data_registro no DB é timestamptz (UTC)
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()
  const dayOfWeek = now.getUTCDay() // 0 dom ... 6 sáb
  const diffToMonday = (dayOfWeek + 6) % 7
  if (wantsYear) {
    const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999))
    return { label: 'ano', start, end }
  }
  if (wantsMonth) {
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0))
    const lastDay = new Date(Date.UTC(y, m + 1, 0))
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999))
    return { label: 'mês', start, end }
  }
  if (wantsWeek) {
    const msPerDay = 24 * 60 * 60 * 1000
    const todayUtc = Date.UTC(y, m, d)
    const mondayUtc = new Date(todayUtc - diffToMonday * msPerDay)
    const start = new Date(mondayUtc.getTime())
    start.setUTCHours(0, 0, 0, 0)
    const sundayUtc = new Date(start.getTime() + 6 * msPerDay)
    const end = new Date(sundayUtc.getTime())
    end.setUTCHours(23, 59, 59, 999)
    return { label: 'semana', start, end }
  }
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999))
  return { label: 'mês', start, end }
}

/**
 * Identifica o dono da conta (profile id) a partir do contato CRM.
 * Prioridade: TELEFONE primeiro (canal WhatsApp = dono do número), depois email.
 * Assim insert de gasto e relatório usam sempre o mesmo dono.
 */
async function getAccountOwnerIdFromContact(contact: { email?: string | null; telefone?: string | null } | null): Promise<string | null> {
  const admin = createAdminClient()
  if (!admin || !contact) return null
  const emailNorm = (contact.email ?? '').trim().toLowerCase()
  const phoneRaw = (contact.telefone ?? '').replace(/\D/g, '').trim()

  // 1) Por telefone primeiro (mensagem veio do WhatsApp → dono é quem tem esse número)
  if (phoneRaw.length >= 8) {
    const { data: byPhone } = await admin
      .from('profiles')
      .select('id')
      .or(`telefone.eq.${phoneRaw},whatsapp.eq.${phoneRaw}`)
      .limit(1)
      .maybeSingle()
    if (byPhone?.id) return String(byPhone.id)
    if (phoneRaw.length >= 10) {
      const sem55 = phoneRaw.startsWith('55') ? phoneRaw.slice(2) : phoneRaw
      const com55 = phoneRaw.startsWith('55') ? phoneRaw : `55${phoneRaw}`
      const { data: byPhone2 } = await admin
        .from('profiles')
        .select('id')
        .or(`telefone.eq.${sem55},whatsapp.eq.${sem55},telefone.eq.${com55},whatsapp.eq.${com55}`)
        .limit(1)
        .maybeSingle()
      if (byPhone2?.id) return String(byPhone2.id)
    }
  }

  // 2) Por email (Auth como fonte da verdade)
  if (emailNorm && emailNorm.includes('@')) {
    try {
      const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const user = usersData?.users?.find((u) => (u.email ?? '').toLowerCase() === emailNorm)
      if (user?.id) return String(user.id)
    } catch {
      // fallback para profiles
    }
    const { data } = await admin.from('profiles').select('id').eq('email', emailNorm).limit(1).maybeSingle()
    if (data?.id) return String(data.id)
  }

  return null
}

/** Retorna o account owner id apenas por email (para fallback quando o dono por telefone tem 0 registros). */
async function getAccountOwnerIdByEmailOnly(email: string | null | undefined): Promise<string | null> {
  const admin = createAdminClient()
  if (!admin) return null
  const emailNorm = (email ?? '').trim().toLowerCase()
  if (!emailNorm || !emailNorm.includes('@')) return null
  try {
    const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const user = usersData?.users?.find((u) => (u.email ?? '').toLowerCase() === emailNorm)
    if (user?.id) return String(user.id)
  } catch {
    // fallback para profiles
  }
  const { data } = await admin.from('profiles').select('id').eq('email', emailNorm).limit(1).maybeSingle()
  return data?.id ? String(data.id) : null
}

async function getUserIdsForAccountOwner(accountOwnerId: string): Promise<string[]> {
  const admin = createAdminClient()
  if (!admin) return []
  const { data, error } = await admin.from('users').select('id').eq('account_owner_id', accountOwnerId)
  if (error || !Array.isArray(data)) return []
  let userIds = data.map((r: any) => String(r.id)).filter(Boolean)
  if (userIds.length === 0) {
    const { data: profile } = await admin.from('profiles').select('nome').eq('id', accountOwnerId).maybeSingle()
    const nome = (profile as { nome?: string } | null)?.nome?.trim() || 'Meus registros'
    const { data: novo, error: errInsert } = await admin
      .from('users')
      .insert({ nome, account_owner_id: accountOwnerId })
      .select('id')
      .single()
    if (!errInsert && (novo as { id?: string })?.id) {
      userIds = [String((novo as { id: string }).id)]
    }
  }
  return userIds
}

/**
 * Insere um gasto ou receita na tabela registros quando o usuário envia pelo WhatsApp.
 * Assim o relatório/saldo mostra os valores reais da conta.
 */
async function inserirRegistroPlenWhatsApp(
  contact: { email?: string | null; telefone?: string | null } | null,
  expense: { valor: number; intent: 'registrar_despesa' | 'registrar_receita'; categoria?: string | null; descricao?: string | null }
): Promise<boolean> {
  const admin = createAdminClient()
  if (!admin || !contact) {
    console.warn('[plen/registro] Insert skip: admin ou contact ausente')
    return false
  }
  const ownerId = await getAccountOwnerIdFromContact(contact)
  if (!ownerId) {
    console.warn('[plen/registro] Insert skip: perfil não encontrado para email/telefone do contato')
    return false
  }
  const userIds = await getUserIdsForAccountOwner(ownerId)
  const userId = userIds[0]
  if (!userId) {
    console.warn('[plen/registro] Insert skip: nenhum user_id na conta do perfil')
    return false
  }

  const tipo = expense.intent === 'registrar_receita' ? 'entrada' : 'saida'
  const nomeRegistro = extrairNomeRegistroCurto(
    expense.descricao || (expense.intent === 'registrar_receita' ? 'Entrada' : 'Gasto'),
    expense.intent
  )
  const categoria = expense.categoria === 'Pessoas' ? 'Pessoa' : (expense.categoria ?? 'Outros')
  const dataRegistro = new Date().toISOString()

  const { error } = await admin.from('registros').insert({
    user_id: userId,
    nome: nomeRegistro,
    tipo,
    valor: expense.valor,
    data_registro: dataRegistro,
    categoria: categoria || null,
    parcelas_totais: 1,
    parcelas_pagas: 0,
    etiquetas: [],
  })

  if (error) {
    console.warn('[plen/registro] Erro ao inserir registro no WhatsApp:', error.message, error.code)
    return false
  }
  return true
}

async function getResumoFinanceiro(
  accountOwnerId: string,
  periodo: { label: string; start?: Date; end?: Date }
): Promise<{ entradas: number; saidas: number; saldo: number } | null> {
  const admin = createAdminClient()
  if (!admin) return null
  const userIds = await getUserIdsForAccountOwner(accountOwnerId)
  if (userIds.length === 0) return null

  let q = admin.from('registros').select('tipo, valor, data_registro').in('user_id', userIds)
  if (periodo.start) q = q.gte('data_registro', periodo.start.toISOString())
  if (periodo.end) q = q.lte('data_registro', periodo.end.toISOString())

  const { data, error } = await q
  if (error || !Array.isArray(data)) return null

  if (process.env.NODE_ENV === 'development' || (data.length === 0 && (process.env.LOG_PLEN_RESUMO === '1'))) {
    console.log('[plen/resumo]', { accountOwnerId, userIdsCount: userIds.length, periodo: periodo.label, registrosCount: data.length })
  }

  let entradas = 0
  let saidas = 0
  for (const r of data as any[]) {
    const tipo = String(r.tipo ?? '')
    const valor = Number(r.valor ?? 0)
    if (!Number.isFinite(valor)) continue
    if (tipo === 'entrada') entradas += valor
    else if (tipo === 'saida') saidas += valor
  }
  return { entradas, saidas, saldo: entradas - saidas }
}

async function enviarMensagemSaldoRelatorio(
  contactId: string,
  nome: string,
  contact: { email?: string | null; telefone?: string | null } | null,
  textLower: string,
  dashboardUrl: string
): Promise<boolean> {
  // Reconhece pedidos de saldo, relatório, gastos ou despesas (ex.: "me mostre meus gastos dessa semana")
  const wantsSaldoOrReport =
    /\bsaldo\b|\bquanto\s+eu\s+tenho\b|\bquanto\s+tenho\b|\bmeu\s+saldo\b|\bsaldo\s+total\b|\brelat[oó]rio\b|\brelatorio\b|\bresumo\b|\bgastos\b|\bmeus\s+gastos\b|\bminhas\s+despesas\b|\bdespesas\b|\bmostre\s+(meus\s+)?gastos\b|\bmostre\s+(minhas\s+)?despesas\b|\bver\s+gastos\b|\bver\s+despesas\b/.test(
      textLower
    )
  if (!wantsSaldoOrReport) return false

  const periodo = getPeriodoFromText(textLower)
  const ownerId = await getAccountOwnerIdFromContact(contact)
  if (process.env.NODE_ENV === 'development' || process.env.LOG_PLEN_RESUMO === '1') {
    console.log('[plen/resumo] contact', {
      telefone: contact?.telefone ?? '(vazio)',
      email: contact?.email ? `${(contact.email as string).slice(0, 3)}***` : '(vazio)',
      ownerId: ownerId ?? '(não encontrado)',
    })
  }
  if (!ownerId) {
    const msg = applyReplacements(
      `📊 Total / saldo

💰 Resumo do seu dinheiro

Você pode pedir assim:
- meu saldo total
- quanto eu tenho
- relatório dessa semana
- relatório do mês
- relatório do ano

Se você quer ver mais detalhes acesse o painel completo.
Ver no painel: {dashboardUrl}`,
      { nome, dashboardUrl }
    )
    await enqueuePlenMessage(contactId, msg, new Date(), [{ titulo: 'Ver no painel', link: dashboardUrl }])
    return true
  }

  let resumo = await getResumoFinanceiro(ownerId, periodo)
  if (!resumo) {
    const msg = applyReplacements(
      `📊 Total / saldo

Não consegui carregar seu resumo agora, {nome}.

Se você quer ver mais detalhes acesse o painel completo.
Ver no painel: {dashboardUrl}`,
      { nome, dashboardUrl }
    )
    await enqueuePlenMessage(contactId, msg, new Date(), [{ titulo: 'Ver no painel', link: dashboardUrl }])
    return true
  }

  // Fallback 1: se o dono (por telefone) tem 0 registros e o contato tem email, tentar dono por email (cadastro antigo)
  let effectiveOwnerId = ownerId
  const resumoZerado = resumo.entradas === 0 && resumo.saidas === 0
  if (resumoZerado && (contact?.email ?? '').trim().includes('@')) {
    const ownerByEmail = await getAccountOwnerIdByEmailOnly(contact!.email)
    if (ownerByEmail && ownerByEmail !== ownerId) {
      const resumoEmail = await getResumoFinanceiro(ownerByEmail, periodo)
      if (resumoEmail && (resumoEmail.entradas !== 0 || resumoEmail.saidas !== 0)) {
        resumo = resumoEmail
        effectiveOwnerId = ownerByEmail
      }
    }
  }

  // Fallback 2: se ainda zerado e o pedido foi por período (semana/mês/ano), buscar saldo TOTAL — pode haver registros fora do período ou fuso
  let linhaSaldoTotal = ''
  if (resumo.entradas === 0 && resumo.saidas === 0 && periodo.start != null) {
    const periodoTotal = { label: 'total', start: undefined as Date | undefined, end: undefined as Date | undefined }
    const resumoTotal = await getResumoFinanceiro(effectiveOwnerId, periodoTotal)
    if (resumoTotal && (resumoTotal.entradas !== 0 || resumoTotal.saidas !== 0)) {
      linhaSaldoTotal = `\n\n📊 Seu saldo total no painel: ${formatCurrencyBRL(resumoTotal.saldo)}\n(No ${periodo.label} não há movimentação; use o painel para ver todos os registros.)`
    }
  }

  const tituloPeriodo = periodo.label === 'total' ? 'Saldo total' : `Relatório da ${periodo.label}`
  const msg = applyReplacements(
    `📊 ${tituloPeriodo}

📥 Total recebido: ${formatCurrencyBRL(resumo.entradas)}
📤 Total de gastos: ${formatCurrencyBRL(resumo.saidas)}
💰 Seu saldo: ${formatCurrencyBRL(resumo.saldo)}${linhaSaldoTotal}

Você também pode pedir assim:
- meu saldo total
- quanto eu tenho
- relatório dessa semana
- relatório do mês
- relatório do ano

Se você quer ver mais detalhes acesse o painel completo.`,
    { nome, dashboardUrl }
  )
  await enqueuePlenMessage(contactId, msg, new Date(), [{ titulo: 'Ver no painel', link: dashboardUrl }])
  return true
}

/** Envia menu em uma (ou duas) bolhas: texto no topo + botões empilhados. Retorna targets e as labels como enviadas (20 chars) para o estado. */
async function sendMenuAsButtonsAndGetTargets(
  flow: ChatbotFlowRow,
  nodeId: string,
  contactId: string,
  nome: string
): Promise<{ sent: boolean; targets: string[]; sentLabels: string[] }> {
  const node = getNodeById(flow, nodeId)
  if (!node) return { sent: false, targets: [], sentLabels: [] }
  const config = node.data?.config as Record<string, unknown> | undefined
  const customIntro = (config?.menuIntro as string)?.trim()
  const opcoesStr = (config?.menuOpcoes as string)?.trim() || ''
  const linhas = opcoesStr.split('\n').map((s) => s.trim()).filter(Boolean)
  const targets = getOutgoingTargets(flow, nodeId)
  const introPadrao =
    'Olá, {nome}! 💙 Selecione abaixo como posso te ajudar: atendimento humanizado, dúvidas sobre a Plen, planos, recursos premium ou consulta de saldo.'
  const introMsg = applyReplacements(customIntro || introPadrao, { nome })
  const labels = linhas.map((l) => l.replace(/^\d+\s*/, '').trim()).filter(Boolean)
  const sentLabels = labels.map((l) => l.trim().slice(0, MENU_BUTTON_LABEL_MAX))
  let result = await sendWhatsAppMenuButtons(contactId, introMsg, labels)
  if (!result.success && labels.length > 0) {
    const textoOpcoes = labels.map((l, i) => `${i + 1}. ${l}`).join('\n')
    const fallback = `${introMsg}\n\n${textoOpcoes}\n\nDigite o número ou o nome da opção.`
    result = await sendWhatsAppMessageWithResult(contactId, fallback)
  }
  return { sent: result.success, targets, sentLabels }
}

/** Avalia condição do bloco (mensagem_contem, mensagem_igual, eh_numero, tem_valor). */
function evaluateCondition(
  config: Record<string, unknown> | undefined,
  messageText: string
): boolean {
  const campo = (config?.condicaoCampo as string) || 'mensagem_contem'
  const valor = String(config?.condicaoValor ?? '').trim().toLowerCase()
  const text = (messageText || '').trim().toLowerCase()
  if (campo === 'mensagem_contem') return valor ? text.includes(valor) : false
  if (campo === 'mensagem_igual') return text === valor
  if (campo === 'eh_numero') return /^\d+([.,]\d+)?$/.test(messageText.trim().replace(',', '.'))
  // Parece gasto ou receita: tem pelo menos um dígito (ex.: "cafe 67", "cafe67", "almoço 30", "recebi 2000")
  if (campo === 'tem_valor') return /\d/.test(messageText.trim())
  return false
}

/** Responde à mensagem como se fosse clique em opção do 1º menu do fluxo (fallback quando não há estado). Match pelo label do nó de destino. */
async function tryRespondAsMenuOption(
  flow: ChatbotFlowRow,
  contactId: string,
  nome: string,
  messageText: string
): Promise<boolean> {
  const menuNodeId = getFirstMenuNodeId(flow)
  if (!menuNodeId) return false
  const targets = getOutgoingTargets(flow, menuNodeId)
  if (!targets.length) return false
  const targetId = getMenuTargetByMessage(flow, menuNodeId, messageText)
  if (process.env.NODE_ENV === 'development') {
    console.log('[plen/menu] tryRespondAsMenuOption', {
      messageText: messageText?.slice(0, 40),
      targetId: targetId ?? null,
    })
  }
  if (!targetId) return false
  const targetNode = getNodeById(flow, targetId)
  if (targetNode?.data?.nodeType === 'mensagem') {
    const cfg = targetNode.data?.config as Record<string, unknown> | undefined
    let texto = (cfg?.texto as string)?.trim() || ''
    const t = (messageText || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const isPlanoBasico = /\b(9[,.]90|r\s*\$?\s*9\b)/.test(t) && !/49/.test(t)
    const textoParecePremium = /49[,.]90|r\s*\$?\s*49/.test(texto)
    if (isPlanoBasico && textoParecePremium) {
      texto = MSG_PLANO_BASICO_9_90
    }
    if (texto) {
      const msg = applyReplacements(texto, { nome, dashboardUrl: PLEN_DASHBOARD_URL })
      let botoesRaw = cfg?.botoes as Array<{ titulo?: string; link?: string }> | undefined
      if (isPlanoBasico && textoParecePremium) {
        botoesRaw = BOTOES_PLANO_BASICO
      }
      const botoes = Array.isArray(botoesRaw)
        ? botoesRaw
            .filter((b) => (b?.titulo ?? '').trim().length > 0)
            .map((b) => ({ titulo: (b?.titulo ?? '').trim(), link: (b?.link ?? '').trim() || undefined }))
        : []
      const botoesFinal =
        botoes.length > 0 ? botoes.map((b) => ({ ...b, link: b.link ? applyReplacements(b.link, { nome, dashboardUrl: PLEN_DASHBOARD_URL }) : b.link })) : []
      if (botoesFinal.length > 0) {
        const sentBtns = await sendWhatsAppMessageWithButtons(contactId, msg, botoesFinal)
        if (!sentBtns.success) await enqueuePlenMessage(contactId, msg, new Date(), botoesFinal)
      } else {
        const sent = (await sendWhatsAppMessageWithResult(contactId, msg)).success
        if (!sent) await enqueuePlenMessage(contactId, msg)
      }
    } else {
      await enqueuePlenMessage(contactId, applyReplacements('Opção em configuração.', { nome }))
    }
    const nextNodeId = getOutgoingTargets(flow, targetId)[0] ?? null
    await setChatbotFlowState(contactId, flow.id, nextNodeId ?? targetId)
    const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
    await processPlenQueue(5).catch(() => {})
    return true
  }
  if (targetNode?.data?.nodeType === 'delay') {
    const dconfig = targetNode.data?.config as Record<string, unknown> | undefined
    const min = Number(dconfig?.delayMin ?? 0) * 1000
    const max = Math.max(Number(dconfig?.delayMax ?? 5) * 1000, min)
    const delayMs = min + Math.random() * (max - min || 0)
    const afterDelayId = getOutgoingTargets(flow, targetId)[0]
    if (afterDelayId) {
      const afterNode = getNodeById(flow, afterDelayId)
      if (afterNode?.data?.nodeType === 'mensagem') {
        const rawCfg = (afterNode.data?.config ?? afterNode.data) as Record<string, unknown> | undefined
        const cfg = rawCfg && typeof rawCfg === 'object' ? rawCfg : undefined
        const texto = (cfg?.texto as string)?.trim() || ''
        if (texto) {
          const msg = applyReplacements(texto, { nome, dashboardUrl: PLEN_DASHBOARD_URL })
          let br = cfg?.botoes as Array<{ titulo?: string; link?: string }> | undefined
          let botoes = Array.isArray(br) ? br.filter((b) => (b?.titulo ?? '').trim().length > 0).map((b) => ({ titulo: (b?.titulo ?? '').trim(), link: (b?.link ?? '').trim() || undefined })) : []
          const label = String(afterNode?.data?.label ?? '')
          if (botoes.length === 0 && /falar com humano|suporte|atendente|clique abaixo/i.test(label)) botoes = [{ titulo: 'Chamar atendente', link: undefined }]
          if (botoes.length > 0) {
            botoes = botoes.map((b) => ({ ...b, link: b.link ? applyReplacements(b.link, { nome, dashboardUrl: PLEN_DASHBOARD_URL }) : b.link }))
          }
          await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs), botoes.length > 0 ? botoes : undefined)
        }
      }
      await setChatbotFlowState(contactId, flow.id, getOutgoingTargets(flow, afterDelayId)[0] ?? afterDelayId)
    } else {
      await setChatbotFlowState(contactId, flow.id, targetId)
    }
    const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
    await processPlenQueue(5).catch(() => {})
    return true
  }
  await setChatbotFlowState(contactId, flow.id, targetId)
  return true
}

/** Normaliza texto para comparação (espaços, barras). */
function normalizeForMenuMatch(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[/\u2013\u2014]/g, '/')
    .trim()
}

/** Opções de menu comuns — usadas como fallback quando o fluxo não responde ao clique. */
const KNOWN_MENU_OPTIONS = [
  'falar com humano',
  'como funciona',
  'assinatura r$9,90',
  'assinatura r$9.90',
  'funções premium',
  'indique e ganhe',
  'total / saldo',
]

function isKnownMenuOption(messageText: string): boolean {
  const t = normalizeForMenuMatch(messageText)
  if (!t) return false
  return KNOWN_MENU_OPTIONS.some((opt) => t === opt || t.includes(opt) || opt.includes(t))
}

function getMenuOptionFallbackMessage(messageText: string, nome: string): string {
  const opcao = (messageText || '').trim() || 'sua escolha'
  return `Olá, ${nome}! Recebemos sua escolha (${opcao}). Em instantes te enviamos as informações. Se precisar de mais algo, digite MENU. 💙`
}

/** Índice da opção do menu (1, 2, 3... ou texto do botão; aceita label truncado pela Z-API em 20 chars). */
function matchMenuOption(messageText: string, options: string[]): number {
  const t = normalizeForMenuMatch(messageText)
  if (!t) return -1
  const n = parseInt(t, 10)
  if (!Number.isNaN(n) && n >= 1 && n <= options.length) return n - 1
  for (let i = 0; i < options.length; i++) {
    const raw = normalizeForMenuMatch(options[i] || '')
    const optSemNumero = raw.replace(/^\d+\s*/, '')
    if (!optSemNumero) continue
    if (t === optSemNumero || t === raw) return i
    if (t.includes(optSemNumero) || optSemNumero.includes(t)) return i
    if (raw && t.includes(raw)) return i
  }
  return -1
}

type AdvanceResult = { replied: boolean; nextNodeId: string | null; newContext?: Record<string, unknown> }

/** Avançar do nó atual: executa o próximo nó (Mensagem, Menu, Delay, Condição, etc.). */
async function advanceFromNode(
  flow: ChatbotFlowRow,
  currentId: string,
  contactId: string,
  nome: string,
  messageText: string
): Promise<AdvanceResult> {
  const node = getNodeById(flow, currentId)
  if (!node) return { replied: false, nextNodeId: null }
  const nodeType = node.data?.nodeType
  let effectiveNome = nome
  if (nodeType === 'mensagem') {
    const label = String(node.data?.label ?? '').toLowerCase()
    const id = String(currentId ?? '')
    if (id.includes('pedir-nome') || label.includes('pedir nome')) {
      const newNome = messageText.trim()
      if (newNome.length >= 2) {
        await updateContact(contactId, { nome: newNome })
        effectiveNome = newNome
      }
    }
  }

  const targets = getOutgoingTargets(flow, currentId)
  const nextId = targets[0]
  if (!nextId && nodeType !== 'mensagem' && nodeType !== 'inicio') return { replied: false, nextNodeId: null }

  if (nodeType === 'mensagem') {
    if (!nextId) return { replied: false, nextNodeId: null }
    const nextNode = getNodeById(flow, nextId)
    const nextType = nextNode?.data?.nodeType
    if (nextType === 'menu') {
      const isContaConfirmada =
        (String(currentId).includes('conta-confirmada') || String(node.data?.label ?? '').toLowerCase().includes('conta confirmada'))
      if (isContaConfirmada && messageText.trim().toLowerCase() !== 'menu') {
        await enqueuePlenMessage(contactId, applyReplacements('Digite MENU para acessar as opções.', { nome: effectiveNome }), new Date())
        const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
        await processPlenQueue(2).catch(() => {})
        return { replied: true, nextNodeId: currentId }
      }
      const { sent, targets: menuTargets, sentLabels } = await sendMenuAsButtonsAndGetTargets(flow, nextId, contactId, effectiveNome)
      return {
        replied: sent,
        nextNodeId: nextId,
        newContext: { waitingMenu: true, menuOptions: sentLabels, menuTargets },
      }
    }
    if (nextType === 'delay') {
      const delayTargets = getOutgoingTargets(flow, nextId)
      const afterDelayId = delayTargets[0]
      const delayNode = getNodeById(flow, nextId)
      const dconfig = delayNode?.data?.config as Record<string, unknown> | undefined
      const min = Number(dconfig?.delayMin ?? 0) * 1000
      const max = Math.max(Number(dconfig?.delayMax ?? 5) * 1000, min)
      const delayMs = min + Math.random() * (max - min || 0)
      if (afterDelayId) {
        const afterNode = getNodeById(flow, afterDelayId)
        if (afterNode?.data?.nodeType === 'mensagem') {
          const rawCfg = (afterNode.data?.config ?? afterNode.data) as Record<string, unknown> | undefined
          const cfg = rawCfg && typeof rawCfg === 'object' ? rawCfg : undefined
          const texto = (cfg?.texto as string)?.trim() || ''
          if (texto) {
            const msg = applyReplacements(texto, { nome: effectiveNome })
            let br = cfg?.botoes as Array<{ titulo?: string; link?: string }> | undefined
            let botoes = Array.isArray(br) ? br.filter((b) => (b?.titulo ?? '').trim().length > 0).map((b) => ({ titulo: (b?.titulo ?? '').trim(), link: (b?.link ?? '').trim() || undefined })) : []
            const label = String(afterNode?.data?.label ?? '')
            if (botoes.length === 0 && /falar com humano|suporte|atendente|clique abaixo/i.test(label)) botoes = [{ titulo: 'Chamar atendente', link: undefined }]
            await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs), botoes.length > 0 ? botoes : undefined)
          }
          const afterTargets = getOutgoingTargets(flow, afterDelayId)
          return { replied: false, nextNodeId: afterTargets[0] ?? afterDelayId }
        }
      }
      return { replied: false, nextNodeId: afterDelayId ?? nextId }
    }
    if (nextType === 'condicao') {
      const condNode = getNodeById(flow, nextId)
      const condConfig = condNode?.data?.config as Record<string, unknown> | undefined
      const ok = evaluateCondition(condConfig, messageText)
      const { sim, nao } = getConditionTargets(flow, nextId)
      const chosen = ok ? sim : nao
      if (chosen) {
        const chosenNode = getNodeById(flow, chosen)
        const condValor = String(condConfig?.condicaoValor ?? '').trim()
        const msgPareceEmail = /^.+\@.+\..+$/.test((messageText || '').trim()) || (messageText || '').trim().includes('@')
        const isEmailValidBranch =
          (condValor.includes('@') || msgPareceEmail) && chosenNode?.data?.nodeType === 'mensagem'
        if (isEmailValidBranch) {
          const email = messageText.trim().toLowerCase()
          if (email && email.includes('@')) {
            const result = await createUserAndSendCode(email, effectiveNome)
            if (!result.success) {
              console.warn('[chatbot-flow-runner] createUserAndSendCode falhou:', result.error)
              await updateContact(contactId, { email })
              const msgErro =
                result.error && !/smtp|host|porta|587|465|conexão|conexao|connection|timeout|etimedout|eauth|verifique/i.test(result.error)
                  ? result.error
                  : 'Não foi possível enviar o código agora. Tente novamente em alguns minutos ou verifique o email. 💙'
              await enqueuePlenMessage(contactId, msgErro, new Date())
              const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
              await processPlenQueue(2).catch(() => {})
              return { replied: true, nextNodeId: currentId }
            }
            await updateContact(contactId, { email, status: 'aguardando_codigo' })
            if (result.alreadyRegisteredNotConfirmed) {
              const msg =
                'Esse email já está cadastrado mas não foi confirmado. Acabei de reenviar o código para confirmar. Me diga o código aqui.'
              const fullText = msg + '\n\nSe o email não chegar, clique no botão abaixo para reenviar.'
              const sent = await sendWhatsAppButtonReply(contactId, fullText, 'REENVIAR CÓDIGO')
              const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
              await processPlenQueue(3).catch(() => {})
              return { replied: sent.success, nextNodeId: chosen }
            }
          }
        }
        if (chosenNode?.data?.nodeType === 'mensagem') {
          const isPedirCodigo =
            (String(chosen).includes('pedir-codigo') || String(chosenNode?.data?.label ?? '').toLowerCase().includes('pedir código')) &&
            isEmailValidBranch
          if (isPedirCodigo) {
            const cfg = chosenNode.data?.config as Record<string, unknown> | undefined
            const texto = applyReplacements((cfg?.texto as string)?.trim() || '', { nome: effectiveNome })
            const fullText = texto + '\n\nSe o email não chegar, clique no botão abaixo para reenviar.'
            const sent = await sendWhatsAppButtonReply(contactId, fullText, 'REENVIAR CÓDIGO')
            return { replied: sent.success, nextNodeId: chosen }
          }
          const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, chosen, contactId, effectiveNome)
          return { replied: sent, nextNodeId: nextNodeId ?? chosen }
        }
        return { replied: false, nextNodeId: chosen }
      }
      return { replied: false, nextNodeId: nao ?? sim }
    }
    if (nextType === 'mensagem') {
      const isResultadoTeste =
        (String(currentId).includes('resultado') || String(node.data?.label ?? '').toLowerCase().includes('resultado')) &&
        (String(nextId).includes('copy-cadastro') || String(nextNode?.data?.label ?? '').toLowerCase().includes('copy cadastro'))
      if (isResultadoTeste) {
        const { sent: sent1 } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, effectiveNome)
        const nextOfCopy = getOutgoingTargets(flow, nextId)[0]
        const nodePedirNome = nextOfCopy ? getNodeById(flow, nextOfCopy) : null
        if (nodePedirNome?.data?.nodeType === 'mensagem') {
          const { sent: sent2 } = await sendMessageNodeAndReturnNext(flow, nextOfCopy!, contactId, effectiveNome)
          return { replied: sent1 || sent2, nextNodeId: nextOfCopy }
        }
        return { replied: sent1, nextNodeId: nextOfCopy ?? nextId }
      }
      const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, effectiveNome)
      return { replied: sent, nextNodeId: nextNodeId ?? nextId }
    }
    if (nextType === 'ia') {
      const iaConfig = nextNode?.data?.config as Record<string, unknown> | undefined
      const iaPrompt = (iaConfig?.iaPrompt as string)?.trim() || ''
      const reply = await getPlenLLMResponse({
        userMessage: messageText,
        context: iaPrompt || undefined,
      })
      if (reply) await enqueuePlenMessage(contactId, reply)
      const iaTargets = getOutgoingTargets(flow, nextId)
      return { replied: !!reply, nextNodeId: iaTargets[0] ?? nextId }
    }
    if (nextType === 'fim') return { replied: false, nextNodeId: null }
    return { replied: false, nextNodeId: nextId }
  }

  if (nodeType === 'inicio') {
    if (!nextId) return { replied: false, nextNodeId: null }
    const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, effectiveNome)
    return { replied: sent, nextNodeId: nextNodeId ?? nextId }
  }

  // Nó atual é Condição: avaliar com a mensagem do usuário e seguir ramo sim/não
  if (nodeType === 'condicao') {
    const condConfig = node.data?.config as Record<string, unknown> | undefined
    const ok = evaluateCondition(condConfig, messageText)
    const { sim, nao } = getConditionTargets(flow, currentId)
    const chosen = ok ? sim : nao
    if (!chosen) return { replied: false, nextNodeId: nao ?? sim }
    const chosenNode = getNodeById(flow, chosen)
    const condValor = String(condConfig?.condicaoValor ?? '').trim()
    const msgPareceEmail = /^.+\@.+\..+$/.test((messageText || '').trim()) || (messageText || '').trim().includes('@')
    const isEmailValidBranch =
      (condValor.includes('@') || msgPareceEmail) && chosenNode?.data?.nodeType === 'mensagem'
    if (isEmailValidBranch) {
      const email = messageText.trim().toLowerCase()
      if (email && email.includes('@')) {
        const result = await createUserAndSendCode(email, effectiveNome)
        if (!result.success) {
          console.warn('[chatbot-flow-runner] createUserAndSendCode (nó condição) falhou:', result.error)
          await updateContact(contactId, { email })
          const msgErro =
            result.error && !/smtp|host|porta|587|465|conexão|conexao|connection|timeout|etimedout|eauth|verifique/i.test(result.error)
              ? result.error
              : 'Não foi possível enviar o código agora. Tente novamente em alguns minutos ou verifique o email. 💙'
          await enqueuePlenMessage(contactId, msgErro, new Date())
          const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
          await processPlenQueue(2).catch(() => {})
          return { replied: true, nextNodeId: currentId }
        }
        await updateContact(contactId, { email, status: 'aguardando_codigo' })
        if (result.alreadyRegisteredNotConfirmed) {
          const msg =
            'Esse email já está cadastrado mas não foi confirmado. Acabei de reenviar o código para confirmar. Me diga o código aqui.'
          const fullText = msg + '\n\nSe o email não chegar, clique no botão abaixo para reenviar.'
          const sent = await sendWhatsAppButtonReply(contactId, fullText, 'REENVIAR CÓDIGO')
          const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
          await processPlenQueue(3).catch(() => {})
          return { replied: sent.success, nextNodeId: chosen }
        }
      }
    }
    if (chosenNode?.data?.nodeType === 'mensagem') {
      const isPedirCodigo =
        (String(chosen).includes('pedir-codigo') || String(chosenNode?.data?.label ?? '').toLowerCase().includes('pedir código')) &&
        isEmailValidBranch
      if (isPedirCodigo) {
        const cfg = chosenNode.data?.config as Record<string, unknown> | undefined
        const texto = applyReplacements((cfg?.texto as string)?.trim() || '', { nome: effectiveNome })
        const fullText = texto + '\n\nSe o email não chegar, clique no botão abaixo para reenviar.'
        const sent = await sendWhatsAppButtonReply(contactId, fullText, 'REENVIAR CÓDIGO')
        return { replied: sent.success, nextNodeId: chosen }
      }
      const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, chosen, contactId, effectiveNome)
      return { replied: sent, nextNodeId: nextNodeId ?? chosen }
    }
    if (chosenNode?.data?.nodeType === 'registrar_gasto' || chosenNode?.data?.nodeType === 'registrar_receita') {
      const regTargets = getOutgoingTargets(flow, chosen)
      const firstId = regTargets[0]
      if (!firstId) return { replied: true, nextNodeId: chosen }
      const { valor, categoria } = parseGastoOuReceita(messageText)
      const firstNode = getNodeById(flow, firstId)
      if (firstNode?.data?.nodeType !== 'mensagem') return { replied: false, nextNodeId: firstId }
      const { sent: sent1 } = await sendMessageNodeAndReturnNext(flow, firstId, contactId, effectiveNome, { valor, categoria })
      const nextId = getOutgoingTargets(flow, firstId)[0]
      const nextNode = nextId ? getNodeById(flow, nextId) : null
      const nextNextId = nextId ? getOutgoingTargets(flow, nextId)[0] : null
      const nextNextNode = nextNextId ? getNodeById(flow, nextNextId) : null
      const isCopyNode = nextId && (String(nextId).includes('copy') || String(nextNode?.data?.label ?? '').toLowerCase().includes('copy'))
      let stateAposCadastro = nextId ?? firstId
      if (nextNode?.data?.nodeType === 'mensagem') {
        const cfg2 = nextNode.data?.config as Record<string, unknown> | undefined
        const texto2 = (cfg2?.texto as string)?.trim() || ''
        if (texto2) {
          const msg2 = applyReplacements(texto2, { nome: effectiveNome })
          await enqueuePlenMessage(contactId, msg2, new Date(Date.now() + 600))
        }
        stateAposCadastro = nextId
        if (isCopyNode && nextNextNode?.data?.nodeType === 'mensagem') {
          const cfg3 = nextNextNode.data?.config as Record<string, unknown> | undefined
          const texto3 = (cfg3?.texto as string)?.trim() || ''
          if (texto3) {
            const msg3 = applyReplacements(texto3, { nome: effectiveNome })
            await enqueuePlenMessage(contactId, msg3, new Date(Date.now() + 1200))
          }
          stateAposCadastro = nextNextId!
        }
      }
      return { replied: true, nextNodeId: stateAposCadastro }
    }
    return { replied: false, nextNodeId: chosen }
  }

  // Nó atual é IA: se a mensagem for "menu", enviar o menu com botões em vez de resposta da IA
  if (nodeType === 'ia') {
    const texto = (messageText || '').trim().toLowerCase()
    if (texto === 'menu') {
      const menuNodeId = getFirstMenuNodeId(flow)
      if (menuNodeId) {
        const { sent, targets: menuTargets, sentLabels } = await sendMenuAsButtonsAndGetTargets(flow, menuNodeId, contactId, nome)
        return {
          replied: sent,
          nextNodeId: menuNodeId,
          newContext: { waitingMenu: true, menuOptions: sentLabels, menuTargets },
        }
      }
    }
    const iaConfig = node.data?.config as Record<string, unknown> | undefined
    const iaPrompt = (iaConfig?.iaPrompt as string)?.trim() || ''
    const reply = await getPlenLLMResponse({
      userMessage: messageText,
      context: iaPrompt || undefined,
    })
    if (reply) await enqueuePlenMessage(contactId, reply)
    const iaTargets = getOutgoingTargets(flow, currentId)
    const nextAfterIa = iaTargets[0]
    return { replied: !!reply, nextNodeId: nextAfterIa ?? null }
  }

  // Nó atual é Delay: agendar a próxima mensagem (com botões se houver) e avançar
  if (nodeType === 'delay') {
    const dconfig = node.data?.config as Record<string, unknown> | undefined
    const min = Number(dconfig?.delayMin ?? 0) * 1000
    const max = Math.max(Number(dconfig?.delayMax ?? 5) * 1000, min)
    const delayMs = min + Math.random() * (max - min || 0)
    const afterDelayId = targets[0]
    if (afterDelayId) {
      const afterNode = getNodeById(flow, afterDelayId)
      if (afterNode?.data?.nodeType === 'mensagem') {
        const rawConfig = (afterNode.data?.config ?? afterNode.data) as Record<string, unknown> | undefined
        const cfg = rawConfig && typeof rawConfig === 'object' ? rawConfig : undefined
        const texto = (cfg?.texto as string)?.trim() || ''
        if (texto) {
          const msg = applyReplacements(texto, { nome: effectiveNome, dashboardUrl: PLEN_DASHBOARD_URL })
          let botoesRaw = cfg?.botoes as Array<{ titulo?: string; link?: string }> | undefined
          let botoes = Array.isArray(botoesRaw)
            ? botoesRaw
                .filter((b) => (b?.titulo ?? '').trim().length > 0)
                .map((b) => ({ titulo: (b?.titulo ?? '').trim(), link: (b?.link ?? '').trim() || undefined }))
            : []
          const label = String(afterNode?.data?.label ?? '')
          if (botoes.length === 0 && /falar com humano|suporte|atendente|clique abaixo/i.test(label)) {
            botoes = [{ titulo: 'Chamar atendente', link: undefined }]
          }
          if (botoes.length > 0) {
            botoes = botoes.map((b) => ({ ...b, link: b.link ? applyReplacements(b.link, { nome: effectiveNome, dashboardUrl: PLEN_DASHBOARD_URL }) : b.link }))
          }
          await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs), botoes.length > 0 ? botoes : undefined)
        }
        const afterTargets = getOutgoingTargets(flow, afterDelayId)
        return { replied: false, nextNodeId: afterTargets[0] ?? afterDelayId }
      }
      return { replied: false, nextNodeId: afterDelayId }
    }
    return { replied: false, nextNodeId: null }
  }

  if (!nextId) return { replied: false, nextNodeId: null }
  const nextNode = getNodeById(flow, nextId)
  const nextType = nextNode?.data?.nodeType
  if (nextType === 'mensagem') {
    const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, effectiveNome)
    return { replied: sent, nextNodeId: nextNodeId ?? nextId }
  }
  if (nextType === 'fim') return { replied: false, nextNodeId: null }
  return { replied: false, nextNodeId: nextId }
}

type RunChatbotFlowResult = {
  replied: boolean
  reason?: string
}

/**
 * Processa a mensagem do contato: ou inicia o fluxo (se bater no Início) ou avança no fluxo atual.
 * Única entrada de automação Plen (substitui o painel Assistente Plen).
 * @param whatsappContactName Nome do perfil do WhatsApp do contato (prioridade para {nome} nas mensagens).
 */
export async function runChatbotFlow(
  contactId: string,
  messageText: string,
  isNewLead: boolean,
  whatsappContactName?: string
): Promise<RunChatbotFlowResult> {
  const text = (messageText || '').trim()
  if (!text) return { replied: false, reason: 'empty' }

  // Plen funciona 24h: novos leads SEMPRE recebem resposta, mesmo com assistente pausada ou você fora do WhatsApp.
  const paused = await getAssistenteGlobalPausada()
  if (paused && !isNewLead) return { replied: false, reason: 'assistente_pausada' }

  const flow = await getActiveFlow()
  if (!flow) {
    // Novo lead nunca fica sem resposta: fallback mínimo (Plen 24h).
    if (isNewLead) {
      const fallback = 'Olá! 💙 Sou a Plen, assistente da Plenipay. Para começar, me envie seu nome ou digite *menu* para ver opções.'
      const sent = (await sendWhatsAppMessageWithResult(contactId, fallback)).success
      if (!sent) await enqueuePlenMessage(contactId, fallback, new Date())
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'novo_lead_sem_fluxo_fallback' }
    }
    return { replied: false, reason: 'no_active_flow' }
  }

  const contact = await getContactById(contactId)
  const nomeWhatsApp = (whatsappContactName ?? '').trim()
  const nomeCadastro = (contact?.nome ?? '').trim()
  const nome =
    nomeWhatsApp.length >= 2
      ? nomeWhatsApp
      : nomeCadastro.length >= 2
        ? nomeCadastro
        : 'amigo'

  const status = (contact?.status ?? '').toString()
  const contactEmail = (contact?.email ?? '').trim().toLowerCase()
  const textLower = text.toLowerCase()

  // Prioridade: mensagem "menu" sempre mostra o menu, em qualquer estado (exceto assistente pausada / sem fluxo).
  if (textLower === 'menu') {
    const menuNodeId = getFirstMenuNodeId(flow)
    if (menuNodeId) {
      const { sent, targets, sentLabels } = await sendMenuAsButtonsAndGetTargets(flow, menuNodeId, contactId, nome)
      await setChatbotFlowState(contactId, flow.id, menuNodeId, { waitingMenu: true, menuOptions: sentLabels, menuTargets: targets })
      return { replied: sent, reason: sent ? undefined : 'menu_envio_falhou' }
    }
    const fallbackMsg = applyReplacements(
      'Olá, {nome}! Não consegui carregar o menu agora. Tente novamente em instantes ou verifique com o suporte.',
      { nome }
    )
    const sentFallback = (await sendWhatsAppMessageWithResult(contactId, fallbackMsg)).success
    return { replied: sentFallback, reason: sentFallback ? undefined : 'menu_sem_no_e_envio_falhou' }
  }

  // "Chamar assistente plen" — sempre reconhecida: reativa se estava aguardando atendente; senão confirma que já está ativa
  const querVoltarAssistente =
    /chamar\s+assistente\s+plen|voltar\s+assistente\s+plen|ativar\s+plen|chamar\s+plen|assistente\s+plen/i.test(textLower.trim()) ||
    textLower.trim() === 'chamar assistente plen'
  if (querVoltarAssistente) {
    if (status === 'aguardando_atendente') {
      await updateContact(contactId, { status: 'usuario_ativo' })
      await enqueuePlenMessage(
        contactId,
        applyReplacements('Voltei, {nome}! 💙 Pode registrar gastos e receitas de novo. Digite MENU para ver as opções.', { nome }),
        new Date()
      )
    } else {
      await enqueuePlenMessage(
        contactId,
        applyReplacements('Eu já estou ativa, {nome}! 💙 Digite MENU para ver as opções.', { nome }),
        new Date()
      )
    }
    const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
    await processPlenQueue(3).catch(() => {})
    return { replied: true, reason: status === 'aguardando_atendente' ? 'plen_reativada' : 'plen_ja_ativa' }
  }

  // Enquanto aguardando atendente, Plen não responde (atendente humano atende)
  if (status === 'aguardando_atendente') {
    return { replied: false, reason: 'aguardando_atendente' }
  }

  // Saldo / relatórios (semana/mês/ano/total): responder direto e oferecer botão do painel
  {
    const handled = await enviarMensagemSaldoRelatorio(contactId, nome, contact, textLower, PLEN_DASHBOARD_URL)
    if (handled) {
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'saldo_relatorio' }
    }
  }

  // Clique em "Chamar atendente" ou texto equivalente: pausa Plen e envia confirmação
  const querChamarAtendente =
    /chamar\s+atendente|falar\s+com\s+(humano|atendente|suporte)|quero\s+atendente|quero\s+humano/i.test(textLower.trim()) ||
    textLower.trim() === 'chamar atendente' ||
    textLower.trim() === 'falar com humano'
  if (querChamarAtendente) {
    await updateContact(contactId, { status: 'aguardando_atendente' })
    const msgAtendente = applyReplacements(
      'Já estou chamando um humano! Se quiser voltar a registrar é só mandar "Chamar assistente plen" que eu volto! 💙',
      { nome }
    )
    await enqueuePlenMessage(contactId, msgAtendente, new Date())
    const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
    await processPlenQueue(3).catch(() => {})
    return { replied: true, reason: 'chamou_atendente' }
  }

  // Resposta "sim" / "não" ao lembrete "Você já pagou?"
  const stateLembrete = await getChatbotFlowState(contactId)
  const ctxLembrete = normalizeContext(stateLembrete?.context)
  const lembreteId = ctxLembrete.lembretePerguntaId as string | undefined
  if (lembreteId && /^(sim|s|n[aã]o|nao)$/i.test(textLower.trim())) {
    const lembrete = await getPlenLembreteById(lembreteId)
    const novoCtx = { ...ctxLembrete, lembretePerguntaId: undefined }
    await setChatbotFlowState(contactId, flow.id, stateLembrete!.current_node_id, novoCtx)
    if (lembrete) {
      const ehSim = /^s(im)?$/i.test(textLower.trim())
      if (ehSim) {
        await markPlenLembreteConcluido(lembreteId)
        await enqueuePlenMessage(
          contactId,
          'Parabéns!!! Menos uma dívida esse mês!!!!!! 💙 Continue assim!',
          new Date()
        )
      } else {
        await enqueuePlenMessage(
          contactId,
          'Poxa! Não deixe pra depois, se não vira uma bola de neve hein! 😅 Quando pagar é só me dizer aqui que eu marco como pago! 💙',
          new Date()
        )
      }
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'lembrete_resposta_sim_nao' }
    }
  }

  // Pedido de lembrete: "me lembre de pagar X dia D" — não registrar como gasto; criar lembrete ou pedir data
  if (/\b(me\s+)?lembre\s+de\b|lembrete\s+para\b/i.test(textLower)) {
    const parsed = parseLembreteMensagem(messageText)
    if (parsed.missingDate) {
      const msgInstrucoes = `📅 Para registrar um lembrete, me envie o que devo te lembrar, o valor e a data. Exemplos:

• Data fixa: *me lembre de pagar 140 da academia dia 13-09*
• Recorrente (todo mês): *me lembre de pagar 140 da academia todo dia 8*
• Com horário: *me lembre de pagar 140 da academia todo dia 8 às 9 horas*

Quando chegar no dia (e na hora, se você informou), te aviso e pergunto se já pagou! 💙`
      await enqueuePlenMessage(contactId, msgInstrucoes, new Date())
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'lembrete_sem_data' }
    }
    const id = await createPlenLembrete({
      contactId,
      tipo: 'pagar',
      descricao: parsed.descricao,
      dataLembrete: parsed.data!,
      valor: parsed.valor ?? undefined,
      horario: parsed.horario ?? undefined,
      isRecorrente: parsed.isRecorrente ?? false,
      diaRecorrente: parsed.diaRecorrente ?? undefined,
    })
    if (id) {
      const valorStr = parsed.valor != null ? ` R$ ${parsed.valor.toFixed(2)}` : ''
      const quando = parsed.isRecorrente && parsed.diaRecorrente
        ? `todo dia ${parsed.diaRecorrente}`
        : parsed.data
      const msgOk = `✅ Lembrete registrado! 💙\n\n📌 ${parsed.descricao}${valorStr}\n📅 ${quando}${parsed.horario ? ` às ${parsed.horario.slice(0, 5)}` : ''}\n\nNo dia te aviso e pergunto se já pagou!`
      await enqueuePlenMessage(contactId, msgOk, new Date())
    } else {
      await enqueuePlenMessage(contactId, 'Não consegui salvar o lembrete agora. Tente de novo ou use o painel.', new Date())
    }
    const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
    await processPlenQueue(3).catch(() => {})
    return { replied: true, reason: 'lembrete_criado' }
  }

  // Saudações (oi, olá, opa, etc.): identificar se já tem cadastro e responder de acordo
  const ehSaudacaoInicial =
    /^(oi|ol[aá]|ola|oii+|opa|e\s*a[ií]|eai|hey|fala|salve|bom\s*dia|boa\s*tarde|boa\s*noite)[\s!.]*$/i.test(textLower.trim()) ||
    textLower.trim() === 'oi' ||
    textLower.trim() === 'olá' ||
    textLower.trim() === 'ola' ||
    textLower.trim() === 'opa'
  if (ehSaudacaoInicial) {
    const jaCadastradoParaSaudacao = await isCadastradoParaSaudacao(contact)
    if (jaCadastradoParaSaudacao) {
      await enqueuePlenMessage(
        contactId,
        applyReplacements('Olá, {nome}! Olaaa, vamos registrar? 💙 Envie seu gasto ou receita, ou digite MENU para ver as opções.', { nome }),
        new Date()
      )
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'saudacao_cadastrado' }
    }
    // Lead não cadastrado: inicia o fluxo (boas-vindas + teste + cadastro) mesmo que "oi" não esteja nas frases do Início
    await clearChatbotFlowState(contactId)
    const inicio = findInicioNode(flow)
    if (inicio) {
      const firstTargets = getOutgoingTargets(flow, inicio.id)
      const firstId = firstTargets[0]
      if (firstId) {
        const firstNode = getNodeById(flow, firstId)
        const firstType = firstNode?.data?.nodeType
        if (firstType === 'mensagem') {
          const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, firstId, contactId, nome)
          await setChatbotFlowState(contactId, flow.id, nextNodeId ?? firstId)
          const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
          await processPlenQueue(3).catch(() => {})
          return { replied: sent, reason: sent ? 'saudacao_inicio_fluxo' : 'saudacao_mensagem_vazia' }
        }
        if (firstType === 'menu') {
          const { sent, targets, sentLabels } = await sendMenuAsButtonsAndGetTargets(flow, firstId, contactId, nome)
          await setChatbotFlowState(contactId, flow.id, firstId, { waitingMenu: true, menuOptions: sentLabels, menuTargets: targets })
          const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
          await processPlenQueue(3).catch(() => {})
          return { replied: sent, reason: sent ? 'saudacao_inicio_fluxo' : 'saudacao_menu_sem_opcoes' }
        }
        if (firstType === 'ia') {
          const iaConfig = firstNode?.data?.config as Record<string, unknown> | undefined
          const iaPrompt = (iaConfig?.iaPrompt as string)?.trim() || ''
          const reply = await getPlenLLMResponse({ userMessage: messageText, context: iaPrompt || undefined })
          if (reply) await enqueuePlenMessage(contactId, reply)
          const iaTargets = getOutgoingTargets(flow, firstId)
          const nextAfterIa = iaTargets[0]
          await setChatbotFlowState(contactId, flow.id, nextAfterIa ?? firstId)
          const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
          await processPlenQueue(3).catch(() => {})
          return { replied: !!reply, reason: reply ? 'saudacao_inicio_fluxo' : 'saudacao_ia_sem_resposta' }
        }
        if (firstType === 'delay') {
          const delayTargets = getOutgoingTargets(flow, firstId)
          const afterId = delayTargets[0]
          const dconfig = (firstNode?.data?.config ?? {}) as Record<string, unknown>
          const min = Number(dconfig.delayMin ?? 0) * 1000
          const max = Math.max(Number(dconfig.delayMax ?? 5) * 1000, min)
          const delayMs = min + Math.random() * (max - min || 0)
          if (afterId) {
            const afterNode = getNodeById(flow, afterId)
            if (afterNode?.data?.nodeType === 'mensagem') {
              const rawCfg = (afterNode.data?.config ?? afterNode.data) as Record<string, unknown> | undefined
              const cfg = rawCfg && typeof rawCfg === 'object' ? rawCfg : undefined
              const texto = (cfg?.texto as string)?.trim() || ''
              if (texto) {
                const msg = applyReplacements(texto, { nome })
                let br = cfg?.botoes as Array<{ titulo?: string; link?: string }> | undefined
                let botoes = Array.isArray(br) ? br.filter((b) => (b?.titulo ?? '').trim().length > 0).map((b) => ({ titulo: (b?.titulo ?? '').trim(), link: (b?.link ?? '').trim() || undefined })) : []
                const label = String(afterNode?.data?.label ?? '')
                if (botoes.length === 0 && /falar com humano|suporte|atendente|clique abaixo/i.test(label)) botoes = [{ titulo: 'Chamar atendente', link: undefined }]
                await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs), botoes.length > 0 ? botoes : undefined)
              }
            }
            await setChatbotFlowState(contactId, flow.id, afterId)
          } else {
            await setChatbotFlowState(contactId, flow.id, firstId)
          }
          const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
          await processPlenQueue(3).catch(() => {})
          return { replied: false, reason: 'saudacao_delay_agendado' }
        }
      }
    }
    // Fallback: segue o fluxo normal (mais abaixo matchInicio pode ou não dar match)
  }

  // Opção de menu (ex.: "Assinatura R$9,90") não pode ser registrada como gasto — tratar antes do parse de despesa.
  if (isKnownMenuOption(messageText)) {
    const menuResponded = await tryRespondAsMenuOption(flow, contactId, nome, messageText)
    if (menuResponded) {
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(5).catch(() => {})
      return { replied: true, reason: 'menu_opcao' }
    }
    const fallbackMsg = getMenuOptionFallbackMessage(messageText, nome)
    const fallbackSent = (await sendWhatsAppMessageWithResult(contactId, fallbackMsg)).success
    if (!fallbackSent) await enqueuePlenMessage(contactId, fallbackMsg, new Date())
    const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
    await processPlenQueue(3).catch(() => {})
    return { replied: true, reason: 'menu_opcao_fallback' }
  }

  // Usuário ativo enviou gasto(s) ou receita(s) — reconhecer múltiplos na mesma mensagem e registrar todos na ordem.
  const temContaAuth = await contactTemContaAuth(contact)
  const isUsuarioAtivo = isLeadCadastrado(contact) && temContaAuth
  if (isUsuarioAtivo) {
    const expenses = parseMultipleExpensesOrReceita(messageText)
    if (expenses.length > 0) {
      const count = await getPlenRegistroCount(contactId, contact?.data_cadastro ?? undefined)
      const slotsRestantes = Math.max(0, LIMITE_REGISTROS_GRATUITOS - count)
      if (slotsRestantes === 0) {
        const msgLimite = applyReplacements(
          'Você já usou todos os registros do plano gratuito 💙 Quer desbloquear mais? Digite MENU e veja o plano.',
          { nome }
        )
        await enqueuePlenMessage(contactId, msgLimite, new Date())
      } else {
        const toRegister = expenses.slice(0, slotsRestantes)
        const skipped = expenses.length - toRegister.length
        const dataExibir = formatarDataHoje()
        const linhas: string[] = []
        for (let i = 0; i < toRegister.length; i++) {
          const expense = toRegister[i]
          const nomeRegistro = extrairNomeRegistroCurto(expense.descricao || (expense.intent === 'registrar_receita' ? 'Entrada' : 'Gasto'), expense.intent)
          const categoriaExibir = expense.categoria === 'Pessoas' ? 'Pessoa' : (expense.categoria ?? 'Outros')
          const emoji = expense.intent === 'registrar_receita' ? '🟢' : '🔴'
          await inserirRegistroPlenWhatsApp(contact, {
            valor: expense.valor,
            intent: expense.intent,
            categoria: expense.categoria ?? undefined,
            descricao: expense.descricao ?? undefined,
          })
          linhas.push(`${emoji} ${i + 1}. ${nomeRegistro} — ${categoriaExibir} — R$${expense.valor.toFixed(2)}`)
        }
        let msgConfirmacao: string
        if (toRegister.length === 1) {
          const expense = toRegister[0]
          const nomeRegistro = extrairNomeRegistroCurto(expense.descricao || (expense.intent === 'registrar_receita' ? 'Entrada' : 'Gasto'), expense.intent)
          const categoriaExibir = expense.categoria === 'Pessoas' ? 'Pessoa' : (expense.categoria ?? 'Outros')
          const titulo = expense.intent === 'registrar_receita' ? '🟢 Recibo registrado! 💙' : '🔴 Gasto registrado! 💙'
          const frase =
            messageText.trim() ||
            (expense.intent === 'registrar_receita'
              ? `Recebi R$${expense.valor.toFixed(2)} ${(expense.descricao || '').trim()}`.trim()
              : `Gastei R$${expense.valor.toFixed(2)} ${(expense.descricao || '').trim()}`.trim())
          msgConfirmacao = `${titulo}\n\n📌 ${nomeRegistro}\n${frase}\n\n📁 Categoria: ${categoriaExibir}\n💰 Valor: R$${expense.valor.toFixed(2)}\n📅 ${dataExibir}\n\nVer meus registros: ${PLEN_DASHBOARD_URL}`
        } else {
          const titulo = `💙 ${toRegister.length} registros feitos!`
          msgConfirmacao = `${titulo}\n\n${linhas.join('\n')}\n\n📅 ${dataExibir}\n\nVer meus registros: ${PLEN_DASHBOARD_URL}`
        }
        if (skipped > 0) {
          msgConfirmacao += `\n\n⚠️ ${skipped} não registrado(s): você atingiu o limite do plano gratuito. Digite MENU para fazer upgrade.`
        }
        await enqueuePlenMessage(contactId, msgConfirmacao, new Date())
        await logPlenInteraction({
          contact_id: contactId,
          mensagem_recebida: messageText.slice(0, 500),
          estado_usuario: 'usuario_ativo',
          intent_detectada: toRegister.length === 1 ? toRegister[0].intent : 'registrar_despesa',
          acao_executada: 'registro_gasto_ativo',
          resposta_enviada: msgConfirmacao.slice(0, 500),
        })
      }
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(Math.max(3, expenses.length * 2)).catch(() => {})
      return { replied: true, reason: 'registro_gasto_ou_receita' }
    }
  }

  // Quando o usuário diz que quer utilizar/cadastrar: verificar se já tem conta; se não, reiniciar fluxo (teste + cadastro).
  const intentQueroUtilizar =
    /quero\s+utilizar|plenipay|quero\s+usar|quero\s+cadastr|ol[aá].*quero/i.test(text) ||
    (textLower.includes('quero') && (textLower.includes('utilizar') || textLower.includes('plenipay') || textLower.includes('cadastr')))
  if (intentQueroUtilizar) {
    const jaTemConta = isLeadCadastrado(contact)
    if (jaTemConta) {
      await enqueuePlenMessage(
        contactId,
        'Você já está cadastrado! 💙\n\n' +
          'Pode começar a usar: me envie seus gastos e receitas por aqui. Exemplos:\n\n' +
          '• gastei 290 academia\n' +
          '• recebi 2000 salario\n' +
          '• gastei 39 uber\n\n' +
          'Use o app ou envie "menu" para ver mais opções.',
        new Date()
      )
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'ja_cadastrado' }
    }
    // Sem conta: reiniciar do zero — fluxo de teste (boas-vindas + gasto) e depois cadastro (nome, email, código).
    await clearChatbotFlowState(contactId)
    await updateContact(contactId, { status: 'novo_lead' })
    // Segue abaixo: sem state, matchInicio vai bater e inicia no primeiro nó (boas-vindas → teste → cadastro).
  }

  // Cancelar cadastro em qualquer etapa do fluxo (pedir nome, pedir email, aguardando código, etc.)
  const querCancelarCadastro =
    /cancelar(\s*cadastro)?|desistir|n[aã]o\s*quero\s*(mais|continuar)|quero\s*cancelar/i.test(textLower) ||
    textLower.trim() === 'cancelar'
  if (querCancelarCadastro) {
    const jaCadastrado = isLeadCadastrado(contact)
    if (!jaCadastrado) {
      await clearChatbotFlowState(contactId)
      await updateContact(contactId, { status: 'novo_lead' })
      await enqueuePlenMessage(
        contactId,
        'Cadastro cancelado. Quando quiser, é só mandar "Olá" ou "Quero utilizar a Plenipay" para começar de novo. 💙',
        new Date()
      )
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'cadastro_cancelado' }
    }
  }

  const isAguardandoCodigo = status === 'aguardando_codigo' && contactEmail.includes('@')
  if (isAguardandoCodigo) {
    const apenasDigitos = text.replace(/\D/g, '')
    const codigo6Digitos = apenasDigitos.length === 6 && /^\d{6}$/.test(apenasDigitos)
    if (codigo6Digitos) {
      const result = await verifyCodeForPlen(apenasDigitos, contactEmail)
      if (result.success) {
        await updateContact(contactId, { status: 'usuario_ativo', usuario_cadastrado: true, data_cadastro: new Date().toISOString() })
        if (result.user_id && contact) {
          await upsertProfileFromPlenContact(result.user_id, {
            email: contactEmail,
            nome: contact.nome ?? null,
            telefone: contact.telefone ?? '',
          }).catch((err) => console.warn('[chatbot-flow] upsert profile após código:', (err as Error)?.message))
        }
        const nodes = getNodes(flow)
        const contaConfirmadaNode = nodes.find(
          (n) =>
            (n.id && n.id.includes('conta-confirmada')) ||
            (n.data?.label && String(n.data.label).toLowerCase().includes('conta confirmada'))
        )
        let stateAposConfirmada: string | null = null
        if (contaConfirmadaNode?.id && contaConfirmadaNode?.data?.config) {
          const cfg = contaConfirmadaNode.data.config as Record<string, unknown>
          const texto = (cfg?.texto as string)?.trim() || ''
          if (texto) {
            const msg = applyReplacements(texto, { nome })
            await enqueuePlenMessage(contactId, msg, new Date())
          }
          stateAposConfirmada = contaConfirmadaNode.id
        } else {
          await enqueuePlenMessage(
            contactId,
            'Conta confirmada ' + nome + '! 🎉 Agora você já pode registrar seus gastos. Digite MENU a qualquer momento para as opções.',
            new Date()
          )
        }
        if (stateAposConfirmada) await setChatbotFlowState(contactId, flow.id, stateAposConfirmada)
        const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
        await processPlenQueue(5).catch(() => {})
        return { replied: true, reason: 'email_confirmado' }
      }
      await enqueuePlenMessage(
        contactId,
        result.error ?? 'Código inválido ou expirado. Verifique e tente novamente.',
        new Date()
      )
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'codigo_invalido' }
    }
    const querCancelar =
      /cancelar(\s*cadastro)?|desistir|n[aã]o\s*quero\s*(mais|continuar)|quero\s*cancelar/i.test(textLower) ||
      textLower.trim() === 'cancelar'
    if (querCancelar) {
      await clearChatbotFlowState(contactId)
      await updateContact(contactId, { status: 'novo_lead' })
      await enqueuePlenMessage(
        contactId,
        'Cadastro cancelado. Quando quiser, é só mandar "Olá" ou "Quero utilizar a Plenipay" para começar de novo. 💙',
        new Date()
      )
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'cadastro_cancelado' }
    }
    // Só reenviar quando o usuário pediu explicitamente (digitou ou clicou no botão "Reenviar código"). Não inferir reenviar.
    const clicouReenviar =
      /^reenviar\s*e?-?mail$/i.test(textLower.trim()) ||
      /^reenviar\s*c[oó]digo$/i.test(textLower.trim()) ||
      textLower.trim() === 'reenviar email' ||
      textLower.trim() === 'reenviar e-mail' ||
      textLower.trim() === 'reenviar código' ||
      textLower.trim() === 'reenviar codigo'
    if (clicouReenviar) {
      const result = await resendCodeForPlen(contactEmail)
      const msgConfirmacao = result.success
        ? 'Reenviei o código para seu email. Confira a caixa de entrada e o spam. Digite o código aqui para finalizar.'
        : 'Não foi possível reenviar agora. Tente novamente em alguns minutos ou confira se o email está correto.'
      await enqueuePlenMessage(contactId, msgConfirmacao, new Date())
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'codigo_reenviado' }
    }
    const reclamouQueNaoChegou =
      /email\s*n[aã]o\s*chegou|n[aã]o\s*recebi(\s*(o\s*)?(email|c[oó]digo))?(\s*$)?|c[oó]digo\s*n[aã]o\s*chegou|n[aã]o\s*chegou\s*(o\s*)?email/.test(textLower)
    if (reclamouQueNaoChegou) {
      const result = await resendCodeForPlen(contactEmail)
      const msgConfirmacao = result.success
        ? 'Acabei de reenviar o código para seu email. Confira a caixa de entrada e o spam. Digite o código aqui para finalizar.'
        : 'Não foi possível reenviar agora. Tente em instantes ou confira se o email está correto. Se quiser, clique no botão abaixo para tentar de novo.'
      await enqueuePlenMessage(contactId, msgConfirmacao, new Date())
      await sendWhatsAppButtonReply(
        contactId,
        'Não recebeu? Clique abaixo para reenviar o código.',
        'Reenviar código'
      ).catch(() => {})
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(3).catch(() => {})
      return { replied: true, reason: 'codigo_reenviado' }
    }
    await enqueuePlenMessage(
      contactId,
      'Digite o código de 6 dígitos que enviamos para seu email para finalizar o cadastro.',
      new Date()
    )
    const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
    await processPlenQueue(2).catch(() => {})
    return { replied: true, reason: 'aguardando_codigo_outro' }
  }

  const state = await getChatbotFlowState(contactId)

  // Sempre tentar responder como opção do menu (1º nó menu do fluxo) — funciona com ou sem estado.
  const menuRespondedAny = await tryRespondAsMenuOption(flow, contactId, nome, messageText)
  if (menuRespondedAny) return { replied: true, reason: undefined }

  // Fallback: mensagem é uma opção conhecida do menu mas o fluxo não respondeu — enviar confirmação para o lead sempre receber algo.
  if (isKnownMenuOption(messageText)) {
    const fallbackMsg = getMenuOptionFallbackMessage(messageText, nome)
    const fallbackSent = (await sendWhatsAppMessageWithResult(contactId, fallbackMsg)).success
    if (process.env.NODE_ENV === 'development') {
      console.log('[plen/menu] fallback enviado (fluxo não respondeu)', { text: messageText?.slice(0, 30), sent: fallbackSent })
    }
    return { replied: fallbackSent, reason: fallbackSent ? undefined : 'menu_fallback_envio_falhou' }
  }

  if (!state) {
    const texto = (messageText || '').trim().toLowerCase()
    if (texto === 'menu') {
      const menuNodeId = getFirstMenuNodeId(flow)
      if (menuNodeId) {
        const { sent, targets, sentLabels } = await sendMenuAsButtonsAndGetTargets(flow, menuNodeId, contactId, nome)
        await setChatbotFlowState(contactId, flow.id, menuNodeId, { waitingMenu: true, menuOptions: sentLabels, menuTargets: targets })
        return { replied: sent, reason: sent ? undefined : 'menu_sem_opcoes' }
      }
    }
    const inicioMatch = matchInicio(flow, messageText, isNewLead)
    if (!inicioMatch) return { replied: false, reason: 'inicio_not_matched' }

    const firstTargets = getOutgoingTargets(flow, inicioMatch.inicioNodeId)
    const firstId = firstTargets[0]
    if (!firstId) return { replied: false, reason: 'no_edge_from_inicio' }

    const firstNode = getNodeById(flow, firstId)
    const firstType = firstNode?.data?.nodeType

    if (firstType === 'mensagem') {
      const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, firstId, contactId, nome)
      await setChatbotFlowState(contactId, flow.id, nextNodeId ?? firstId)
      return { replied: sent, reason: sent ? undefined : 'mensagem_vazia_ou_sem_proximo' }
    }
    if (firstType === 'menu') {
      const { sent, targets, sentLabels } = await sendMenuAsButtonsAndGetTargets(flow, firstId, contactId, nome)
      await setChatbotFlowState(contactId, flow.id, firstId, { waitingMenu: true, menuOptions: sentLabels, menuTargets: targets })
      return { replied: sent, reason: sent ? undefined : 'menu_sem_opcoes' }
    }
    if (firstType === 'ia') {
      const texto = (messageText || '').trim().toLowerCase()
      if (texto === 'menu') {
        const menuNodeId = getFirstMenuNodeId(flow)
        if (menuNodeId) {
          const { sent, targets, sentLabels } = await sendMenuAsButtonsAndGetTargets(flow, menuNodeId, contactId, nome)
          await setChatbotFlowState(contactId, flow.id, menuNodeId, { waitingMenu: true, menuOptions: sentLabels, menuTargets: targets })
          return { replied: sent, reason: sent ? undefined : 'menu_sem_opcoes' }
        }
      }
      const iaConfig = firstNode?.data?.config as Record<string, unknown> | undefined
      const iaPrompt = (iaConfig?.iaPrompt as string)?.trim() || ''
      const reply = await getPlenLLMResponse({
        userMessage: messageText,
        context: iaPrompt || undefined,
      })
      if (reply) await enqueuePlenMessage(contactId, reply)
      const iaTargets = getOutgoingTargets(flow, firstId)
      const nextAfterIa = iaTargets[0]
      await setChatbotFlowState(contactId, flow.id, nextAfterIa ?? firstId)
      return { replied: !!reply, reason: reply ? undefined : 'ia_sem_resposta' }
    }
    if (firstType === 'delay') {
      const delayTargets = getOutgoingTargets(flow, firstId)
      const afterId = delayTargets[0]
      const dconfig = (firstNode?.data?.config ?? {}) as Record<string, unknown>
      const min = Number(dconfig.delayMin ?? 0) * 1000
      const max = Math.max(Number(dconfig.delayMax ?? 5) * 1000, min)
      const delayMs = min + Math.random() * (max - min || 0)
      if (afterId) {
        const afterNode = getNodeById(flow, afterId)
        if (afterNode?.data?.nodeType === 'mensagem') {
          const rawCfg = (afterNode.data?.config ?? afterNode.data) as Record<string, unknown> | undefined
          const cfg = rawCfg && typeof rawCfg === 'object' ? rawCfg : undefined
          const texto = (cfg?.texto as string)?.trim() || ''
          if (texto) {
            const msg = applyReplacements(texto, { nome })
            let br = cfg?.botoes as Array<{ titulo?: string; link?: string }> | undefined
            let botoes = Array.isArray(br) ? br.filter((b) => (b?.titulo ?? '').trim().length > 0).map((b) => ({ titulo: (b?.titulo ?? '').trim(), link: (b?.link ?? '').trim() || undefined })) : []
            const label = String(afterNode?.data?.label ?? '')
            if (botoes.length === 0 && /falar com humano|suporte|atendente|clique abaixo/i.test(label)) botoes = [{ titulo: 'Chamar atendente', link: undefined }]
            await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs), botoes.length > 0 ? botoes : undefined)
          }
        }
        await setChatbotFlowState(contactId, flow.id, afterId)
      } else {
        await setChatbotFlowState(contactId, flow.id, firstId)
      }
      return { replied: false, reason: 'delay_agendado' }
    }
    if (firstType === 'fim') return { replied: false, reason: 'primeiro_no_e_fim' }
    await setChatbotFlowState(contactId, flow.id, firstId)
    return { replied: false, reason: 'primeiro_no_nao_mensagem' }
  }

  if (state.flow_id !== flow.id) {
    await clearChatbotFlowState(contactId)
    const inicioMatch = matchInicio(flow, messageText, isNewLead)
    if (!inicioMatch) return { replied: false, reason: 'flow_changed_inicio_not_matched' }
    const firstTargets = getOutgoingTargets(flow, inicioMatch.inicioNodeId)
    const firstId = firstTargets[0]
    if (!firstId) return { replied: false }
    const firstNode = getNodeById(flow, firstId)
    const firstType = firstNode?.data?.nodeType
    if (firstType === 'mensagem') {
      const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, firstId, contactId, nome)
      await setChatbotFlowState(contactId, flow.id, nextNodeId ?? firstId)
      return { replied: sent, reason: sent ? undefined : 'flow_changed_mensagem_vazia' }
    }
    await setChatbotFlowState(contactId, flow.id, firstId)
    return { replied: false, reason: 'flow_changed_primeiro_nao_mensagem' }
  }

  const ctx = normalizeContext(state.context)
  if (state.current_node_id) {
    const menuNode = getNodeById(flow, state.current_node_id)
    const isMenuNode =
      menuNode?.data?.nodeType === 'menu' ||
      (typeof (menuNode?.data?.config as Record<string, unknown>)?.menuOpcoes === 'string' &&
        ((menuNode?.data?.config as Record<string, unknown>).menuOpcoes as string).trim().length > 0)
    if (isMenuNode) {
      const texto = (messageText || '').trim().toLowerCase()
      if (texto === 'menu') {
        const { sent } = await sendMenuAsButtonsAndGetTargets(flow, state.current_node_id, contactId, nome)
        const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
        if (sent) await processPlenQueue(3).catch(() => {})
        return { replied: sent, reason: sent ? undefined : 'menu_reenvio_falhou' }
      }
      const targetId = getMenuTargetByMessage(flow, state.current_node_id, messageText)
      if (targetId) {
        const targetNode = getNodeById(flow, targetId)
        if (targetNode?.data?.nodeType === 'mensagem') {
          const cfg = targetNode.data?.config as Record<string, unknown> | undefined
          const textoMsg = (cfg?.texto as string)?.trim() || ''
          let sent = false
          if (textoMsg) {
            const msg = applyReplacements(textoMsg, { nome })
            sent = (await sendWhatsAppMessageWithResult(contactId, msg)).success
            if (!sent) await enqueuePlenMessage(contactId, msg)
          } else {
            await enqueuePlenMessage(contactId, applyReplacements('Opção em configuração.', { nome }))
          }
          const nextNodeId = getOutgoingTargets(flow, targetId)[0] ?? null
          await setChatbotFlowState(contactId, flow.id, nextNodeId ?? targetId)
          const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
          await processPlenQueue(5).catch(() => {})
          return { replied: true, reason: sent ? undefined : 'menu_opcao_enfileirada' }
        }
        if (targetNode?.data?.nodeType === 'delay') {
          const dconfig = targetNode.data?.config as Record<string, unknown> | undefined
          const min = Number(dconfig?.delayMin ?? 0) * 1000
          const max = Math.max(Number(dconfig?.delayMax ?? 5) * 1000, min)
          const delayMs = min + Math.random() * (max - min || 0)
          const afterDelayTargets = getOutgoingTargets(flow, targetId)
          const afterDelayId = afterDelayTargets[0]
          if (afterDelayId) {
            const afterNode = getNodeById(flow, afterDelayId)
            if (afterNode?.data?.nodeType === 'mensagem') {
              const rawCfg = (afterNode.data?.config ?? afterNode.data) as Record<string, unknown> | undefined
              const cfg = rawCfg && typeof rawCfg === 'object' ? rawCfg : undefined
              const texto = (cfg?.texto as string)?.trim() || ''
              if (texto) {
                const msg = applyReplacements(texto, { nome })
                let br = cfg?.botoes as Array<{ titulo?: string; link?: string }> | undefined
                let botoes = Array.isArray(br) ? br.filter((b) => (b?.titulo ?? '').trim().length > 0).map((b) => ({ titulo: (b?.titulo ?? '').trim(), link: (b?.link ?? '').trim() || undefined })) : []
                const label = String(afterNode?.data?.label ?? '')
                if (botoes.length === 0 && /falar com humano|suporte|atendente|clique abaixo/i.test(label)) botoes = [{ titulo: 'Chamar atendente', link: undefined }]
                await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs), botoes.length > 0 ? botoes : undefined)
              }
              const afterTargets = getOutgoingTargets(flow, afterDelayId)
              await setChatbotFlowState(contactId, flow.id, afterTargets[0] ?? afterDelayId)
            } else {
              await setChatbotFlowState(contactId, flow.id, afterDelayId)
            }
          } else {
            await setChatbotFlowState(contactId, flow.id, targetId)
          }
          return { replied: false, reason: 'menu_opcao_delay_agendado' }
        }
        await setChatbotFlowState(contactId, flow.id, targetId)
        return { replied: false, reason: 'menu_opcao_nao_e_mensagem' }
      }
      const ehSaudacao =
        /^(oi|ol[aá]|ola|hey|bom\s*dia|boa\s*tarde|boa\s*noite)[\s!.]*$/i.test(texto) ||
        texto === 'oi' || texto === 'olá' || texto === 'ola'
      const msgNaoReconhecida = ehSaudacao
        ? applyReplacements('Olá, {nome}! 💙 Escolha uma das opções acima ou digite MENU para ver o menu.', { nome })
        : applyReplacements('Opção não reconhecida. Digite MENU para ver as opções.', { nome })
      await enqueuePlenMessage(contactId, msgNaoReconhecida, new Date())
      const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
      await processPlenQueue(2).catch(() => {})
      return { replied: true, reason: 'menu_opcao_invalida' }
    }
  }

  const { replied, nextNodeId, newContext } = await advanceFromNode(flow, state.current_node_id, contactId, nome, messageText)
  if (nextNodeId != null) {
    const nextNode = getNodeById(flow, nextNodeId)
    const nextType = nextNode?.data?.nodeType
    if (nextType === 'fim') await clearChatbotFlowState(contactId)
    else await setChatbotFlowState(contactId, flow.id, nextNodeId, newContext)
  } else if (newContext && state.current_node_id) {
    await setChatbotFlowState(contactId, flow.id, state.current_node_id, newContext)
  }
  return { replied, reason: replied ? undefined : 'advance_sem_resposta' }
}
