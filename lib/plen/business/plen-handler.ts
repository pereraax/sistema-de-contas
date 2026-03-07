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
import { logPlenInteraction } from '../interaction/interaction-logs'
import { updateContact, getContactById } from '@/lib/crm/contacts'
import { createUserAndSendCode, verifyCodeForPlen } from '../auth/email-verification'
import { getAssistenteGlobalPausada } from '@/lib/assistente-global-pausada'

const MENU_GLOBAL = `1️⃣ Falar com humano
2️⃣ Como funciona
3️⃣ Assinatura R$9,90
4️⃣ Funções plano premium
5️⃣ Indique e ganhe
6️⃣ Total / saldo`

const MENSAGEM_NEW_LEAD = (nome: string) => `Olá ${nome}! 💙

Eu sou a Plen, sua assistente financeira no WhatsApp.

Vamos fazer um teste rápido.

Envie um gasto para eu registrar.

Exemplo:
Café 12 ☕`

const FRASES_GASTO_REGISTRADO = [
  (nome: string) => `Perfeito ${nome}! Já registrei aqui 💙`,
  (nome: string) => `Boa ${nome}! Seu gasto já está salvo 📲`,
  (nome: string) => `Muito bem ${nome}! Controle financeiro é tudo ✨`,
]

const MENSAGEM_TEST_EXPENSE_OK = (nome: string, categoria: string, valor: number, dashboardUrl: string) =>
  `💙 Gasto registrado!

📂 Categoria: ${categoria}
💰 Valor: R$${valor.toFixed(2)}
📅 Hoje

✨ Continue assim ${nome}! ✨

Ver meus registros: ${dashboardUrl}`

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

const MENSAGEM_PEDIR_NOME = `Por favor, me diga seu nome (pelo menos 2 letras, sem números).`

const MENSAGEM_PEDIR_EMAIL = `Por favor, me envie um email válido para criar sua conta.`

const MENSAGEM_EMAIL_JA_CADASTrado = `Este email já está cadastrado. Use outro email ou faça login no site.`

