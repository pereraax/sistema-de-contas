/**
 * Motor de execução dos fluxos do Chatbot Builder.
 * Única fonte de mensagens/automação Plen: fluxo ativo em chatbot_flows.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { getContactById } from '@/lib/crm/contacts'
import { enqueuePlenMessage } from '@/lib/plen/queue/message-queue'
import { getAssistenteGlobalPausada } from '@/lib/assistente-global-pausada'

type ChatbotFlowRow = { id: string; nome: string; estrutura_json: { nodes: unknown[]; edges: { source: string; target: string }[] } }

type FlowStateRow = { contact_id: string; flow_id: string; current_node_id: string; context: Record<string, unknown>; updated_at: string }

function getNodes(flow: ChatbotFlowRow): Array<{ id: string; data?: { nodeType?: string; config?: Record<string, unknown> } }> {
  const j = flow?.estrutura_json
  if (!j || !Array.isArray(j.nodes)) return []
  return j.nodes
}

function getEdges(flow: ChatbotFlowRow): Array<{ source: string; target: string }> {
  const j = flow?.estrutura_json
  if (!j || !Array.isArray(j.edges)) return []
  return j.edges
}

function getNodeById(flow: ChatbotFlowRow, nodeId: string) {
  return getNodes(flow).find((n) => n.id === nodeId)
}

function getOutgoingTargets(flow: ChatbotFlowRow, sourceId: string): string[] {
  return getEdges(flow)
    .filter((e) => e.source === sourceId)
    .map((e) => e.target)
}

/** Retorna o fluxo ativo (ativo = true; o mais recente se houver vários). */
async function getActiveFlow(): Promise<ChatbotFlowRow | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('chatbot_flows')
    .select('id, nome, estrutura_json')
    .eq('ativo', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  const est = (data as { estrutura_json?: unknown }).estrutura_json
  if (!est || typeof est !== 'object' || !('nodes' in est)) return null
  return data as ChatbotFlowRow
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

async function clearChatbotFlowState(contactId: string): Promise<boolean> {
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
    return match ? { matched: true, inicioNodeId: inicio.id } : null
  }

  return { matched: true, inicioNodeId: inicio.id }
}

function applyReplacements(text: string, vars: { nome?: string }): string {
  let out = text
  if (vars.nome != null) out = out.replace(/\{\{nome\}\}/g, vars.nome)
  return out
}

/** Envia o texto do nó Mensagem e retorna o nodeId para ser o novo current. */
async function sendMessageNodeAndReturnNext(
  flow: ChatbotFlowRow,
  nodeId: string,
  contactId: string,
  nome: string
): Promise<{ sent: boolean; nextNodeId: string | null }> {
  const node = getNodeById(flow, nodeId)
  if (!node) return { sent: false, nextNodeId: null }
  const nodeType = node.data?.nodeType
  if (nodeType !== 'mensagem') {
    const targets = getOutgoingTargets(flow, nodeId)
    return { sent: false, nextNodeId: targets[0] ?? null }
  }
  const config = node.data?.config as Record<string, unknown> | undefined
  const texto = (config?.texto as string)?.trim() || ''
  if (!texto) {
    const targets = getOutgoingTargets(flow, nodeId)
    return { sent: false, nextNodeId: targets[0] ?? null }
  }
  const msg = applyReplacements(texto, { nome })
  await enqueuePlenMessage(contactId, msg)
  const targets = getOutgoingTargets(flow, nodeId)
  return { sent: true, nextNodeId: targets[0] ?? null }
}

/** Avançar do nó atual: executa o próximo nó (ex.: Mensagem) e atualiza estado. */
async function advanceFromNode(
  flow: ChatbotFlowRow,
  currentId: string,
  contactId: string,
  nome: string
): Promise<{ replied: boolean; nextNodeId: string | null }> {
  const node = getNodeById(flow, currentId)
  if (!node) return { replied: false, nextNodeId: null }
  const nodeType = node.data?.nodeType

  if (nodeType === 'mensagem') {
    const targets = getOutgoingTargets(flow, currentId)
    const nextId = targets[0]
    if (!nextId) return { replied: false, nextNodeId: null }
    const nextNode = getNodeById(flow, nextId)
    const nextType = nextNode?.data?.nodeType
    if (nextType === 'mensagem') {
      const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, nome)
      return { replied: sent, nextNodeId: nextNodeId ?? nextId }
    }
    if (nextType === 'fim') return { replied: false, nextNodeId: null }
    return { replied: false, nextNodeId: nextId }
  }

  if (nodeType === 'inicio') {
    const targets = getOutgoingTargets(flow, currentId)
    const nextId = targets[0]
    if (!nextId) return { replied: false, nextNodeId: null }
    const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, nome)
    return { replied: sent, nextNodeId: nextNodeId ?? nextId }
  }

  const targets = getOutgoingTargets(flow, currentId)
  const nextId = targets[0]
  if (!nextId) return { replied: false, nextNodeId: null }
  const nextNode = getNodeById(flow, nextId)
  const nextType = nextNode?.data?.nodeType
  if (nextType === 'mensagem') {
    const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, nome)
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
 */
export async function runChatbotFlow(
  contactId: string,
  messageText: string,
  isNewLead: boolean
): Promise<RunChatbotFlowResult> {
  const text = (messageText || '').trim()
  if (!text) return { replied: false, reason: 'empty' }

  const paused = await getAssistenteGlobalPausada()
  if (paused) return { replied: false, reason: 'assistente_pausada' }

  const flow = await getActiveFlow()
  if (!flow) return { replied: false, reason: 'no_active_flow' }

  const contact = await getContactById(contactId)
  const nome = (contact?.nome?.trim() && contact.nome.length >= 2) ? contact.nome.trim() : 'amigo'

  const state = await getChatbotFlowState(contactId)

  if (!state) {
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
      return { replied: sent }
    }

    if (firstType === 'fim') return { replied: false }
    await setChatbotFlowState(contactId, flow.id, firstId)
    return { replied: false }
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
      return { replied: sent }
    }
    await setChatbotFlowState(contactId, flow.id, firstId)
    return { replied: false }
  }

  const { replied, nextNodeId } = await advanceFromNode(flow, state.current_node_id, contactId, nome)
  if (nextNodeId) {
    const nextNode = getNodeById(flow, nextNodeId)
    const nextType = nextNode?.data?.nodeType
    if (nextType === 'fim') await clearChatbotFlowState(contactId)
    else await setChatbotFlowState(contactId, flow.id, nextNodeId)
  }
  return { replied }
}
