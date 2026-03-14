/**
 * PLEN — Orquestrador: estado + intent + regras de negócio → resposta na fila
 * Nunca envia direto; sempre enqueue. Respeita anti-loop.
 */

import type { PlenState } from '../state/user-state-manager'
import {
  getOrCreatePlenState,
  setPlenState,
  markUserReplied,
  incrementConsecutiveBotReplies,
  blockUntil,
  isBlocked,
  CONSECUTIVE_BOT_REPLIES_LIMIT,
} from '../state/user-state-manager'
import { enqueuePlenMessage } from '../queue/message-queue'
import { routeIntent } from '../ai/intent-router'
import { getQuestionReply } from '../ai/question-handler'
import { logPlenInteraction, getPlenRegistroCount } from '../interaction/interaction-logs'
import { createPlenLembrete } from '../lembretes/plen-lembretes'
import { updateContact, getContactById } from '@/lib/crm/contacts'
import { createUserAndSendCode, verifyCodeForPlen, resendCodeForPlen } from '../auth/email-verification'
import { getAssistenteGlobalPausada } from '@/lib/assistente-global-pausada'
import { getPlenFlowMessages, applyFlowReplacements, type PlenFlowMessages } from '../flow-messages'
import { sendWhatsAppButtonReply } from '@/lib/whatsapp/sender'

const MENU_GLOBAL_DEFAULT = `1️⃣ Falar com humano
2️⃣ Como funciona
3️⃣ Assinatura R$9,90
4️⃣ Funções plano premium
5️⃣ Indique e ganhe
6️⃣ Total / saldo`

const MENSAGEM_NEW_LEAD_DEFAULT = (nome: string) => `Olá ${nome}! 💙

Eu sou a Plen, sua assistente financeira no WhatsApp.

Vamos fazer um teste rápido.

Envie um gasto para eu registrar.

Exemplo:
Café 12 ☕`

const MENSAGEM_NEW_LEAD = MENSAGEM_NEW_LEAD_DEFAULT

const FRASES_GASTO_REGISTRADO = [
  (nome: string) => `Perfeito ${nome}! Já registrei aqui 💙`,
  (nome: string) => `Boa ${nome}! Seu gasto já está salvo 📲`,
  (nome: string) => `Muito bem ${nome}! Controle financeiro é tudo ✨`,
]

/** Confirmação do gasto no teste (onboarding). Sem link; em produção o USER_ACTIVE pode incluir link. */
const MENSAGEM_TEST_EXPENSE_OK = (nome: string, categoria: string, valor: number) =>
  `💙 Gasto registrado!

📂 Categoria: ${categoria}
💰 Valor: R$${valor.toFixed(2)}
📅 Hoje

✨ Continue assim ${nome}! ✨`

const MENSAGEM_PEDIR_FORMATO = (nome: string) => `Ops ${nome}, fiquei um pouco confusa 🥹

Envie assim para eu entender melhor:

gastei 20 com almoço
recebi 200 salário`

const MENSAGEM_PRAZER_NOME = (nome: string) =>
  `Prazer, ${nome}! 👋
Agora me diga qual é o seu email para criar sua conta.`

const MENSAGEM_EMAIL_ENVIADO = `Enviei um código de verificação para seu email.
Digite o código aqui.`

const MENSAGEM_CODIGO_INVALIDO = `Código inválido ou expirado. Verifique o email e tente novamente.`

const MENSAGEM_CONTA_CRIADA = `Conta criada com sucesso! 🎉
Agora você pode registrar seus gastos diretamente aqui.
Exemplo:
Almoço 35`

const MENSAGEM_TUTORIAL = `Agora você pode registrar gastos assim:

gastei 50 com mercado
recebi 2000 salário
oficina 350

Você também pode enviar:

🎤 áudio
📸 foto
📄 comprovante

Eu consigo registrar tudo para você.`

const LIMITE_REGISTROS_GRATUITOS = 10