/** Valida nome: mínimo 2 caracteres, sem números. */
function isValidName(text: string): boolean {
  const t = text.trim()
  if (t.length < 2) return false
  return !/\d/.test(t)
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
 */
export async function handlePlenIncomingMessage(
  contactId: string,
  messageText: string
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
  const nome = (contact?.nome?.trim() && contact.nome.length >= 2) ? contact.nome : 'amigo'
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.plenipay.com'

  const state = stateRow.state as PlenState
  const intentResult = routeIntent(text)

  let reply = ''
  let nextState: PlenState | null = null
  let acao = ''

  if (intentResult.intent === 'menu') {
    reply = MENU_GLOBAL
    acao = 'menu_global'
  } else switch (state) {
    case 'NEW_LEAD':
      if (intentResult.intent === 'saudacao' || intentResult.intent === 'cadastro') {
        reply = MENSAGEM_NEW_LEAD(nome)
        nextState = 'TEST_EXPENSE'
        acao = 'welcome_test_expense'
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('NEW_LEAD')
        acao = 'pergunta_new_lead'
      } else if (intentResult.intent === 'registrar_despesa' && intentResult.valor != null) {
        const frase = FRASES_GASTO_REGISTRADO[Math.floor(Math.random() * FRASES_GASTO_REGISTRADO.length)](nome)
        reply = `${frase}\n\n📂 Categoria: ${intentResult.categoria ?? 'Outros'}\n💰 Valor: R$${(intentResult.valor ?? 0).toFixed(2)}\n📅 Hoje\n\nVer meus registros: ${dashboardUrl}`
        nextState = 'WAITING_NAME'
        acao = 'test_expense_ok'
      } else {
        reply = MENSAGEM_NEW_LEAD(nome)
        nextState = 'TEST_EXPENSE'
        acao = 'retry_test'
      }
      break

    case 'TEST_EXPENSE':
      if (intentResult.intent === 'registrar_despesa' && intentResult.valor != null && intentResult.descricao) {
        const frase = FRASES_GASTO_REGISTRADO[Math.floor(Math.random() * FRASES_GASTO_REGISTRADO.length)](nome)
        reply = `${frase}\n\n📂 Categoria: ${intentResult.categoria ?? 'Outros'}\n💰 Valor: R$${(intentResult.valor ?? 0).toFixed(2)}\n📅 Hoje\n\nVer meus registros: ${dashboardUrl}`
        nextState = 'WAITING_NAME'
        acao = 'test_expense_ok'
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('TEST_EXPENSE')
        acao = 'pergunta_test'
      } else {
        reply = MENSAGEM_PEDIR_FORMATO(nome)
        acao = 'pedir_formato'
      }
      break

    case 'WAITING_NAME':
      if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('WAITING_NAME')
        acao = 'pergunta_name'
      } else if (isValidName(text)) {
        const nome = text.trim()
        reply = MENSAGEM_PRAZER_NOME(nome)
        nextState = 'WAITING_EMAIL'
        await setPlenState(contactId, 'WAITING_EMAIL', { nome })
        await updateContact(contactId, { nome })
        acao = 'nome_ok'
      } else {
        reply = MENSAGEM_PEDIR_NOME
        acao = 'nome_invalido'
      }
      break

    case 'WAITING_EMAIL':
      if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('WAITING_EMAIL')
        acao = 'pergunta_email'
      } else if (isValidEmail(text)) {
        const email = text.trim().toLowerCase()
        const nome = (stateRow.payload as { nome?: string })?.nome ?? ''
        const result = await createUserAndSendCode(email, nome || 'Usuário')
        if (!result.success) {
          reply = result.error?.includes('já') ? MENSAGEM_EMAIL_JA_CADASTrado : MENSAGEM_PEDIR_EMAIL
          acao = 'email_error'
        } else {
          reply = MENSAGEM_EMAIL_ENVIADO
          nextState = 'WAITING_CODE'
          await setPlenState(contactId, 'WAITING_CODE', { email })
          await updateContact(contactId, { email, status: 'aguardando_codigo' })
          acao = 'email_enviado'
        }
      } else {
        reply = MENSAGEM_PEDIR_EMAIL
        acao = 'email_invalido'
      }
      break

    case 'WAITING_CODE':
      if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('WAITING_CODE')
        acao = 'pergunta_code'
      } else if (isCode(text)) {
        const email = (stateRow.payload as { email?: string })?.email ?? ''
        const result = await verifyCodeForPlen(text, email)
        if (!result.success) {
          reply = MENSAGEM_CODIGO_INVALIDO
          acao = 'codigo_invalido'
        } else {
          reply = MENSAGEM_CONTA_CRIADA
          nextState = 'USER_ACTIVE'
          await setPlenState(contactId, 'USER_ACTIVE')
          await updateContact(contactId, { status: 'usuario_ativo', usuario_cadastrado: true, data_cadastro: new Date().toISOString() })
          acao = 'conta_criada'
          await enqueuePlenMessage(contactId, MENSAGEM_TUTORIAL, new Date(Date.now() + 6000))
        }
      } else {
        reply = `Digite o código de 6 dígitos que enviamos para seu email.`
        acao = 'codigo_formato'
      }
      break

    case 'USER_ACTIVE':
      if (intentResult.intent === 'registrar_despesa' || intentResult.intent === 'registrar_receita') {
        acao = 'registro_gasto_ativo'
        const frase = FRASES_GASTO_REGISTRADO[Math.floor(Math.random() * FRASES_GASTO_REGISTRADO.length)](nome)
        reply = `💙 Gasto registrado!\n\n${frase}\n\n📂 Categoria: ${intentResult.categoria ?? 'Outros'}\n💰 Valor: R$${(intentResult.valor ?? 0).toFixed(2)}\n📅 Hoje\n\nVer meus registros: ${dashboardUrl}`
      } else if (intentResult.intent === 'consultar_saldo' || intentResult.intent === 'consultar_mes') {
        reply = `${nome}, você pode ver seu total e saldo no painel: ${dashboardUrl}`
        acao = 'consulta_saldo'
      } else if (intentResult.intent === 'pergunta') {
        reply = getQuestionReply('USER_ACTIVE')
        acao = 'pergunta_active'
      } else {
        reply = MENSAGEM_PEDIR_FORMATO(nome)
        acao = 'formato_active'
      }
      break

    default:
      reply = MENSAGEM_NEW_LEAD(nome)
      nextState = 'TEST_EXPENSE'
      acao = 'fallback'
  }

  if (nextState) await setPlenState(contactId, nextState)

  const consecutive = await incrementConsecutiveBotReplies(contactId)
  if (consecutive != null && consecutive >= CONSECUTIVE_BOT_REPLIES_LIMIT) {
    await blockUntil(contactId, new Date(Date.now() + 5 * 60 * 1000))
  }

  await enqueuePlenMessage(contactId, reply)
  await logPlenInteraction({
    contact_id: contactId,
    mensagem_recebida: text.slice(0, 500),
    estado_usuario: state,
    intent_detectada: intentResult.intent,
    acao_executada: acao,
    resposta_enviada: reply.slice(0, 500),
  })

  return { replied: true }
}
