/**
 * Logs em memória para diagnóstico do assistente PLEN.
 * Usado pela rota /api/plen/chat e exposto em GET /api/plen/logs.
 */

export interface PlenLogEntry {
  id: string
  requestId: string
  timestamp: string
  step: string
  message: string
  data?: unknown
  level?: 'info' | 'warn' | 'error'
}

const MAX_ENTRIES = 100
const entries: PlenLogEntry[] = []

export function plenLog(
  requestId: string,
  step: string,
  message: string,
  data?: unknown,
  level: PlenLogEntry['level'] = 'info'
) {
  const entry: PlenLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    requestId,
    timestamp: new Date().toISOString(),
    step,
    message,
    data,
    level,
  }
  entries.unshift(entry)
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES
  return entry
}

export function getPlenLogs(limit = 50): PlenLogEntry[] {
  return entries.slice(0, limit)
}
