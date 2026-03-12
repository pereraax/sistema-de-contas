/**
 * PLEN — Mensagens do fluxo (editáveis no Painel Assistente Plen).
 * Valores salvos em platform_config key "plen_flow_messages" (JSON).
 */

import { createAdminClient, createPublicClient } from '@/lib/supabase/server'

export interface PlenFlowMessages {
  new_lead?: string
  test_expense_ok?: string
  pedir_formato?: string
  prazer_nome?: string
  email_enviado?: string
  codigo_invalido?: string
  conta_criada?: string
  tutorial?: string
  menu_global?: string
  limite_plano?: string
  pedir_nome?: string
  pedir_email?: string
  email_ja_cadastrado?: string
  frases_gasto?: string[]
  /** Atraso em segundos antes de enviar cada mensagem (ex.: pedir_nome: 2 = 2s após a anterior). */
  delays?: Record<string, number>
  /** Instruções para a Plen em caso de respostas erradas / formato confuso (painel "IA e regras"). */
  ia_regras?: string
  /** Ordem das mensagens por tópico (ex.: { teste: ['test_expense_ok', 'pedir_formato'], ... }). Permite reordenar e incluir chaves custom_* */
  messageOrder?: Record<string, string[]>
  /** Se cada fluxo continua para o próximo ao finalizar (ex.: teste → cadastro). Chave = blockId (lead, teste, cadastro, ativo). */
  flowContinuesToNext?: Record<string, boolean>
}

const DEFAULT_FLOW: PlenFlowMessages = {
  new_lead: `Olá {nome}! 💙

Eu sou a Plen, sua assistente financeira no WhatsApp.

Vamos fazer um teste rápido.

Envie um gasto para eu registrar.

Exemplo:
Café 12 ☕`,
  test_expense_ok: `💙 Gasto registrado!

📂 Categoria: {categoria}
💰 Valor: R\${valor}
📅 Hoje

✨ Continue assim {nome}! ✨

Ver meus registros: {dashboardUrl}`,
  pedir_formato: `Ops {nome}, fiquei um pouco confusa 🥹

Envie assim para eu entender melhor:

gastei 20 com almoço
recebi 200 salário`,
  prazer_nome: `Prazer, {nome}! 👋\nAgora me diga qual é o seu email para criar sua conta.`,
  email_enviado: `Enviei um código de verificação para seu email.\nDigite o código aqui.`,
  codigo_invalido: `Código inválido ou expirado. Verifique o email e tente novamente.`,
  conta_criada: `Conta criada com sucesso! 🎉\nAgora você pode registrar seus gastos diretamente aqui.\nExemplo:\nAlmoço 35`,
  tutorial: `Agora você pode registrar gastos assim:

gastei 50 com mercado
recebi 2000 salário
oficina 350

Você também pode enviar:

🎤 áudio
📸 foto
📄 comprovante

Eu consigo registrar tudo para você.`,
  menu_global: `1️⃣ Falar com humano
2️⃣ Como funciona
3️⃣ Assinatura R$9,90
4️⃣ Funções plano premium
5️⃣ Indique e ganhe
6️⃣ Total / saldo`,
  limite_plano: `{nome}, você está usando o plano gratuito 💙

Já registrou 10 gastos!

Tenho um presente para você 🎁

Plano básico que custa R$49,90 está disponível para você por apenas R$9,90.`,
  pedir_nome: `Por favor, me diga seu nome (pelo menos 2 letras, sem números).`,
  pedir_email: `Por favor, me envie um email válido para criar sua conta.`,
  email_ja_cadastrado: `Este email já está cadastrado. Use outro email ou faça login no site.`,
  frases_gasto: [
    `Perfeito {nome}! Já registrei aqui 💙`,
    `Boa {nome}! Seu gasto já está salvo 📲`,
    `Muito bem {nome}! Controle financeiro é tudo ✨`,
  ],
}

const PLATFORM_CONFIG_KEY = 'plen_flow_messages'

