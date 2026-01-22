// Sistema de armazenamento de logs em memória
// IMPORTANTE: Usar variável global para garantir instância única

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success' | 'debug'
  category?: string
  message: string
  data?: any
}

class ServerLogs {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Limitar quantidade de logs em memória
  private listeners: Set<() => void> = new Set()

  // Adicionar log
  add(level: LogEntry['level'], message: string, category?: string, data?: any) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    }

    this.logs.unshift(entry) // Adicionar no início
    
    // Limitar quantidade de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Notificar listeners
    this.notifyListeners()

    // Também fazer log no console normal (SEMPRE)
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 
                         level === 'success' ? 'log' : 'log'
    const prefix = category ? `[${category}]` : ''
    const timestamp = new Date().toISOString()
    console[consoleMethod](`[${timestamp}]${prefix} ${message}`, data ? JSON.stringify(data, null, 2) : '')
    
    // Log adicional para debug
    console.log(`📋 [SERVER-LOGS] Log adicionado: ${level} | ${category || 'sem categoria'} | Total de logs: ${this.logs.length}`)
  }

  // Obter logs
  getLogs(limit = 500): LogEntry[] {
    return this.logs.slice(0, limit)
  }

  // Obter logs filtrados
  getFilteredLogs(filters: {
    level?: LogEntry['level']
    category?: string
    search?: string
    limit?: number
  }): LogEntry[] {
    let filtered = [...this.logs]

    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level)
    }

    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        (log.category && log.category.toLowerCase().includes(searchLower))
      )
    }

    return filtered.slice(0, filters.limit || 500)
  }

  // Limpar logs
  clear() {
    this.logs = []
    this.notifyListeners()
  }

  // Subscribir para mudanças
  subscribe(callback: () => void) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  // Notificar listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback())
  }
}

// Instância global única - usar variável global para garantir singleton
// IMPORTANTE: Next.js pode criar múltiplas instâncias do módulo em diferentes processos
// Usar variável global garante que todas as requisições compartilhem a mesma instância
declare global {
  var __serverLogs: ServerLogs | undefined
}

// Usar instância global ou criar nova
export const serverLogs = global.__serverLogs || new ServerLogs()

if (process.env.NODE_ENV !== 'production') {
  global.__serverLogs = serverLogs
}

// Log inicial para confirmar que está funcionando
serverLogs.add('info', '🔧 Sistema de logs inicializado', 'SYSTEM')
console.log('✅ [SERVER-LOGS] Sistema de logs inicializado!')

// Funções helper para diferentes níveis de log
export const logInfo = (message: string, category?: string, data?: any) => {
  serverLogs.add('info', message, category, data)
}

export const logWarn = (message: string, category?: string, data?: any) => {
  serverLogs.add('warn', message, category, data)
}

export const logError = (message: string, category?: string, data?: any) => {
  serverLogs.add('error', message, category, data)
}

export const logSuccess = (message: string, category?: string, data?: any) => {
  serverLogs.add('success', message, category, data)
}

export const logDebug = (message: string, category?: string, data?: any) => {
  serverLogs.add('debug', message, category, data)
}
