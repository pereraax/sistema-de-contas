/**
 * Armazenar logs do webhook em memória (apenas para debug)
 */

interface WebhookLog {
  timestamp: string
  method: string
  body: any
  response: any
  error?: string
}

let webhookLogs: WebhookLog[] = []
const MAX_LOGS = 100

export function addWebhookLog(log: WebhookLog) {
  try {
    webhookLogs.unshift(log)
    if (webhookLogs.length > MAX_LOGS) {
      webhookLogs = webhookLogs.slice(0, MAX_LOGS)
    }
    // Log no console para debug
    console.log('📝 [Webhook Logs] Log adicionado. Total:', webhookLogs.length)
  } catch (error: any) {
    console.error('❌ [Webhook Logs] Erro ao adicionar log:', error.message)
  }
}

export function getWebhookLogs(): WebhookLog[] {
  return webhookLogs
}

export function clearWebhookLogs() {
  webhookLogs = []
}



