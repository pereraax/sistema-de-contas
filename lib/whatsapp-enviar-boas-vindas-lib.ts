/**
 * Lógica compartilhada para enviar as 3 mensagens de boas-vindas ("quero utilizar a plenipay").
 * Usado pelo webhook, pela rota de envio em massa e pela rota admin de reenvio.
 */

import { sendTextMessage, sendReplyButtons } from '@/lib/whatsapp-apifacil'
import { registerSentMessage } from '@/lib/whatsapp-plen-handler'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const MENSAGENS_BOAS_VINDAS: [string, { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }, string] = [
  `Oiii 👋💙\nEu sou a Plen, sua assistente financeira 🤖✨\nE eu já estou prontinha pra começar a te ajudar a organizar tudo por aqui!\n\nAntes da gente começar, cria sua conta rapidinho lá no site 🌐\nÉ bem rápido mesmo, prometo! ⏱️💙`,
  {
    type: 'buttons' as const,
    body: 'Escolha abaixo:',
    buttons: [
      { id: 'cadastrar', title: 'CADASTRAR' },
      { id: 'ja_cadastrei', title: 'JÁ CADASTREI' },
    ],
  },
  `Assim que finalizar o cadastro, me envia seu e-mail aqui 📩\nVou verificar tudo certinho e já te liberar pra começar a registrar seus gastos e colocar suas economias em ordem 💸📊✨\n\nEu fico responsável por anotar tudo pra você direto pelo WhatsApp, combinado? 😉`,
]

/** Envia as 3 mensagens de boas-vindas para um número. Retorna { success, error? }. */
export async function sendBoasVindasToNumber(phone: string): Promise<{ success: boolean; error?: string }> {
  for (let i = 0; i < MENSAGENS_BOAS_VINDAS.length; i++) {
    const msg = MENSAGENS_BOAS_VINDAS[i]
    if (typeof msg === 'string') {
      const send = await sendTextMessage(phone, msg)
      if (!send.success) {
        return { success: false, error: send.error }
      }
      registerSentMessage(phone, msg)
    } else if (msg.type === 'buttons') {
      const send = await sendReplyButtons(phone, msg.body, msg.buttons)
      if (send.success) {
        registerSentMessage(phone, `${msg.body}\n\n${msg.buttons.map((b) => b.title).join(' / ')}`)
      } else {
        const linkMsg = `Escolha abaixo:\n\n🔗 Cadastro: https://plenipay.com\n\n*CADASTRAR* — abrir site\n*JÁ CADASTREI* — já criei minha conta`
        const fallback = await sendTextMessage(phone, linkMsg)
        if (fallback.success) registerSentMessage(phone, linkMsg)
        if (!fallback.success) return { success: false, error: send.error || fallback.error }
      }
    }
    if (i < MENSAGENS_BOAS_VINDAS.length - 1) await delay(1500)
  }
  return { success: true }
}
