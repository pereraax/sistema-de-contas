// Sistema de logging compartilhado para capturar logs do servidor
// Usa globalThis para persistir entre requisições no mesmo processo

interface LogEntry {
  timestamp: string
  level: 'log' | 'error' | 'warn' | 'info'
  message: string
}

// Usar globalThis para persistir entre requisições
declare global {
  var __serverLogsBuffer: LogEntry[] | undefined
}

const MAX_LOGS = 1000

function getLogsBuffer(): LogEntry[] {
  if (!globalThis.__serverLogsBuffer) {
    globalThis.__serverLogsBuffer = []
  }
  return globalThis.__serverLogsBuffer
}

export function addLog(level: LogEntry['level'], message: string) {
  try {
    const logsBuffer = getLogsBuffer()
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    }
    
    logsBuffer.push(entry)
    
    // Manter apenas os últimos MAX_LOGS
    if (logsBuffer.length > MAX_LOGS) {
      logsBuffer.shift()
    }
    
    // Logar no console também para debug (sempre, não só para WhatsApp)
    console.log(`[SERVER-LOGS] ${level.toUpperCase()}: ${message}`)
  } catch (error) {
    // Se houver erro, pelo menos logar no console
    console.error('[SERVER-LOGS] Erro ao adicionar log:', error)
    console.log(`[FALLBACK-LOG] ${message}`)
  }
}

export function getLogs(filter?: string): LogEntry[] {
  const logsBuffer = getLogsBuffer()
  let filtered = logsBuffer
  
  if (filter) {
    const filterLower = filter.toLowerCase()
    filtered = logsBuffer.filter(log => 
      log.message.toLowerCase().includes(filterLower)
    )
  }
  
  return filtered.slice(-500) // Retornar últimos 500 logs
}

export function clearLogs() {
  const logsBuffer = getLogsBuffer()
  logsBuffer.length = 0
}

export function getLogsCount(): number {
  const logsBuffer = getLogsBuffer()
  return logsBuffer.length
}

