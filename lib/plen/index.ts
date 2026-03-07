/**
 * PLEN — Assistente financeira no WhatsApp (Z-API)
 * Arquitetura: estado + intenções + fila + validação backend.
 */

export { handlePlenIncomingMessage } from './business/plen-handler'
export { getOrCreatePlenState, setPlenState, type PlenState } from './state/user-state-manager'
export { enqueuePlenMessage, getPendingQueueItems } from './queue/message-queue'
export { processPlenQueue } from './queue/queue-worker'
export { routeIntent, type PlenIntent, type IntentResult } from './ai/intent-router'
export { parseExpenseSimple, parseExpenseOrReceita } from './ai/expense-parser'
export { logPlenInteraction } from './interaction/interaction-logs'
