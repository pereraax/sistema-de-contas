/**
 * Lógica compartilhada para enviar as 3 mensagens de boas-vindas ("quero utilizar a plenipay").
 * Usado pelo webhook, pela rota de envio em massa e pela rota admin de reenvio.
 *
 * Provedores suportados:
 * - API Fácil (apifacil.dev): env APIFACIL_INSTANCE_ID + APIFACIL_TOKEN
 * - Z-API (z-api.io): env ZAPI_INSTANCE_ID + ZAPI_TOKEN (+ ZAPI_CLIENT_TOKEN se exigido). Prático, com botões nativos.
 *
 * Definir WHATSAPP_BOASVINDAS_PROVIDER=zapi para usar Z-API; caso contrário usa API Fácil se configurada.
 */

import { sendTextMessage as apifacilSendText, sendReplyButtons, sendCustomButtons as apifacilSendCustomButtons, isApifacilConfigured } from '@/lib/whatsapp-apifacil'
import {
  sendTextMessage as zapiSendText,
  sendButtonActions,
  isZapiConfigured,
} from '@/lib/whatsapp-zapi'
import { registerSentMessage } from '@/lib/whatsapp-plen-handler'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** As 3 mensagens de boas-vindas (igual ao print: link só no botão). */
export const MENSAGENS_BOAS_VINDAS: [string, { type: 'buttons'; body: string; buttons: { id: string; title: string; url?: string }[] }, string] = [
  `Oiii 👋💙\nEu sou a Plen, sua assistente financeira 🤖✨\nE eu já estou prontinha pra começar a te ajudar a organizar tudo por aqui!\n\nAntes da gente começar, cria sua conta rapidinho lá no site 🌐\nÉ bem rápido mesmo, prometo! ⏱️💙`,
  {
    type: 'buttons' as const,
    body: 'Para que eu consiga te reconhecer e registrar tudo certinho, preciso que você salve meu contato, tá bem? 💙🥺 AGORA É SÓ CADASTRAR! 📝',
    buttons: [{ id: 'cadastrar', title: 'CADASTRAR', url: 'https://plenipay.com' }],
  },
  `Assim que finalizar o cadastro, me envia seu e-mail aqui ✉️ Vou verificar tudo certinho e já te liberar pra começar a registrar seus gastos e colocar suas economias em ordem 💵📈✨ Eu fico responsável por anotar tudo pra você direto pelo WhatsApp, combinado? 😉`,
]

const CADASTRO_URL = 'https://plenipay.com'
const FALLBACK_LINK_MSG = `Para que eu consiga te reconhecer e registrar tudo certinho, preciso que você salve meu contato, tá bem? 💙🥺\n\nEscolha abaixo:\n\n🔗 Cadastro: ${CADASTRO_URL}\n\n*CADASTRAR* — abrir site\n*JÁ CADASTREI* — já criei minha conta`

/** Qual provedor usar para boas-vindas: Z-API sempre que configurada (envio rápido e botões nativos). */
export function getBoasVindasProvider(): 'zapi' | 'apifacil' | null {
  if (isZapiConfigured()) return 'zapi'
  if (isApifacilConfigured()) return 'apifacil'
  return null
}

/** True se pelo menos um provedor (Z-API ou API Fácil) está configurado para enviar boas-vindas. */
export function isBoasVindasConfigured(): boolean {
  return getBoasVindasProvider() !== null
}

/** Envia as 3 mensagens via Z-API (texto + botão URL CADASTRAR + texto). Link só no botão. */
async function sendBoasVindasViaZapi(phone: string): Promise<{ success: boolean; error?: string }> {
  const [msg1, msg2Block, msg3] = MENSAGENS_BOAS_VINDAS
  const send1 = await zapiSendText(phone, msg1)
  if (!send1.success) return { success: false, error: send1.error }
  registerSentMessage(phone, msg1)
  await delay(300)

  const body2 = msg2Block.type === 'buttons' ? msg2Block.body : ''
  const urlBtn = msg2Block.type === 'buttons' && msg2Block.buttons?.find((b) => b.url)
  const send2 = urlBtn
    ? await sendButtonActions(phone, body2, [{ type: 'URL', url: urlBtn.url || CADASTRO_URL, label: urlBtn.title, id: urlBtn.id }])
    : await sendButtonActions(phone, body2, [{ type: 'URL', url: CADASTRO_URL, label: 'CADASTRAR', id: 'cadastrar' }])
  if (send2.success) {
    registerSentMessage(phone, `${body2}\n\nCADASTRAR`)
  } else {
    const fallback = await zapiSendText(phone, FALLBACK_LINK_MSG)
    if (fallback.success) registerSentMessage(phone, FALLBACK_LINK_MSG)
    if (!fallback.success) return { success: false, error: send2.error || fallback.error }
  }
  await delay(300)

  const send3 = await zapiSendText(phone, msg3)
  if (!send3.success) return { success: false, error: send3.error }
  registerSentMessage(phone, msg3)
  return { success: true }
}

