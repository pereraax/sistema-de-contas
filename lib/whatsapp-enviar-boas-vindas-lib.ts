/**
 * Boas-vindas WhatsApp: apenas UMA mensagem de texto (modo teste antes do cadastro).
 * Não enviamos mais mensagem com botões (evita "Não foi possível carregar a mensagem" no WhatsApp Web).
 * Provedor: Z-API (z-api.io). API Fácil como fallback.
 */

import { getMensagemInicialModoTeste } from '@/lib/whatsapp-modo-teste'
import { sendTextMessage as apifacilSendText, sendReplyButtons, sendCustomButtons as apifacilSendCustomButtons } from '@/lib/whatsapp-apifacil'
import {
  sendTextMessage as zapiSendText,
  sendButtonActions,
  isZapiConfigured,
} from '@/lib/whatsapp-zapi'
import { registerSentMessage } from '@/lib/whatsapp-plen-handler'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Tipo legado (admin/cron podem ainda referenciar). Conteúdo real = só mensagem modo teste. */
export type BoasVindasItem =
  | string
  | { type: 'button_actions'; body: string; buttonActions: ({ type: 'URL'; url: string; label: string } | { type: 'REPLY'; label: string; id?: string })[] }
  | { type: 'buttons'; body: string; buttons: { id: string; title: string; url?: string }[] }

/** Mensagem única de boas-vindas = intro modo teste (sem botões). */
const INTRO_SEM_NOME = `Oii 👋✨!!!

💙 Eu sou a Plen, sua assistente financeira 😊

✨ Antes de criar sua conta, vamos testar rapidinho.

👉 Me diga algo que você gastou hoje.

Exemplo:
* 50 mercado
* 20 uber`

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

/** Primeira mensagem de intro = modo teste (com nome quando disponível). Usado como fallback no webhook. */
export function getIntroBoasVindas(contactName?: string | null): string {
  return getMensagemInicialModoTeste(contactName)
}

/** Envia APENAS UMA mensagem de texto (modo teste) via Z-API — sem botões, para evitar "Não foi possível carregar a mensagem" no WhatsApp Web. */
async function sendBoasVindasViaZapi(phone: string, contactName?: string | null): Promise<{ success: boolean; error?: string }> {
  const text = getMensagemInicialModoTeste(contactName)
  const send = await zapiSendText(phone, text)
  if (!send.success) return { success: false, error: send.error }
  registerSentMessage(phone, text)
  return { success: true }
}

/** Envia APENAS UMA mensagem de texto (modo teste) via API Fácil — sem botões. */
async function sendBoasVindasViaApifacil(phone: string, contactName?: string | null): Promise<{ success: boolean; error?: string }> {
  const text = getMensagemInicialModoTeste(contactName)
  const send = await apifacilSendText(phone, text)
  if (!send.success) return { success: false, error: send.error }
  registerSentMessage(phone, text)
  return { success: true }
}

/** Envia apenas UMA mensagem de boas-vindas (modo teste, só texto — sem botões). Índice ignorado; sempre envia o mesmo texto. */
export async function sendBoasVindasSingleMessage(
  phone: string,
  _index?: 1 | 2 | 3,
  contactName?: string | null
): Promise<{ success: boolean; error?: string }> {
  const provider = getBoasVindasProvider()
  if (!provider) return { success: false, error: 'Nenhum provedor configurado (Z-API ou API Fácil).' }
  const text = getMensagemInicialModoTeste(contactName)
  const send = provider === 'zapi' ? await zapiSendText(phone, text) : await apifacilSendText(phone, text)
  if (!send.success) return { success: false, error: send.error }
  registerSentMessage(phone, text)
  return { success: true }
}

/** Envia UMA mensagem de boas-vindas (modo teste, só texto — sem botões). Usa Z-API ou API Fácil. */
export async function sendBoasVindasToNumber(
  phone: string,
  options?: { contactName?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const provider = getBoasVindasProvider()
  if (provider === 'zapi') return sendBoasVindasViaZapi(phone, options?.contactName)
  if (provider === 'apifacil') return sendBoasVindasViaApifacil(phone, options?.contactName)
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