const MENSAGEM_PLANO_GRATUITO_LIMITE = (nome: string) =>
  `${nome}, você está usando o plano gratuito 💙

Já registrou ${LIMITE_REGISTROS_GRATUITOS} gastos!

Tenho um presente para você 🎁

Plano básico que custa R$49,90 está disponível para você por apenas R$9,90.`

const MENSAGEM_LEMBRETE_SALVO = (dataFmt: string, descricao: string) =>
  `Lembrete salvo! 📅 Te aviso no dia ${dataFmt}: ${descricao}`

const MENSAGEM_PEDIR_NOME = `Por favor, me diga seu nome (pelo menos 2 letras, sem números).`

/** Quando o lead manda frase em vez do nome (ex.: "Olá! Quero utilizar a Plenipay"). */
const MENSAGEM_NAO_E_NOME = `Isso não parece um nome. 😊 Por favor, me diga apenas seu nome (ex.: Maria ou João Silva).`

/** Quando o usuário pede para alterar/trocar o nome. */
const MENSAGEM_PEDIR_NOVO_NOME = `Beleza! Me diga seu novo nome (ex.: Maria ou João Silva).`

const MENSAGEM_PEDIR_EMAIL = `Por favor, me envie um email válido para criar sua conta.`

const MENSAGEM_EMAIL_JA_CADASTrado = `Este email já está cadastrado. Use outro email ou faça login no site.`

/** Detecta pedido de alterar/trocar/mudar nome. */
function isPedidoAlterarNome(text: string): boolean {
  return /alterar\s+nome|trocar\s+nome|mudar\s+nome|quero\s+(alterar|trocar|mudar)\s+nome/i.test(text.trim())
}

/** Detecta pedido de cancelar/desistir do cadastro (em WAITING_EMAIL / WAITING_CODE). */
function isPedidoCancelar(text: string): boolean {
  return /^cancelar\s*$/i.test(text.trim()) || /cancelar\s+cadastro|desistir|quero\s+cancelar/i.test(text.trim())
}

/** Detecta pedido de reenviar código (email não chegou, reenviar código, etc.). */
function isPedidoReenviarCodigo(text: string): boolean {
  const t = text.trim().toLowerCase()
  return (
    /e-?mail\s+n[aã]o\s+chegou|n[aã]o\s+chegou|n[aã]o\s+recebi|reenviar\s+c[oó]digo|reenviar\s+email|re(enviar|sendar)/i.test(t) ||
    t === 'reenviar código' ||
    t === 'reenviar codigo'
  )
}

/** Padrões que indicam que o texto NÃO é um nome. */
const NAO_E_NOME_PATTERNS = [
  /quero\s+(utilizar|usar)/i,
  /utilizar\s+(a\s+)?plen/i,
  /plenipay|plen\s*pay/i,
  /cadastr|conta|criar/i,
  /ol[aá]\s*!?/i,
  /^oi\s*!?$/i,
  /bom\s+dia|boa\s+tarde|boa\s+noite/i,
  /preciso\s+(de|pagar|receber)/i,
  /como\s+funciona|me\s+ajuda/i,
  /trocar\s+nome|mudar\s+nome|alterar\s+nome|quero\s+(alterar|trocar|mudar)\s+nome/i,
  /^cancelar\s*$/i,
  /cancelar\s+cadastro|desistir|quero\s+cancelar/i,
  /[!?]{2,}/,
  /^\d+$/,
]

/** Valida nome: 2–50 caracteres, sem números, não é frase/saudação/cadastro. */
function isValidName(text: string): boolean {
  const t = text.trim()
  if (t.length < 2 || t.length > 50) return false
  if (/\d/.test(t)) return false
  const words = t.split(/\s+/)
  if (words.length > 4) return false
  if (NAO_E_NOME_PATTERNS.some((r) => r.test(t))) return false
  if (/[!?]/.test(t) && words.length > 1) return false
  return true
}

