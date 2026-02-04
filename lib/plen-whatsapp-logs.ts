/**
 * Logs das chamadas do PLEN via WhatsApp (request + response + erro).
 * Usado para diagnóstico na página /logs-whatsapp-plen.
 */

export interface PlenWhatsAppLogEntry {
  id: string
  timestamp: string
  step: 'request' | 'response' | 'invalid_result' | 'error'
  url?: string
  userId?: string
  message?: string
  status?: number
  statusText?: string
  responseBody?: string
  responseParsed?: { response?: string; error?: string; [k: string]: unknown }
  error?: string
  plenResult?: { success?: boolean; message?: string } | null
}

const MAX = 80
const entries: PlenWhatsAppLogEntry[] = []

export function plenWhatsAppLog(entry: Omit<PlenWhatsAppLogEntry, 'id' | 'timestamp'>) {
  const full: PlenWhatsAppLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  }
  entries.unshift(full)
  if (entries.length > MAX) entries.length = MAX
  return full
}

export function getPlenWhatsAppLogs(limit = 50): PlenWhatsAppLogEntry[] {
  return entries.slice(0, limit)
}
