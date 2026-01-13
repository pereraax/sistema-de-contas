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
    // Usar console.log original para evitar recursão
    if (globalThis.__originalConsoleLog) {
      globalThis.__originalConsoleLog(`[SERVER-LOGS] ${level.toUpperCase()}: ${message}`)
    } else {
      console.log(`[SERVER-LOGS] ${level.toUpperCase()}: ${message}`)
    }
  } catch (error) {
    // Se houver erro, pelo menos logar no console
    if (globalThis.__originalConsoleError) {
      globalThis.__originalConsoleError('[SERVER-LOGS] Erro ao adicionar log:', error)
    } else {
      console.error('[SERVER-LOGS] Erro ao adicionar log:', error)
    }
    if (globalThis.__originalConsoleLog) {
      globalThis.__originalConsoleLog(`[FALLBACK-LOG] ${message}`)
    } else {
      console.log(`[FALLBACK-LOG] ${message}`)
    }
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

// Intercepta console.log para capturar logs automaticamente
declare global {
  var __originalConsoleLog: typeof console.log | undefined
  var __originalConsoleError: typeof console.error | undefined
  var __originalConsoleWarn: typeof console.warn | undefined
  var __consoleIntercepted: boolean | undefined
}

export function interceptConsoleLogs() {
  // Evitar interceptar múltiplas vezes
  if (globalThis.__consoleIntercepted) {
    return
  }
  
  globalThis.__originalConsoleLog = console.log
  globalThis.__originalConsoleError = console.error
  globalThis.__originalConsoleWarn = console.warn
  
  console.log = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')
    
    // Adicionar ao buffer se contiver [PLEN WhatsApp]
    if (message.includes('[PLEN WhatsApp]') || message.includes('PLEN WhatsApp')) {
      addLog('log', message)
    }
    
    // Chamar console.log original
    globalThis.__originalConsoleLog?.(...args)
  }
  
  console.error = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')
    
    // Adicionar ao buffer se contiver [PLEN WhatsApp]
    if (message.includes('[PLEN WhatsApp]') || message.includes('PLEN WhatsApp')) {
      addLog('error', message)
    }
    
    // Chamar console.error original
    globalThis.__originalConsoleError?.(...args)
  }
  
  console.warn = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')
    
    // Adicionar ao buffer se contiver [PLEN WhatsApp]
    if (message.includes('[PLEN WhatsApp]') || message.includes('PLEN WhatsApp')) {
      addLog('warn', message)
    }
    
    // Chamar console.warn original
    globalThis.__originalConsoleWarn?.(...args)
  }
  
  globalThis.__consoleIntercepted = true
}

