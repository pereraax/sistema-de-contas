/**
 * Lógica compartilhada para enviar as 2 mensagens de boas-vindas ("quero utilizar a plenipay").
 * (1) Oi, sou a Plen; (2) Passos + botões CADASTRAR (URL) e JÁ CRIEI (REPLY) na mesma mensagem.
 * Provedor: Z-API (z-api.io). API Fácil como fallback.
 */

import { sendTextMessage as apifacilSendText, sendReplyButtons, sendCustomButtons as apifacilSendCustomButtons } from '@/lib/whatsapp-apifacil'
import {
  sendTextMessage as zapiSendText,
  sendButtonActions,
  isZapiConfigured,
} from '@/lib/whatsapp-zapi'
import { registerSentMessage } from '@/lib/whatsapp-plen-handler'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 2 mensagens: (1) intro, (2) passos + botão CADASTRAR (URL) e botão JÁ CRIEI (REPLY) na mesma mensagem. */
export type BoasVindasItem =
  | string
  | { type: 'button_actions'; body: string; buttonActions: ({ type: 'URL'; url: string; label: string } | { type: 'REPLY'; label: string; id?: string })[] }
  | { type: 'buttons'; body: string; buttons: { id: string; title: string; url?: string }[] }

const INTRO_SEM_NOME = `Oi! 👋 Sou a Plen, sua assistente financeira. Vou te ajudar a organizar gastos e receitas direto pelo WhatsApp 💙`

export const MENSAGENS_BOAS_VINDAS: BoasVindasItem[] = [
  INTRO_SEM_NOME,
  {
    type: 'button_actions' as const,
    body: 'Antes de começar a registrar seus gastos:\n\n1️⃣ Salve meu contato\n2️⃣ Crie sua conta — é rápido, prometo! 😊\n\nToque em *CADASTRAR* para abrir o site ou em *JÁ CRIEI* se já tem conta que eu peço seu e-mail e te libero aqui. 💙',
    buttonActions: [
      { type: 'URL', url: 'https://plenipay.com', label: 'CADASTRAR' },
      { type: 'REPLY', label: 'JÁ CRIEI', id: 'ja_cadastrei' },
    ],
  },
]

const CADASTRO_URL = 'https://plenipay.com'
const FALLBACK_LINK_MSG = `Antes de começar:\n1️⃣ Salve meu contato\n2️⃣ Crie sua conta: ${CADASTRO_URL}\n\nDigite *CADASTRAR* para o link ou *JÁ CRIEI* que eu peço seu e-mail.`

/** Provedor de boas-vindas: só Z-API (API Fácil não é mais usada neste fluxo). */
export function getBoasVindasProvider(): 'zapi' | 'apifacil' | null {
  if (isZapiConfigured()) return 'zapi'
  return null
}

/** True se Z-API está configurada (único provedor em uso para boas-vindas). */
export function isBoasVindasConfigured(): boolean {
  return isZapiConfigured()
}

/** Primeira mensagem de intro, com nome do contato quando disponível. (Exportada para fallback no webhook.) */
export function getIntroBoasVindas(contactName?: string | null): string {
  if (contactName && contactName.trim()) {
    const name = contactName.trim().slice(0, 50)
    return `Oiii! ${name} 💙✨ Sou a Plen, sua assistente financeira. Vou te ajudar a organizar gastos e receitas direto pelo WhatsApp 💙`
  }
  return INTRO_SEM_NOME
}

/** Envia 2 mensagens via Z-API: (1) intro, (2) passos + botões CADASTRAR (URL) e JÁ CRIEI (REPLY) na mesma mensagem. */
async function sendBoasVindasViaZapi(phone: string, contactName?: string | null): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < MENSAGENS_BOAS_VINDAS.length; i++) {
    const msg = MENSAGENS_BOAS_VINDAS[i]
    if (typeof msg === 'string') {
      const text = i === 0 ? getIntroBoasVindas(contactName) : msg
      const send = await zapiSendText(phone, text)
      if (!send.success) return { success: false, error: send.error }
      registerSentMessage(phone, text)
    } else if (msg.type === 'button_actions') {
      const send = await sendButtonActions(phone, msg.body, msg.buttonActions)
      if (!send.success) {
        const fallback = await zapiSendText(phone, FALLBACK_LINK_MSG)
        if (!fallback.success) return { success: false, error: send.error || fallback.error }
        registerSentMessage(phone, FALLBACK_LINK_MSG)
      } else {
        registerSentMessage(phone, `${msg.body} [botões CADASTRAR / JÁ CRIEI]`)
      }
    } else if (msg.type === 'buttons' && msg.buttons?.length) {
      const replyActions = msg.buttons.map((b) => ({ type: 'REPLY' as const, label: b.title, id: b.id }))
      const send = await sendButtonActions(phone, msg.body, replyActions)
      if (!send.success) {
        const fallback = await zapiSendText(phone, msg.body + '\n\nDigite *JÁ CRIEI* que eu peço seu e-mail.')
        if (!fallback.success) return { success: false, error: send.error || fallback.error }
        registerSentMessage(phone, msg.body)
      } else {
        registerSentMessage(phone, `${msg.body} [${msg.buttons.map((b) => b.title).join(' / ')}]`)
      }
    }
    if (i < MENSAGENS_BOAS_VINDAS.length - 1) await delay(300)
  }
  return { success: true }
}

