/**
 * PLEN — Worker da fila: envia mensagens com delay seguro (1 a cada 2s).
 * Chamado por cron ou por API route.
 */

import {
  getPendingQueueItems,
  markQueueItemSending,
  markQueueItemSent,
  markQueueItemFailed,
  QUEUE_DELAY_SECONDS,
} from './message-queue'
import { sendWhatsAppMessageWithResult, sendWhatsAppMessageWithButtons } from '@/lib/whatsapp/sender'
import { markPlenLembreteEnviado } from '@/lib/plen/lembretes/plen-lembretes'

const DELAY_MS = QUEUE_DELAY_SECONDS * 1000

/**
 * Processa até `maxMessages` itens da fila (1 por vez com delay entre eles).
 * Retorna quantos foram enviados com sucesso.
 */
export async function processPlenQueue(maxMessages = 5): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (let i = 0; i < maxMessages; i++) {
    const items = await getPendingQueueItems(1)
    if (items.length === 0) break

    const item = items[0]
    const ok = await markQueueItemSending(item.id)
    if (!ok) continue

    let botoesRaw = item.botoes
    if (typeof botoesRaw === 'string') {
      try {
        botoesRaw = JSON.parse(botoesRaw) as typeof item.botoes
      } catch {
        botoesRaw = null
      }
    }
    const botoes = Array.isArray(botoesRaw)
      ? (botoesRaw as Array<{ titulo?: string; link?: string }>).filter((b) => (b?.titulo ?? '').trim().length > 0)
      : []
    const sameBubble = botoes.length > 0 && (item.mensagem ?? '').includes('Crie sua conta na plataforma pelo link abaixo')
    const result = botoes.length > 0
      ? await sendWhatsAppMessageWithButtons(item.contact_id, item.mensagem, botoes, sameBubble)
      : await sendWhatsAppMessageWithResult(item.contact_id, item.mensagem)

    if (result.success) {
      await markQueueItemSent(item.id)
      if (item.lembrete_id) {
        await markPlenLembreteEnviado(item.lembrete_id)
      }
      sent++
    } else {
      const errMsg = result.error ?? 'Erro desconhecido'
      await markQueueItemFailed(item.id, errMsg)
      failed++
      if (process.env.NODE_ENV === 'development') {
        console.warn('[plen/queue-worker] envio falhou:', errMsg)
      }
    }

    if (i < maxMessages - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  return { sent, failed }
}
