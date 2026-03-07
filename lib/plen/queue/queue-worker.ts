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
import { sendWhatsAppMessageWithResult } from '@/lib/whatsapp/sender'

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

    const result = await sendWhatsAppMessageWithResult(item.contact_id, item.mensagem)

    if (result.success) {
      await markQueueItemSent(item.id)
      sent++
    } else {
      await markQueueItemFailed(item.id, result.error ?? 'Erro desconhecido')
      failed++
    }

    if (i < maxMessages - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
  }

  return { sent, failed }
}