/** Envia as 3 mensagens via API Fácil (segunda mensagem com botão URL quando disponível). */
async function sendBoasVindasViaApifacil(phone: string): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < MENSAGENS_BOAS_VINDAS.length; i++) {
    const msg = MENSAGENS_BOAS_VINDAS[i]
    if (typeof msg === 'string') {
      const send = await apifacilSendText(phone, msg)
      if (!send.success) return { success: false, error: send.error }
      registerSentMessage(phone, msg)
    } else if (msg.type === 'buttons') {
      const hasUrl = msg.buttons.some((b) => b.url)
      const send = hasUrl
        ? await apifacilSendCustomButtons(phone, msg.body, msg.buttons as { id: string; title: string; url?: string }[])
        : await sendReplyButtons(phone, msg.body, msg.buttons.map((b) => ({ id: b.id, title: b.title })))
      if (send.success) {
        registerSentMessage(phone, `${msg.body}\n\n${msg.buttons.map((b) => b.title).join(' / ')}`)
      } else {
        const fallback = await apifacilSendText(phone, FALLBACK_LINK_MSG)
        if (fallback.success) registerSentMessage(phone, FALLBACK_LINK_MSG)
        if (!fallback.success) return { success: false, error: send.error || fallback.error }
      }
    }
    if (i < MENSAGENS_BOAS_VINDAS.length - 1) await delay(400)
  }
  return { success: true }
}

/** Envia apenas UMA mensagem de boas-vindas (1, 2 ou 3). Envio instantâneo, sem delay. */
export async function sendBoasVindasSingleMessage(
  phone: string,
  index: 1 | 2 | 3
): Promise<{ success: boolean; error?: string }> {
  const provider = getBoasVindasProvider()
  if (!provider) {
    return { success: false, error: 'Nenhum provedor configurado (Z-API ou API Fácil).' }
  }
  const msg = MENSAGENS_BOAS_VINDAS[index - 1]
  if (typeof msg === 'string') {
    const send = provider === 'zapi' ? await zapiSendText(phone, msg) : await apifacilSendText(phone, msg)
    if (!send.success) return { success: false, error: send.error }
    registerSentMessage(phone, msg)
    return { success: true }
  }
  const msg2Block = msg
  const body2 = msg2Block.body
  const urlBtn = msg2Block.buttons?.find((b) => b.url)
  if (provider === 'zapi') {
    const send2 = await sendButtonActions(phone, body2, [
      { type: 'URL', url: urlBtn?.url || CADASTRO_URL, label: urlBtn?.title || 'CADASTRAR', id: urlBtn?.id || 'cadastrar' },
    ])
    if (send2.success) {
      registerSentMessage(phone, `${body2}\n\nCADASTRAR`)
      return { success: true }
    }
    const fallback = await zapiSendText(phone, FALLBACK_LINK_MSG)
    if (fallback.success) registerSentMessage(phone, FALLBACK_LINK_MSG)
    return fallback.success ? { success: true } : { success: false, error: send2.error || fallback.error }
  }
  const hasUrl = msg2Block.buttons?.some((b) => b.url)
  const send = hasUrl
    ? await apifacilSendCustomButtons(phone, msg2Block.body, msg2Block.buttons as { id: string; title: string; url?: string }[])
    : await sendReplyButtons(phone, msg2Block.body, msg2Block.buttons.map((b) => ({ id: b.id, title: b.title })))
  if (send.success) {
    registerSentMessage(phone, `${msg2Block.body}\n\n${msg2Block.buttons.map((b) => b.title).join(' / ')}`)
    return { success: true }
  }
  const fallback = await apifacilSendText(phone, FALLBACK_LINK_MSG)
  if (fallback.success) registerSentMessage(phone, FALLBACK_LINK_MSG)
  return fallback.success ? { success: true } : { success: false, error: send.error || fallback.error }
}

/** Envia as 3 mensagens de boas-vindas para um número. Usa Z-API ou API Fácil conforme configuração. */
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