/** Retorna mensagens do fluxo. Prioridade: painel (platform_config). Sempre tenta admin; se não houver, tenta cliente público. */
export async function getPlenFlowMessages(): Promise<PlenFlowMessages> {
  const usingAdmin = !!createAdminClient()
  let supabase = createAdminClient()
  if (!supabase) {
    try {
      supabase = createPublicClient()
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[plen/flow-messages] SUPABASE_SERVICE_ROLE_KEY não definida. Adicione no .env.local para as mensagens do painel serem usadas.')
      }
      return DEFAULT_FLOW
    }
  }
  const { data, error } = await supabase
    .from('platform_config')
    .select('value')
    .eq('key', PLATFORM_CONFIG_KEY)
    .maybeSingle()
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[plen/flow-messages] Erro ao ler fluxo:', error.message)
    }
    return DEFAULT_FLOW
  }
  if (!data?.value) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[plen/flow-messages] Nenhum registro plen_flow_messages no banco. Salve no painel Assistente Plen.')
    }
    return DEFAULT_FLOW
  }
  let parsed: Record<string, unknown>
  try {
    if (typeof data.value === 'string') {
      parsed = JSON.parse(data.value) as Record<string, unknown>
    } else if (data.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
      parsed = data.value as Record<string, unknown>
    } else {
      return DEFAULT_FLOW
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[plen/flow-messages] Erro ao fazer parse do value:', (e as Error).message)
    }
    return DEFAULT_FLOW
  }
  // Painel é a fonte da verdade: sobrescreve padrão só com valores não vazios (evita apagar no painel e cair no padrão)
  const merged: PlenFlowMessages = { ...DEFAULT_FLOW }
  for (const [k, v] of Object.entries(parsed)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string') {
      const trimmed = v.trim()
      if (trimmed !== '') (merged as Record<string, unknown>)[k] = trimmed
    } else if (k === 'delays' && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      merged.delays = { ...(merged.delays ?? {}), ...(v as Record<string, number>) }
    } else if (k === 'messageOrder' && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      merged.messageOrder = { ...(merged.messageOrder ?? {}), ...(v as Record<string, string[]>) }
    } else if (k === 'flowContinuesToNext' && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      merged.flowContinuesToNext = { ...(merged.flowContinuesToNext ?? {}), ...(v as Record<string, boolean>) }
    } else if (k === 'frases_gasto' && Array.isArray(v)) {
      const arr = v.filter((s): s is string => typeof s === 'string' && String(s).trim() !== '')
      if (arr.length > 0) merged.frases_gasto = arr.map((s) => String(s).trim())
    } else if (typeof v === 'object' || typeof v === 'number' || typeof v === 'boolean') {
      (merged as Record<string, unknown>)[k] = v
    }
  }
  if (process.env.NODE_ENV === 'development') {
    const fromDb = (merged.test_expense_ok ?? '').slice(0, 55)
    const pedirNome = (merged.pedir_nome ?? '').slice(0, 55)
    console.log('[plen/flow-messages] Fluxo do painel (admin=', usingAdmin, ') test_expense_ok:', fromDb, '… pedir_nome:', pedirNome, '…')
  }
  return merged
}

/** Aplica substituições {nome}, {categoria}, {valor}, {dashboardUrl}, R${valor} → R$X.XX */
export function applyFlowReplacements(
  template: string,
  replacements: { nome?: string; categoria?: string; valor?: number; dashboardUrl?: string }
): string {
  let out = template
  if (replacements.nome != null) out = out.replace(/\{nome\}/g, replacements.nome)
  if (replacements.categoria != null) out = out.replace(/\{categoria\}/g, replacements.categoria)
  if (replacements.dashboardUrl != null) out = out.replace(/\{dashboardUrl\}/g, replacements.dashboardUrl)
  if (replacements.valor != null) {
    out = out.replace(/\{valor\}/g, replacements.valor.toFixed(2))
    out = out.replace(/\R\$\{valor\}/g, `R$${replacements.valor.toFixed(2)}`)
  }
  return out
}
