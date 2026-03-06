/**
 * Revisão de leads "no vácuo": quem enviou mensagem e não recebeu resposta.
 * Roda a cada 2 min (cron) ou sob demanda (botão admin). Responde com a mesma lógica do webhook (PLEN).
 */

import { listContatosNoVacuo, markReplySent } from '@/lib/whatsapp-contatos-pendentes'
import { processWhatsAppMessage } from '@/lib/whatsapp-plen-handler'
import { sendTextMessage, sendButtonList, sendButtonActions, isZapiConfigured } from '@/lib/whatsapp-zapi'
import { registerSentMessage } from '@/lib/whatsapp-plen-handler'

const DELAY_MIN_MS = 3000
const DELAY_MAX_MS = 5000

function buildPlenMessage(phone: string, text: string) {
  const from = phone.replace(/\D/g, '')
  const remoteJid = from.length >= 10 ? (from.startsWith('55') ? from : `55${from}`) + '@s.whatsapp.net' : `${from}@s.whatsapp.net`
  return {
    key: { remoteJid, id: `vacuo-${Date.now()}` },
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000),
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export interface RunRevisaoVacuoResult {
  ok: boolean
  processed: number
  errors: string[]
}

/**
 * Lista contatos no vácuo, gera resposta com o PLEN e envia via Z-API.
 * Delay aleatório 3–5 s entre cada envio para evitar spam.
 */
export async function runRevisaoVacuo(
  minAgeMinutes: number = 2,
  maxAgeHours: number = 48
): Promise<RunRevisaoVacuoResult> {
  const errors: string[] = []
  let processed = 0

  if (!isZapiConfigured()) {
    return { ok: false, processed: 0, errors: ['Z-API não configurada'] }
  }

  const contatos = await listContatosNoVacuo(minAgeMinutes, maxAgeHours)
  if (contatos.length === 0) {
    return { ok: true, processed: 0, errors: [] }
  }

  for (let i = 0; i < contatos.length; i++) {
    if (i > 0) {
      const delayMs = DELAY_MIN_MS + Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1))
      await delay(delayMs)
    }

    const { phone, last_message } = contatos[i]
    const text = (last_message ?? '').trim() || 'Olá'
    const phoneNorm = phone.replace(/\D/g, '')
    const phoneWith55 = phoneNorm.length <= 11 ? `55${phoneNorm}` : phoneNorm

    try {
      const plenMessage = buildPlenMessage(phoneWith55, text)
      const result = await processWhatsAppMessage(plenMessage as any)

      if (!result || (result as { skipReply?: boolean }).skipReply === true) {
        await markReplySent(phoneWith55)
        processed++
        continue
      }

      const msgs = (result as { messages?: unknown[] }).messages
      const singleMsg = (result as { message?: string }).message

      if (msgs && Array.isArray(msgs) && msgs.length > 0) {
        for (let j = 0; j < msgs.length; j++) {
          const msg = msgs[j]
          if (typeof msg === 'object' && msg !== null && (msg as { type?: string }).type === 'button_actions') {
            const { body, buttonActions } = msg as { body: string; buttonActions: { type: string; url?: string; label: string }[] }
            const r = await sendButtonActions(phoneWith55, body, buttonActions)
            if (r.success) registerSentMessage(phoneWith55, `${body} [botão]`)
          } else if (typeof msg === 'object' && msg !== null && (msg as { type?: string }).type === 'buttons') {
            const { body, buttons } = msg as { body: string; buttons: { id: string; title: string }[] }
            const r = await sendButtonList(phoneWith55, body, buttons)
            if (r.success) registerSentMessage(phoneWith55, `${body} [botões]`)
          } else if (typeof msg === 'string' && msg.trim()) {
            const r = await sendTextMessage(phoneWith55, msg.trim(), { delayTyping: j === 0 ? 1 : 0 })
            if (r.success) registerSentMessage(phoneWith55, msg)
          }
          if (j < msgs.length - 1) await delay(280)
        }
        await markReplySent(phoneWith55)
        processed++
        continue
      }

      if (typeof singleMsg === 'string' && singleMsg.trim()) {
        const r = await sendTextMessage(phoneWith55, singleMsg.trim(), { delayTyping: 1 })
        if (r.success) {
          registerSentMessage(phoneWith55, singleMsg)
          await markReplySent(phoneWith55)
          processed++
        } else {
          errors.push(`${phoneWith55}: ${(r as { error?: string }).error ?? 'falha ao enviar'}`)
        }
      } else {
        await markReplySent(phoneWith55)
        processed++
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${phoneWith55}: ${msg}`)
    }
  }

  return { ok: true, processed, errors }
}
