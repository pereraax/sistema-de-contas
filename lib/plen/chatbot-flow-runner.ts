/**
 * Motor de execução dos fluxos do Chatbot Builder.
 * Única fonte de mensagens/automação Plen: fluxo ativo em chatbot_flows.
 */

import { createAdminClient } from '@/lib/supabase/server'
import { getContactById } from '@/lib/crm/contacts'
import { enqueuePlenMessage } from '@/lib/plen/queue/message-queue'
import { getAssistenteGlobalPausada } from '@/lib/assistente-global-pausada'
import { getPlenLLMResponse } from '@/lib/plen-llm-fallback'

type EdgeRow = { source: string; target: string; sourceHandle?: string | null }
type ChatbotFlowRow = { id: string; nome: string; estrutura_json: { nodes: unknown[]; edges: EdgeRow[] } }

type FlowStateRow = { contact_id: string; flow_id: string; current_node_id: string; context: Record<string, unknown>; updated_at: string }

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

function getOutgoingTargets(flow: ChatbotFlowRow, sourceId: string): string[] {
  return getEdges(flow)
    .filter((e) => e.source === sourceId)
    .map((e) => e.target)
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

function applyReplacements(text: string, vars: { nome?: string; valor?: string; categoria?: string }): string {
  let out = text
  if (vars.nome != null) {
    out = out.replace(/\{\{nome\}\}/g, vars.nome).replace(/\{nome\}/g, vars.nome)
  }
  if (vars.valor != null) out = out.replace(/\{\{valor\}\}/g, String(vars.valor)).replace(/\{valor\}/g, String(vars.valor))
  if (vars.categoria != null) out = out.replace(/\{\{categoria\}\}/g, vars.categoria).replace(/\{categoria\}/g, vars.categoria)
  return out
}

/** Envia o texto do nó Mensagem e retorna o nodeId para ser o novo current. */
async function sendMessageNodeAndReturnNext(
  flow: ChatbotFlowRow,
  nodeId: string,
  contactId: string,
  nome: string,
  vars?: { valor?: string; categoria?: string }
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
  const msg = applyReplacements(texto, { nome, ...vars })
  await enqueuePlenMessage(contactId, msg)
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

/** Monta e envia mensagem do bloco Menu; retorna targets em ordem para contexto. */
async function sendMenuAndGetTargets(
  flow: ChatbotFlowRow,
  nodeId: string,
  contactId: string,
  nome: string
): Promise<{ sent: boolean; targets: string[] }> {
  const node = getNodeById(flow, nodeId)
  if (!node) return { sent: false, targets: [] }
  const config = node.data?.config as Record<string, unknown> | undefined
  const intro = (config?.menuIntro as string)?.trim() || 'Escolha uma opção:'
  const opcoesStr = (config?.menuOpcoes as string)?.trim() || ''
  const linhas = opcoesStr.split('\n').map((s) => s.trim()).filter(Boolean)
  const targets = getOutgoingTargets(flow, nodeId)
  const numeradas = linhas.map((l, i) => `${i + 1} ${l}`).join('\n')
  const msg = applyReplacements(intro + '\n\n' + numeradas, { nome })
  await enqueuePlenMessage(contactId, msg)
  return { sent: true, targets }
}

/** Avalia condição do bloco (mensagem_contem, mensagem_igual, eh_numero). */
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
  return false
}

/** Índice da opção do menu (1, 2, 3... ou texto). */
function matchMenuOption(messageText: string, options: string[]): number {
  const t = (messageText || '').trim().toLowerCase()
  const n = parseInt(t, 10)
  if (!Number.isNaN(n) && n >= 1 && n <= options.length) return n - 1
  for (let i = 0; i < options.length; i++) {
    const opt = (options[i] || '').trim().toLowerCase()
    if (opt && t.includes(opt)) return i
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

  const targets = getOutgoingTargets(flow, currentId)
  const nextId = targets[0]
  if (!nextId && nodeType !== 'mensagem' && nodeType !== 'inicio') return { replied: false, nextNodeId: null }

  if (nodeType === 'mensagem') {
    if (!nextId) return { replied: false, nextNodeId: null }
    const nextNode = getNodeById(flow, nextId)
    const nextType = nextNode?.data?.nodeType
    if (nextType === 'menu') {
      const { sent, targets: menuTargets } = await sendMenuAndGetTargets(flow, nextId, contactId, nome)
      const config = nextNode?.data?.config as Record<string, unknown> | undefined
      const opcoesStr = (config?.menuOpcoes as string) || ''
      const menuOptions = opcoesStr.split('\n').map((s) => s.trim()).filter(Boolean)
      return {
        replied: sent,
        nextNodeId: nextId,
        newContext: { waitingMenu: true, menuOptions, menuTargets },
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
          const cfg = afterNode.data?.config as Record<string, unknown> | undefined
          const texto = (cfg?.texto as string)?.trim() || ''
          if (texto) {
            const msg = applyReplacements(texto, { nome })
            await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs))
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
        if (chosenNode?.data?.nodeType === 'mensagem') {
          const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, chosen, contactId, nome)
          return { replied: sent, nextNodeId: nextNodeId ?? chosen }
        }
        return { replied: false, nextNodeId: chosen }
      }
      return { replied: false, nextNodeId: nao ?? sim }
    }
    if (nextType === 'mensagem') {
      const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, nome)
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
    const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, nextId, contactId, nome)
    return { replied: sent, nextNodeId: nextNodeId ?? nextId }
  }

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
      return { replied: sent, reason: sent ? undefined : 'mensagem_vazia_ou_sem_proximo' }
    }
    if (firstType === 'menu') {
      const { sent, targets } = await sendMenuAndGetTargets(flow, firstId, contactId, nome)
      const firstNode = getNodeById(flow, firstId)
      const config = firstNode?.data?.config as Record<string, unknown> | undefined
      const opcoesStr = (config?.menuOpcoes as string) || ''
      const menuOptions = opcoesStr.split('\n').map((s) => s.trim()).filter(Boolean)
      await setChatbotFlowState(contactId, flow.id, firstId, { waitingMenu: true, menuOptions, menuTargets: targets })
      return { replied: sent, reason: sent ? undefined : 'menu_sem_opcoes' }
    }
    if (firstType === 'ia') {
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
          const cfg = afterNode.data?.config as Record<string, unknown> | undefined
          const texto = (cfg?.texto as string)?.trim() || ''
          if (texto) await enqueuePlenMessage(contactId, applyReplacements(texto, { nome }), new Date(Date.now() + delayMs))
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

  if (state.context?.waitingMenu && state.current_node_id) {
    const menuNode = getNodeById(flow, state.current_node_id)
    if (menuNode?.data?.nodeType === 'menu') {
      const menuTargets = (state.context.menuTargets as string[]) || []
      const menuOptions = (state.context.menuOptions as string[]) || []
      const idx = matchMenuOption(messageText, menuOptions)
      if (idx >= 0 && menuTargets[idx]) {
        const targetId = menuTargets[idx]
        const targetNode = getNodeById(flow, targetId)
        if (targetNode?.data?.nodeType === 'mensagem') {
          const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, targetId, contactId, nome)
          await setChatbotFlowState(contactId, flow.id, nextNodeId ?? targetId)
          return { replied: sent, reason: sent ? undefined : 'menu_opcao_sem_mensagem' }
        }
        await setChatbotFlowState(contactId, flow.id, targetId)
        return { replied: false, reason: 'menu_opcao_nao_e_mensagem' }
      }
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
