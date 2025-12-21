/**
 * Armazenar logs de envio de mensagens em memória (apenas para debug)
 */

interface SendLog {
  timestamp: string
  phoneNumber: string
  message: string
  endpoint: string
  method: string
  payload: any
  status?: number
  statusText?: string
  response?: any
  error?: string
  success?: boolean
}

let sendLogs: SendLog[] = []
const MAX_LOGS = 100

export function addSendLog(log: SendLog) {
  try {
    sendLogs.unshift(log)
    if (sendLogs.length > MAX_LOGS) {
      sendLogs = sendLogs.slice(0, MAX_LOGS)
    }
    // Log no console para debug
    console.log('📝 [Send Logs] Log adicionado. Total:', sendLogs.length, 'Phone:', log.phoneNumber)
  } catch (error: any) {
    console.error('❌ [Send Logs] Erro ao adicionar log:', error.message)
  }
}

export function getSendLogs(): SendLog[] {
  return sendLogs
}

export function clearSendLogs() {
  sendLogs = []
}



