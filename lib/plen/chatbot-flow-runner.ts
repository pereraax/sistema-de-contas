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
import { createUserAndSendCode, resendCodeForPlen, verifyCodeForPlen } from '@/lib/plen/auth/email-verification'
import { sendWhatsAppButtonReply, sendWhatsAppMenuAsList, sendWhatsAppMenuButtons } from '@/lib/whatsapp/sender'

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

/** Retorna o primeiro nó do tipo menu no fluxo (para enviar menu com botões quando o lead digita "menu" no nó IA). */
function getFirstMenuNodeId(flow: ChatbotFlowRow): string | null {
  const node = getNodes(flow).find((n) => n.data?.nodeType === 'menu')
  return node?.id ?? null
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

/** Monta e envia menu em uma única mensagem (lista interativa). Mensagem amigável explicando que pode enviar MENU a qualquer momento. */
async function sendMenuAsButtonsAndGetTargets(
  flow: ChatbotFlowRow,
  nodeId: string,
  contactId: string,
  nome: string
): Promise<{ sent: boolean; targets: string[] }> {
  const node = getNodeById(flow, nodeId)
  if (!node) return { sent: false, targets: [] }
  const config = node.data?.config as Record<string, unknown> | undefined
  const customIntro = (config?.menuIntro as string)?.trim()
  const opcoesStr = (config?.menuOpcoes as string)?.trim() || ''
  const linhas = opcoesStr.split('\n').map((s) => s.trim()).filter(Boolean)
  const targets = getOutgoingTargets(flow, nodeId)
  const friendlyIntro =
    customIntro ||
    `Olá, {nome}! Você pode enviar MENU a qualquer momento para acessar estas opções. Toque no botão abaixo para escolher.`
  const introMsg = applyReplacements(friendlyIntro, { nome })
  let result = await sendWhatsAppMenuAsList(contactId, introMsg, linhas)
  if (!result.success) result = await sendWhatsAppMenuButtons(contactId, introMsg, linhas)
  return { sent: result.success, targets }
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

/** Índice da opção do menu (1, 2, 3... ou texto do botão, ex.: "Falar com humano"). */
function matchMenuOption(messageText: string, options: string[]): number {
  const t = (messageText || '').trim().toLowerCase()
  const n = parseInt(t, 10)
  if (!Number.isNaN(n) && n >= 1 && n <= options.length) return n - 1
  for (let i = 0; i < options.length; i++) {
    const raw = (options[i] || '').trim().toLowerCase()
    const optSemNumero = raw.replace(/^\d+\s*/, '')
    if (raw && (t.includes(raw) || t.includes(optSemNumero) || optSemNumero && t === optSemNumero)) return i
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
      const { sent, targets: menuTargets } = await sendMenuAsButtonsAndGetTargets(flow, nextId, contactId, effectiveNome)
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
            const msg = applyReplacements(texto, { nome: effectiveNome })
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
              await enqueuePlenMessage(
                contactId,
                result.error ?? 'Não foi possível enviar o código agora. Verifique o email e tente novamente.',
                new Date()
              )
              const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
              await processPlenQueue(2).catch(() => {})
              return { replied: true, nextNodeId: currentId }
            }
            await updateContact(contactId, { email, status: 'aguardando_codigo' })
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
          await enqueuePlenMessage(
            contactId,
            result.error ?? 'Não foi possível enviar o código agora. Verifique o email e tente novamente.',
            new Date()
          )
          const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
          await processPlenQueue(2).catch(() => {})
          return { replied: true, nextNodeId: currentId }
        }
        await updateContact(contactId, { email, status: 'aguardando_codigo' })
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
        const { sent, targets: menuTargets } = await sendMenuAsButtonsAndGetTargets(flow, menuNodeId, contactId, nome)
        const menuNode = getNodeById(flow, menuNodeId)
        const config = menuNode?.data?.config as Record<string, unknown> | undefined
        const opcoesStr = (config?.menuOpcoes as string) || ''
        const menuOptions = opcoesStr.split('\n').map((s) => s.trim()).filter(Boolean)
        return {
          replied: sent,
          nextNodeId: menuNodeId,
          newContext: { waitingMenu: true, menuOptions, menuTargets },
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

  // Nó atual é Delay: agendar a próxima mensagem com o delay configurado e avançar
  if (nodeType === 'delay') {
    const dconfig = node.data?.config as Record<string, unknown> | undefined
    const min = Number(dconfig?.delayMin ?? 0) * 1000
    const max = Math.max(Number(dconfig?.delayMax ?? 5) * 1000, min)
    const delayMs = min + Math.random() * (max - min || 0)
    const afterDelayId = targets[0]
    if (afterDelayId) {
      const afterNode = getNodeById(flow, afterDelayId)
      if (afterNode?.data?.nodeType === 'mensagem') {
        const cfg = afterNode.data?.config as Record<string, unknown> | undefined
        const texto = (cfg?.texto as string)?.trim() || ''
        if (texto) {
          const msg = applyReplacements(texto, { nome: effectiveNome })
          await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs))
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

  const paused = await getAssistenteGlobalPausada()
  if (paused) return { replied: false, reason: 'assistente_pausada' }

  const flow = await getActiveFlow()
  if (!flow) return { replied: false, reason: 'no_active_flow' }

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

  // Quando o usuário diz que quer utilizar/cadastrar: verificar se já tem conta; se não, reiniciar fluxo (teste + cadastro).
  const intentQueroUtilizar =
    /quero\s+utilizar|plenipay|quero\s+usar|quero\s+cadastr|ol[aá].*quero/i.test(text) ||
    (textLower.includes('quero') && (textLower.includes('utilizar') || textLower.includes('plenipay') || textLower.includes('cadastr')))
  if (intentQueroUtilizar) {
    const jaTemConta = status === 'usuario_ativo' || contact?.usuario_cadastrado === true
    if (jaTemConta) {
      await enqueuePlenMessage(
        contactId,
        'Você já está cadastrado! Use o app ou envie "menu" para ver opções.',
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
    const jaCadastrado = status === 'usuario_ativo' || contact?.usuario_cadastrado === true
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
    const clicouReenviar =
      /^reenviar\s*e?-?mail$/i.test(textLower.trim()) ||
      /^reenviar\s*c[oó]digo$/i.test(textLower.trim()) ||
      textLower.trim() === 'reenviar email' ||
      textLower.trim() === 'reenviar e-mail' ||
      textLower.trim() === 'reenviar código' ||
      textLower.trim() === 'reenviar codigo' ||
      (text.trim().length === 1 && /^[12]$/.test(text.trim())) // botão envia "1" ou "2" só quando é 1 caractere
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
      /email\s*n[aã]o\s*chegou|n[aã]o\s*recebi\s*(o\s*)?(email|c[oó]digo)|c[oó]digo\s*n[aã]o\s*chegou|n[aã]o\s*chegou\s*(o\s*)?email/.test(textLower)
    if (reclamouQueNaoChegou) {
      const sent = await sendWhatsAppButtonReply(
        contactId,
        'Parece que o email não chegou ainda. Clique abaixo para reenviar.',
        'Reenviar código'
      )
      return { replied: sent.success, reason: sent.success ? undefined : 'botao_reenviar_falhou' }
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
      const { sent, targets } = await sendMenuAsButtonsAndGetTargets(flow, firstId, contactId, nome)
      const firstNode = getNodeById(flow, firstId)
      const config = firstNode?.data?.config as Record<string, unknown> | undefined
      const opcoesStr = (config?.menuOpcoes as string) || ''
      const menuOptions = opcoesStr.split('\n').map((s) => s.trim()).filter(Boolean)
      await setChatbotFlowState(contactId, flow.id, firstId, { waitingMenu: true, menuOptions, menuTargets: targets })
      return { replied: sent, reason: sent ? undefined : 'menu_sem_opcoes' }
    }
    if (firstType === 'ia') {
      const texto = (messageText || '').trim().toLowerCase()
      if (texto === 'menu') {
        const menuNodeId = getFirstMenuNodeId(flow)
        if (menuNodeId) {
          const { sent, targets } = await sendMenuAsButtonsAndGetTargets(flow, menuNodeId, contactId, nome)
          const menuNode = getNodeById(flow, menuNodeId)
          const config = menuNode?.data?.config as Record<string, unknown> | undefined
          const opcoesStr = (config?.menuOpcoes as string) || ''
          const menuOptions = opcoesStr.split('\n').map((s) => s.trim()).filter(Boolean)
          await setChatbotFlowState(contactId, flow.id, menuNodeId, { waitingMenu: true, menuOptions, menuTargets: targets })
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
      const texto = (messageText || '').trim().toLowerCase()
      if (texto === 'menu') {
        const { sent } = await sendMenuAsButtonsAndGetTargets(flow, state.current_node_id, contactId, nome)
        const { processPlenQueue } = await import('@/lib/plen/queue/queue-worker')
        if (sent) await processPlenQueue(3).catch(() => {})
        return { replied: sent, reason: sent ? undefined : 'menu_reenvio_falhou' }
      }
      const idx = matchMenuOption(messageText, menuOptions)
      if (idx >= 0 && menuTargets[idx]) {
        const targetId = menuTargets[idx]
        const targetNode = getNodeById(flow, targetId)
        if (targetNode?.data?.nodeType === 'mensagem') {
          const { sent, nextNodeId } = await sendMessageNodeAndReturnNext(flow, targetId, contactId, nome)
          await setChatbotFlowState(contactId, flow.id, nextNodeId ?? targetId)
          return { replied: sent, reason: sent ? undefined : 'menu_opcao_sem_mensagem' }
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
              const cfg = afterNode.data?.config as Record<string, unknown> | undefined
              const texto = (cfg?.texto as string)?.trim() || ''
              if (texto) {
                const msg = applyReplacements(texto, { nome })
                await enqueuePlenMessage(contactId, msg, new Date(Date.now() + delayMs))
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
      await enqueuePlenMessage(
        contactId,
        applyReplacements('Opção não reconhecida. Digite MENU para ver as opções.', { nome }),
        new Date()
      )
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