/** Envia 2 mensagens via API Fácil (intro + uma mensagem com botões CADASTRAR e JÁ CRIEI). */
async function sendBoasVindasViaApifacil(phone: string): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < MENSAGENS_BOAS_VINDAS.length; i++) {
    const msg = MENSAGENS_BOAS_VINDAS[i]
    if (typeof msg === 'string') {
      const send = await apifacilSendText(phone, msg)
      if (!send.success) return { success: false, error: send.error }
      registerSentMessage(phone, msg)
    } else if (msg.type === 'button_actions') {
      const btns = msg.buttonActions.map((a) =>
        a.type === 'URL' && 'url' in a
          ? { id: a.label.toLowerCase().replace(/\s+/g, '_'), title: a.label, url: a.url }
          : { id: ('id' in a && a.id) || 'ja_cadastrei', title: a.label }
      )
      const send = await apifacilSendCustomButtons(phone, msg.body, btns)
      if (send.success) registerSentMessage(phone, `${msg.body} [botões CADASTRAR / JÁ CRIEI]`)
      else {
        const fallback = await apifacilSendText(phone, msg.body + '\n\n' + CADASTRO_URL + '\n\nDigite *JÁ CRIEI* que eu peço seu e-mail.')
        if (!fallback.success) return { success: false, error: send.error || fallback.error }
        registerSentMessage(phone, msg.body)
      }
    } else if (msg.type === 'buttons' && msg.buttons?.length) {
      const send = await sendReplyButtons(phone, msg.body, msg.buttons.map((b) => ({ id: b.id, title: b.title })))
      if (send.success) registerSentMessage(phone, `${msg.body}\n\n${msg.buttons.map((b) => b.title).join(' / ')}`)
      else {
        const fallback = await apifacilSendText(phone, msg.body + '\n\nDigite *JÁ CRIEI* que eu peço seu e-mail.')
        if (!fallback.success) return { success: false, error: send.error || fallback.error }
        registerSentMessage(phone, msg.body)
      }
    }
    if (i < MENSAGENS_BOAS_VINDAS.length - 1) await delay(400)
  }
  return { success: true }
}

