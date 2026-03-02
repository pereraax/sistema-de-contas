/**
 * Lógica compartilhada para enviar as 3 mensagens de boas-vindas ("quero utilizar a plenipay").
 * (1) Oi, sou a Plen; (2) Passos + botão URL CADASTRAR (abre o site ao toque); (3) botão JÁ CRIEI → ao tocar o handler pede e-mail.
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

/** 3 mensagens: (1) intro, (2) passos + botão URL CADASTRAR (abre o site ao toque), (3) botão REPLY JÁ CRIEI (pede e-mail). WhatsApp não permite URL + REPLY no mesmo envio. */
export type BoasVindasItem =
  | string
  | { type: 'button_actions'; body: string; buttonActions: { type: 'URL'; url: string; label: string }[] }
  | { type: 'buttons'; body: string; buttons: { id: string; title: string; url?: string }[] }

export const MENSAGENS_BOAS_VINDAS: BoasVindasItem[] = [
  `Oi! 👋 Sou a Plen, sua assistente financeira. Vou te ajudar a organizar gastos e receitas direto pelo WhatsApp 💙`,
  {
    type: 'button_actions' as const,
    body: 'Antes de começar a registrar seus gastos:\n\n1️⃣ Salve meu contato\n2️⃣ Crie sua conta — é rápido, prometo! 😊\n\nToque em *CADASTRAR* para abrir o site:',
    buttonActions: [{ type: 'URL', url: 'https://plenipay.com', label: 'CADASTRAR' }],
  },
  {
    type: 'buttons' as const,
    body: 'Se já tem conta, toque em *JÁ CRIEI* que eu peço seu e-mail e te libero aqui. 💙',
    buttons: [{ id: 'ja_cadastrei', title: 'JÁ CRIEI' }],
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

/** Envia 3 mensagens via Z-API: (1) intro, (2) passos + botão URL CADASTRAR (abre site), (3) botão REPLY JÁ CRIEI. */
async function sendBoasVindasViaZapi(phone: string): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < MENSAGENS_BOAS_VINDAS.length; i++) {
    const msg = MENSAGENS_BOAS_VINDAS[i]
    if (typeof msg === 'string') {
      const send = await zapiSendText(phone, msg)
      if (!send.success) return { success: false, error: send.error }
      registerSentMessage(phone, msg)
    } else if (msg.type === 'button_actions') {
      const send = await sendButtonActions(phone, msg.body, msg.buttonActions)
      if (!send.success) {
        const fallback = await zapiSendText(phone, FALLBACK_LINK_MSG)
        if (!fallback.success) return { success: false, error: send.error || fallback.error }
        registerSentMessage(phone, FALLBACK_LINK_MSG)
      } else {
        registerSentMessage(phone, `${msg.body} [botão CADASTRAR]`)
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

/** Envia as 3 mensagens via API Fácil (intro + link CADASTRAR + botão JÁ CRIEI). */
async function sendBoasVindasViaApifacil(phone: string): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < MENSAGENS_BOAS_VINDAS.length; i++) {
    const msg = MENSAGENS_BOAS_VINDAS[i]
    if (typeof msg === 'string') {
      const send = await apifacilSendText(phone, msg)
      if (!send.success) return { success: false, error: send.error }
      registerSentMessage(phone, msg)
    } else if (msg.type === 'button_actions') {
      const btns = msg.buttonActions.map((a) => ({ id: a.label.toLowerCase().replace(/\s+/g, '_'), title: a.label, url: a.url }))
      const send = await apifacilSendCustomButtons(phone, msg.body, btns)
      if (send.success) registerSentMessage(phone, `${msg.body} [botão CADASTRAR]`)
      else {
        const fallback = await apifacilSendText(phone, msg.body + '\n\n' + CADASTRO_URL)
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

/** Envia apenas UMA mensagem de boas-vindas (índice 1, 2 ou 3). Envio instantâneo, sem delay. */
export async function sendBoasVindasSingleMessage(
  phone: string,
  index: 1 | 2 | 3
): Promise<{ success: boolean; error?: string }> {
  const provider = getBoasVindasProvider()
  if (!provider) return { success: false, error: 'Nenhum provedor configurado (Z-API ou API Fácil).' }
  const msg = MENSAGENS_BOAS_VINDAS[index - 1]
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

/** Envia as 3 mensagens de boas-vindas (intro + botão URL CADASTRAR + botão JÁ CRIEI). Usa Z-API ou API Fácil. */
export async function sendBoasVindasToNumber(phone: string): Promise<{ success: boolean; error?: string }> {
  const provider = getBoasVindasProvider()
  if (provider === 'zapi') return sendBoasVindasViaZapi(phone)
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
    const urlActions = buttons
      .slice(0, 3)
      .filter((b) => b.url && b.url.trim())
      .map((b) => {
        let u = (b.url as string).trim()
        if (u && !u.startsWith('http')) u = 'https://' + u
        return { type: 'URL' as const, url: u, label: b.title, id: b.id }
      })
    const replyActions = buttons
      .slice(0, 3)
      .filter((b) => !b.url || !b.url.trim())
      .map((b) => ({ type: 'REPLY' as const, label: b.title, id: b.id }))
    // Link só no botão; texto sem URL duplicada na mensagem.
    const messageOnly = trimmed
    if (urlActions.length > 0 && replyActions.length > 0) {
      const [send1, send2] = await Promise.all([
        sendButtonActions(phone, messageOnly, urlActions),
        sendButtonActions(phone, 'Ou escolha:', replyActions),
      ])
      if (!send1.success) return { success: false, error: send1.error }
      if (!send2.success) return { success: false, error: send2.error }
      return { success: true }
    }
    if (urlActions.length > 0) {
      const send = await sendButtonActions(phone, messageOnly, urlActions)
      return send.success ? { success: true } : { success: false, error: send.error }
    }
    if (replyActions.length > 0) {
      const send = await sendButtonActions(phone, trimmed, replyActions)
      return send.success ? { success: true } : { success: false, error: send.error }
    }
  }
  const send = await apifacilSendCustomButtons(phone, trimmed, buttons.slice(0, 3))
  return send.success ? { success: true } : { success: false, error: send.error }
}