/** Valida email básico. */
function isValidEmail(text: string): boolean {
  const t = text.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

/** Código 6 dígitos. */
function isCode(text: string): boolean {
  return /^\d{6}$/.test(text.replace(/\s/g, ''))
}

export interface PlenHandlerResult {
  replied: boolean
  reason?: string
}

/**
 * Processa mensagem recebida do usuário: estado + intent + regras → enfileira resposta.
 * Retorna se uma resposta foi enfileirada (ou se foi ignorada por pause/block/anti-loop).
 * Se flowFromPanel for passado (ex.: pelo webhook), ele é a ÚNICA fonte das mensagens do painel; senão chama getPlenFlowMessages().
 */
export async function handlePlenIncomingMessage(
  contactId: string,
  messageText: string,
  flowFromPanel?: PlenFlowMessages
): Promise<PlenHandlerResult> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[plen-handler] start', { contactId, text: (messageText || '').slice(0, 30) })
  }
  const text = (messageText || '').trim()
  if (!text) return { replied: false, reason: 'empty' }

  const paused = await getAssistenteGlobalPausada()
  if (process.env.NODE_ENV === 'development') {
    console.log('[plen-handler] assistente_pausada?', paused)
  }
  if (paused) return { replied: false, reason: 'assistente_pausada' }

  const stateRow = await getOrCreatePlenState(contactId)
  if (!stateRow) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[plen-handler] getOrCreatePlenState retornou null - tabela plen_user_state existe no Supabase?')
    }
    return { replied: false, reason: 'no_state' }
  }

  if (isBlocked(stateRow)) {
    return { replied: false, reason: 'blocked' }
  }

  await markUserReplied(contactId)

  const contact = await getContactById(contactId)
  const rawNome = (contact?.nome?.trim() && contact.nome.length >= 2) ? contact.nome.trim() : ''
  const nomeInvalidoParaExibicao =
    /^cancelar\s*$/i.test(rawNome) ||
    /^(desistir|oi|ol[aá]|cadastr|menu)$/i.test(rawNome) ||
    /e-?mail\s+n[aã]o\s+chegou|n[aã]o\s+recebi|reenviar\s*c[oó]digo|c[oó]digo\s+n[aã]o/i.test(rawNome) ||
    NAO_E_NOME_PATTERNS.some((r) => r.test(rawNome))
  const nome = rawNome && !nomeInvalidoParaExibicao ? rawNome : 'amigo'
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.plenipay.com'

  const flow = flowFromPanel ?? (await getPlenFlowMessages())
  const repl = (key: keyof typeof flow, opts?: { nome?: string; categoria?: string; valor?: number; dashboardUrl?: string }) => {
    const t = flow[key]
    if (t == null || typeof t !== 'string') return null
    const trimmed = (t as string).trim()
    if (!trimmed) return null
    return applyFlowReplacements(trimmed, { nome, dashboardUrl, ...opts })
  }
  /** Resolve a próxima mensagem após test_expense_ok usando messageOrder do painel (inclui mensagens customizadas do bloco Teste). */
  const getNextMessageAfterTestExpenseOk = (): { text: string; delaySec: number } => {
    const order = (flow.messageOrder?.teste ?? ['test_expense_ok', 'pedir_formato']).filter(Boolean)
    const idx = order.indexOf('test_expense_ok') + 1
    let nextKey = order[idx]
    const fallback = (flow.pedir_nome?.trim()) || MENSAGEM_PEDIR_NOME
    if (nextKey === 'pedir_formato') nextKey = '' // "Formato confuso" não é a mensagem após gasto; usar pedir_nome
    const delaySec = (nextKey && (flow.delays?.[nextKey] ?? flow.delays?.pedir_nome) != null)
      ? ((flow.delays?.[nextKey] ?? flow.delays?.pedir_nome) | 0)
      : 0
    if (!nextKey) return { text: fallback, delaySec }
    const raw = (flow as Record<string, unknown>)[nextKey]
    const str = typeof raw === 'string' ? raw.trim() : ''
    if (str) return { text: applyFlowReplacements(str, { nome, dashboardUrl }), delaySec }
    if (nextKey === 'pedir_nome') return { text: fallback, delaySec }
    return { text: fallback, delaySec }
  }
  const menuText = (flow.menu_global?.trim() || MENU_GLOBAL_DEFAULT)

  const state = stateRow.state as PlenState
  const intentResult = routeIntent(text)

  let reply = ''
  let nextState: PlenState | null = null
  let acao = ''

  if (intentResult.intent === 'menu') {
    reply = menuText
    acao = 'menu_global'
  } else if (intentResult.intent === 'cadastro' && contact?.usuario_cadastrado) {
    await setPlenState(contactId, 'USER_ACTIVE', {})
    reply = `${nome}, você já está cadastrado! 💙 Pode registrar gastos assim: Café 20\n\nDigite menu para ver todas as opções.`
    acao = 'ja_cadastrado_redirecionado'
  } else switch (state) {
    case 'NEW_LEAD':
      if (intentResult.intent === 'saudacao' || intentResult.intent === 'cadastro') {
        reply = repl('new_lead', { nome }) ?? MENSAGEM_NEW_LEAD(nome)
        nextState = 'TEST_EXPENSE'
        acao = 'welcome_test_expense'
      } else if (isPedidoAlterarNome(text)) {
        reply = MENSAGEM_PEDIR_NOVO_NOME
        nextState = 'WAITING_NAME'
        acao = 'alterar_nome_pedido'
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('NEW_LEAD')
        acao = 'pergunta_new_lead'
      } else if (intentResult.intent === 'registrar_despesa' && intentResult.valor != null) {
        const categoria = intentResult.categoria ?? 'Outros'
        const valor = intentResult.valor ?? 0
        const custom = repl('test_expense_ok', { nome, categoria, valor, dashboardUrl })
        if (custom) {
          reply = custom.replace(/\n\nVer meus registros:.*$/s, '').trim()
        } else {
          const frase = FRASES_GASTO_REGISTRADO[Math.floor(Math.random() * FRASES_GASTO_REGISTRADO.length)](nome)
          reply = `${frase}\n\n📂 Categoria: ${categoria}\n💰 Valor: R$${valor.toFixed(2)}\n📅 Hoje`
        }
        const { text: nextMsg, delaySec } = getNextMessageAfterTestExpenseOk()
        const delayMs = delaySec * 1000
        if (delayMs > 0) {
          enqueuePlenMessage(contactId, nextMsg, new Date(Date.now() + delayMs))
        } else {
          reply = `${reply}\n\n${nextMsg}`
        }
        nextState = 'WAITING_NAME'
        acao = 'test_expense_ok'
      } else {
        reply = repl('new_lead', { nome }) ?? MENSAGEM_NEW_LEAD(nome)
        nextState = 'TEST_EXPENSE'
        acao = 'retry_test'
      }
      break

    case 'TEST_EXPENSE':
      if (intentResult.intent === 'registrar_despesa' && intentResult.valor != null && intentResult.descricao) {
        const categoria = intentResult.categoria ?? 'Outros'
        const valor = intentResult.valor ?? 0
        const custom = repl('test_expense_ok', { nome, categoria, valor, dashboardUrl })
        if (custom) {
          reply = custom.replace(/\n\nVer meus registros:.*$/s, '').trim()
        } else {
          const frase = FRASES_GASTO_REGISTRADO[Math.floor(Math.random() * FRASES_GASTO_REGISTRADO.length)](nome)
          reply = `${frase}\n\n📂 Categoria: ${categoria}\n💰 Valor: R$${valor.toFixed(2)}\n📅 Hoje`
        }
        const { text: nextMsg, delaySec } = getNextMessageAfterTestExpenseOk()
        const delayMs = delaySec * 1000
        if (delayMs > 0) {
          enqueuePlenMessage(contactId, nextMsg, new Date(Date.now() + delayMs))
        } else {
          reply = `${reply}\n\n${nextMsg}`
        }
        nextState = 'WAITING_NAME'
        acao = 'test_expense_ok'
      } else if (intentResult.intent === 'saudacao' || intentResult.intent === 'cadastro') {
        reply = repl('new_lead', { nome }) ?? MENSAGEM_NEW_LEAD(nome)
        acao = 'welcome_again'
      } else if (isPedidoAlterarNome(text)) {
        await setPlenState(contactId, 'WAITING_NAME', {})
        reply = MENSAGEM_PEDIR_NOVO_NOME
        acao = 'alterar_nome_pedido'
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('TEST_EXPENSE')
        acao = 'pergunta_test'
      } else {
        reply =
          (flow.ia_regras?.trim()
            ? applyFlowReplacements(flow.ia_regras, { nome })
            : (repl('pedir_formato', { nome }) ?? MENSAGEM_PEDIR_FORMATO(nome))) as string
        acao = 'pedir_formato'
      }
      break

    case 'WAITING_NAME': {
      const querCancelarOuSaudacaoOuCadastro =
        isPedidoCancelar(text) ||
        intentResult.intent === 'saudacao' ||
        intentResult.intent === 'cadastro'
      if (querCancelarOuSaudacaoOuCadastro) {
        if (contact?.usuario_cadastrado) {
          nextState = 'USER_ACTIVE'
          await setPlenState(contactId, 'USER_ACTIVE')
          reply = `Você já está cadastrado! 💙 Pode registrar gastos aqui. Exemplo: Almoço 35`
          acao = 'ja_cadastrado_volta_active'
        } else {
          nextState = 'NEW_LEAD'
          await setPlenState(contactId, 'NEW_LEAD', {})
          reply = `Tudo bem! Vamos recomeçar. Envie um gasto para eu registrar (ex.: Café 12).`
          acao = 'reiniciar_cadastro'
        }
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('WAITING_NAME')
        acao = 'pergunta_name'
      } else if (isPedidoAlterarNome(text)) {
        reply = MENSAGEM_PEDIR_NOVO_NOME
        acao = 'alterar_nome_pedido'
      } else if ((stateRow.payload as { alterandoNome_from?: string; email?: string })?.alterandoNome_from === 'WAITING_EMAIL' && isValidName(text)) {
        const nomeUser = text.trim()
        await updateContact(contactId, { nome: nomeUser })
        await setPlenState(contactId, 'WAITING_EMAIL', { nome: nomeUser })
        reply = `Nome atualizado para ${nomeUser}! 👍 Agora me envie seu email para criar sua conta.`
        acao = 'nome_alterado_volta_email'
      } else if ((stateRow.payload as { alterandoNome_from?: string; email?: string })?.alterandoNome_from === 'WAITING_CODE' && isValidName(text)) {
        const nomeUser = text.trim()
        const email = (stateRow.payload as { email?: string }).email ?? ''
        await updateContact(contactId, { nome: nomeUser })
        await setPlenState(contactId, 'WAITING_CODE', { email, nome: nomeUser })
        reply = `Nome atualizado para ${nomeUser}! 👍 Digite o código de 6 dígitos que enviamos no seu email.`
        acao = 'nome_alterado_volta_code'
      } else if ((stateRow.payload as { alterandoNome?: boolean })?.alterandoNome && isValidName(text)) {
        const nomeUser = text.trim()
        await updateContact(contactId, { nome: nomeUser })
        await setPlenState(contactId, 'USER_ACTIVE', {})
        reply = `Nome atualizado para ${nomeUser}! 👍`
        acao = 'nome_alterado'
      } else if (isValidName(text)) {
        const nomeUser = text.trim()
        reply = repl('prazer_nome', { nome: nomeUser }) ?? MENSAGEM_PRAZER_NOME(nomeUser)
        nextState = 'WAITING_EMAIL'
        await setPlenState(contactId, 'WAITING_EMAIL', { nome: nomeUser })
        await updateContact(contactId, { nome: nomeUser })
        acao = 'nome_ok'
      } else {
        const pareceFraseOuCadastro =
          intentResult.intent === 'saudacao' ||
          intentResult.intent === 'cadastro' ||
          NAO_E_NOME_PATTERNS.some((r) => r.test(text.trim()))
        reply = pareceFraseOuCadastro
          ? MENSAGEM_NAO_E_NOME
          : ((flow.pedir_nome?.trim()) ?? MENSAGEM_PEDIR_NOME)
        acao = 'nome_invalido'
      }
      break
    }

    case 'WAITING_EMAIL': {
      const querCancelarOuSaudacaoOuCadastro =
        isPedidoCancelar(text) ||
        intentResult.intent === 'saudacao' ||
        intentResult.intent === 'cadastro'
      if (querCancelarOuSaudacaoOuCadastro) {
        if (contact?.usuario_cadastrado) {
          nextState = 'USER_ACTIVE'
          await setPlenState(contactId, 'USER_ACTIVE')
          reply = `Você já está cadastrado! 💙 Pode registrar gastos aqui. Exemplo: Almoço 35`
          acao = 'ja_cadastrado_volta_active'
        } else {
          nextState = 'NEW_LEAD'
          await setPlenState(contactId, 'NEW_LEAD', {})
          reply = `Tudo bem! Vamos recomeçar. Envie um gasto para eu registrar (ex.: Café 12).`
          acao = 'reiniciar_cadastro'
        }
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('WAITING_EMAIL')
        acao = 'pergunta_email'
      } else if (isPedidoAlterarNome(text)) {
        await setPlenState(contactId, 'WAITING_NAME', { alterandoNome_from: 'WAITING_EMAIL' })
        reply = MENSAGEM_PEDIR_NOVO_NOME
        acao = 'alterar_nome_pedido'
      } else if (isValidEmail(text)) {
        const email = text.trim().toLowerCase()
        const nome = (stateRow.payload as { nome?: string })?.nome ?? ''
        const result = await createUserAndSendCode(email, nome || 'Usuário')
        if (!result.success) {
          reply = result.error?.includes('já') ? ((flow.email_ja_cadastrado?.trim()) ?? MENSAGEM_EMAIL_JA_CADASTrado) : ((flow.pedir_email?.trim()) ?? MENSAGEM_PEDIR_EMAIL)
          acao = 'email_error'
        } else {
          reply =
            result.alreadyRegisteredNotConfirmed
              ? 'Esse email já está cadastrado mas não foi confirmado. Acabei de reenviar o código para confirmar. Me diga o código aqui.'
              : ((flow.email_enviado?.trim()) ?? MENSAGEM_EMAIL_ENVIADO)
          nextState = 'WAITING_CODE'
          await setPlenState(contactId, 'WAITING_CODE', { email })
          await updateContact(contactId, { email, status: 'aguardando_codigo' })
          acao = result.alreadyRegisteredNotConfirmed ? 'email_ja_cadastrado_reenviado' : 'email_enviado'
          sendWhatsAppButtonReply(
            contactId,
            'Não recebeu o email? Clique no botão abaixo para reenviar o código:',
            'Reenviar código'
          ).catch(() => {})
        }
      } else {
        reply = (flow.pedir_email?.trim()) ?? MENSAGEM_PEDIR_EMAIL
        acao = 'email_invalido'
      }
      break
    }

    case 'WAITING_CODE': {
      const querCancelarOuSaudacaoOuCadastro =
        isPedidoCancelar(text) ||
        intentResult.intent === 'saudacao' ||
        intentResult.intent === 'cadastro'
      if (querCancelarOuSaudacaoOuCadastro) {
        if (contact?.usuario_cadastrado) {
          nextState = 'USER_ACTIVE'
          await setPlenState(contactId, 'USER_ACTIVE')
          reply = `Você já está cadastrado! 💙 Pode registrar gastos aqui. Exemplo: Almoço 35`
          acao = 'ja_cadastrado_volta_active'
        } else {
          nextState = 'NEW_LEAD'
          await setPlenState(contactId, 'NEW_LEAD', {})
          reply = `Tudo bem! Vamos recomeçar. Envie um gasto para eu registrar (ex.: Café 12).`
          acao = 'reiniciar_cadastro'
        }
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('WAITING_CODE')
        acao = 'pergunta_code'
      } else if (isPedidoReenviarCodigo(text)) {
        const email = (stateRow.payload as { email?: string })?.email ?? ''
        if (!email) {
          reply = `Não encontrei seu email. Por favor, me envie seu email de novo para eu reenviar o código.`
          acao = 'reenviar_sem_email'
        } else {
          const res = await resendCodeForPlen(email)
          if (res.success) {
            reply = `Reenviei o código para ${email}. Confira a caixa de entrada e o spam. Digite o código aqui.`
            acao = 'codigo_reenviado'
            sendWhatsAppButtonReply(
              contactId,
              'Não recebeu? Clique no botão abaixo para reenviar o código:',
              'Reenviar código'
            ).catch(() => {})
          } else {
            const msgErro =
              res.error && !/smtp|host|porta|587|465|conexão|conexao|connection|timeout|etimedout|eauth|verifique/i.test(res.error)
                ? res.error
                : null
            reply = msgErro
              ? `Não consegui reenviar agora (${msgErro}). Tente em instantes ou confira se o email está correto.`
              : 'Não consegui reenviar agora. Tente em instantes ou confira se o email está correto.'
            acao = 'reenviar_erro'
          }
        }
      } else if (isPedidoAlterarNome(text)) {
        const email = (stateRow.payload as { email?: string })?.email ?? ''
        await setPlenState(contactId, 'WAITING_NAME', { alterandoNome_from: 'WAITING_CODE', email })
        reply = MENSAGEM_PEDIR_NOVO_NOME
        acao = 'alterar_nome_pedido'
      } else if (isCode(text)) {
        const email = (stateRow.payload as { email?: string })?.email ?? ''
        const result = await verifyCodeForPlen(text, email)
        if (!result.success) {
          reply = (flow.codigo_invalido?.trim()) ?? MENSAGEM_CODIGO_INVALIDO
          acao = 'codigo_invalido'
        } else {
          reply = (flow.conta_criada?.trim()) ?? MENSAGEM_CONTA_CRIADA
          nextState = 'USER_ACTIVE'
          await setPlenState(contactId, 'USER_ACTIVE')
          await updateContact(contactId, { status: 'usuario_ativo', usuario_cadastrado: true, data_cadastro: new Date().toISOString() })
          acao = 'conta_criada'
          const tutorialText = (flow.tutorial?.trim()) ?? MENSAGEM_TUTORIAL
          const tutorialDelayMs = ((flow.delays?.tutorial ?? 6) | 0) * 1000
          await enqueuePlenMessage(contactId, tutorialText, new Date(Date.now() + tutorialDelayMs))
        }
      } else {
        reply = `Digite o código de 6 dígitos que enviamos para seu email.`
        acao = 'codigo_formato'
      }
      break
    }

    case 'USER_ACTIVE':
      if (intentResult.intent === 'registrar_despesa' || intentResult.intent === 'registrar_receita') {
        const count = await getPlenRegistroCount(contactId, contact?.data_cadastro ?? undefined)
        if (count >= LIMITE_REGISTROS_GRATUITOS) {
          reply = repl('limite_plano', { nome }) ?? MENSAGEM_PLANO_GRATUITO_LIMITE(nome)
          acao = 'limite_plano_gratuito'
        } else {
          acao = 'registro_gasto_ativo'
          const categoria = intentResult.categoria ?? 'Outros'
          const valor = intentResult.valor ?? 0
          const custom = repl('test_expense_ok', { nome, categoria, valor, dashboardUrl })
          if (custom) {
            reply = custom
          } else {
            const frases = Array.isArray(flow.frases_gasto) && flow.frases_gasto.length > 0
              ? flow.frases_gasto
              : FRASES_GASTO_REGISTRADO.map((f) => f(nome))
            const frase = frases[Math.floor(Math.random() * frases.length)]
            const fraseFinal = typeof frase === 'string' ? applyFlowReplacements(frase, { nome }) : frase
            reply = `💙 Gasto registrado!\n\n${fraseFinal}\n\n📂 Categoria: ${categoria}\n💰 Valor: R$${valor.toFixed(2)}\n📅 Hoje\n\nVer meus registros: ${dashboardUrl}`
          }
        }
      } else if (intentResult.intent === 'lembrete_pagar' || intentResult.intent === 'lembrete_receber') {
        const tipo = intentResult.intent === 'lembrete_pagar' ? 'pagar' : 'receber'
        const dataLembrete = intentResult.dataLembrete ?? ''
        const descricao = intentResult.descricaoLembrete ?? (tipo === 'pagar' ? 'Pagamento' : 'Recebimento')
        const id = await createPlenLembrete(contactId, tipo, dataLembrete, descricao)
        if (id) {
          const [y, m, d] = dataLembrete.split('-')
          const dataFmt = d && m && y ? `${d}/${m}/${y}` : dataLembrete
          reply = MENSAGEM_LEMBRETE_SALVO(dataFmt, descricao)
          acao = 'lembrete_criado'
        } else {
          reply = `Não consegui salvar o lembrete, ${nome}. Tente de novo.`
          acao = 'lembrete_erro'
        }
      } else if (intentResult.intent === 'consultar_saldo' || intentResult.intent === 'consultar_mes') {
        reply = `${nome}, você pode ver seu total e saldo no painel: ${dashboardUrl}`
        acao = 'consulta_saldo'
      } else if (isPedidoAlterarNome(text)) {
        await setPlenState(contactId, 'WAITING_NAME', { alterandoNome: true })
        reply = MENSAGEM_PEDIR_NOVO_NOME
        acao = 'alterar_nome_iniciado'
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('USER_ACTIVE')
        acao = 'pergunta_active'
      } else {
        reply =
          (flow.ia_regras?.trim()
            ? applyFlowReplacements(flow.ia_regras, { nome })
            : (repl('pedir_formato', { nome }) ?? MENSAGEM_PEDIR_FORMATO(nome))) as string
        acao = 'formato_active'
      }
      break

    default:
      reply = repl('new_lead', { nome }) ?? MENSAGEM_NEW_LEAD(nome)
      nextState = 'TEST_EXPENSE'
      acao = 'fallback'
  }

  if (nextState) await setPlenState(contactId, nextState)

  const consecutive = await incrementConsecutiveBotReplies(contactId)
  if (consecutive != null && consecutive >= CONSECUTIVE_BOT_REPLIES_LIMIT) {
    await blockUntil(contactId, new Date(Date.now() + 5 * 60 * 1000))
  }

  if (process.env.NODE_ENV === 'development' && reply) {
    console.log('[plen-handler] Resposta que será enfileirada (início):', reply.slice(0, 220).replace(/\n/g, ' '))
  }
  const enqueued = await enqueuePlenMessage(contactId, reply)
  if (reply && !enqueued && process.env.NODE_ENV === 'development') {
    console.warn('[plen-handler] Fila não aceitou a mensagem (createAdminClient pode ser null). Defina SUPABASE_SERVICE_ROLE_KEY no .env.local.')
  }
  await logPlenInteraction({
    contact_id: contactId,
    mensagem_recebida: text.slice(0, 500),
    estado_usuario: state,
    intent_detectada: intentResult.intent,
    acao_executada: acao,
    resposta_enviada: reply.slice(0, 500),
  })

  return { replied: true, reason: acao || undefined }
}