/** Envia apenas UMA mensagem de boas-vindas (índice 1 = intro, 2 = botões CADASTRAR + JÁ CRIEI). Índice 3 = mesmo que 2 (compatibilidade). */
export async function sendBoasVindasSingleMessage(
  phone: string,
  index: 1 | 2 | 3
): Promise<{ success: boolean; error?: string }> {
  const provider = getBoasVindasProvider()
  if (!provider) return { success: false, error: 'Nenhum provedor configurado (Z-API ou API Fácil).' }
  const msgIndex = index === 3 ? 1 : index - 1
  const msg = MENSAGENS_BOAS_VINDAS[msgIndex]
  if (typeof msg === 'string') {
    const send = provider === 'zapi' ? await zapiSendText(phone, msg) : await apifacilSendText(phone, msg)
    if (!send.success) return { success: false, error: send.error }
    registerSentMessage(phone, msg)
    return { success: true }
  }
  if (msg.type === 'button_actions') {
    if (provider === 'zapi') {
      const send = await sendButtonActions(phone, msg.body, msg.buttonActions)
      if (send.success) {
        registerSentMessage(phone, `${msg.body} [botão CADASTRAR]`)
        return { success: true }
      }
      const fallback = await zapiSendText(phone, FALLBACK_LINK_MSG)
      return fallback.success ? { success: true } : { success: false, error: send.error || fallback.error }
    }
    const btns = msg.buttonActions.map((a) => ({ id: a.label.toLowerCase().replace(/\s+/g, '_'), title: a.label, url: a.url }))
    const send = await apifacilSendCustomButtons(phone, msg.body, btns)
    if (send.success) {
      registerSentMessage(phone, `${msg.body} [botão CADASTRAR]`)
      return { success: true }
    }
    const fallback = await apifacilSendText(phone, msg.body + '\n\n' + CADASTRO_URL)
    return fallback.success ? { success: true } : { success: false, error: send.error || fallback.error }
  }
  const block = msg
  if (provider === 'zapi') {
    const replyActions = (block.buttons || []).map((b) => ({ type: 'REPLY' as const, label: b.title, id: b.id }))
    const send = replyActions.length > 0
      ? await sendButtonActions(phone, block.body, replyActions)
      : await sendButtonActions(phone, block.body, [{ type: 'REPLY', label: 'JÁ CRIEI', id: 'ja_cadastrei' }])
    if (send.success) {
      registerSentMessage(phone, `${block.body}\n\n${block.buttons?.map((b) => b.title).join(' / ') || 'JÁ CRIEI'}`)
      return { success: true }
    }
    const fallback = await zapiSendText(phone, block.body + '\n\nDigite *JÁ CRIEI* que eu peço seu e-mail.')
    return fallback.success ? { success: true } : { success: false, error: send.error || fallback.error }
  }
  const send = await sendReplyButtons(phone, block.body, block.buttons.map((b) => ({ id: b.id, title: b.title })))
  if (send.success) {
    registerSentMessage(phone, `${block.body}\n\n${block.buttons.map((b) => b.title).join(' / ')}`)
    return { success: true }
  }
  const fallback = await apifacilSendText(phone, block.body + '\n\nDigite *JÁ CRIEI* que eu peço seu e-mail.')
  return fallback.success ? { success: true } : { success: false, error: send.error || fallback.error }
}

/** Envia as 2 mensagens de boas-vindas (intro + uma mensagem com botões CADASTRAR e JÁ CRIEI). Usa Z-API ou API Fácil. */
export async function sendBoasVindasToNumber(
  phone: string,
  options?: { contactName?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const provider = getBoasVindasProvider()
  if (provider === 'zapi') return sendBoasVindasViaZapi(phone, options?.contactName)
  if (provider === 'apifacil') return sendBoasVindasViaApifacil(phone)
  return { success: false, error: 'Nenhum provedor de WhatsApp configurado (Z-API ou API Fácil). Defina ZAPI_* ou APIFACIL_* e opcionalmente WHATSAPP_BOASVINDAS_PROVIDER=zapi.' }
}

/** Botão para mensagem customizada (extensão). */
export type CustomMessageButton = { id: string; title: string; url?: string }

/**
 * Envia UMA mensagem customizada (texto e opcionalmente botões). Usado pela extensão com mensagens ilimitadas.
 */
export async function sendCustomMessage(
  phone: string,
  text: string,
  buttons?: CustomMessageButton[]
): Promise<{ success: boolean; error?: string }> {
  const provider = getBoasVindasProvider()
  if (!provider) return { success: false, error: 'Nenhum provedor configurado (Z-API ou API Fácil).' }
  if (!text || !text.trim()) return { success: false, error: 'Texto vazio.' }
  const trimmed = text.trim()
  if (!buttons || buttons.length === 0) {
    const send = provider === 'zapi' ? await zapiSendText(phone, trimmed) : await apifacilSendText(phone, trimmed)
    return send.success ? { success: true } : { success: false, error: send.error }
  }
  if (provider === 'zapi') {
    // Um único array na ordem dos botões (todos na mesma mensagem, um abaixo do outro)
    const allActions = buttons.slice(0, 3).map((b) => {
      if (b.url && b.url.trim()) {
        let u = (b.url as string).trim()
        if (u && !u.startsWith('http')) u = 'https://' + u
        return { type: 'URL' as const, url: u, label: b.title, id: b.id }
      }
      return { type: 'REPLY' as const, label: b.title, id: b.id }
    })
    if (allActions.length === 0) {
      const send = await zapiSendText(phone, trimmed)
      return send.success ? { success: true } : { success: false, error: send.error }
    }
    const send = await sendButtonActions(phone, trimmed, allActions)
    return send.success ? { success: true } : { success: false, error: send.error }
  }
  const send = await apifacilSendCustomButtons(phone, trimmed, buttons.slice(0, 3))
  return send.success ? { success: true } : { success: false, error: send.error }
}
