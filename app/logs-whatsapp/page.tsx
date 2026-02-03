'use client'

import { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface LogEntry {
  timestamp: string
  level: 'log' | 'error' | 'warn' | 'info'
  message: string
}

export default function LogsWhatsAppPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [filter, setFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/logs/plen-whatsapp?limit=500${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`)
      const data = await response.json()
      
      console.log('📊 [Logs Page] Resposta da API:', {
        success: data.success,
        total: data.total,
        totalAll: data.totalAll,
        logsCount: data.logs?.length,
        debug: data.debug
      })
      
      if (data.success) {
        setLogs(data.logs || [])
        setLastUpdate(new Date())
      } else {
        console.error('❌ [Logs Page] Erro na resposta:', data.error)
      }
    } catch (error) {
      console.error('❌ [Logs Page] Erro ao buscar logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    
    if (isAutoRefresh) {
      const interval = setInterval(fetchLogs, 2000) // Atualizar a cada 2 segundos
      return () => clearInterval(interval)
    }
  }, [isAutoRefresh, filter])

  useEffect(() => {
    // Scroll automático para o final quando novos logs chegarem
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-900/20 border-red-500/30'
      case 'warn':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
      case 'info':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30'
      default:
        return 'text-gray-300 bg-gray-800/50 border-gray-700/30'
    }
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return '❌'
      case 'warn':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📝'
    }
  }

  const filteredLogs = filter
    ? logs.filter(log => log.message.toLowerCase().includes(filter.toLowerCase()))
    : logs

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-brand-clean p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-clean mb-2">
            📋 Logs do WhatsApp (PLEN)
          </h1>
          <p className="text-gray-400">
            Visualize os logs em tempo real do processamento de mensagens do WhatsApp
          </p>
        </div>

        {/* Controls */}
        <div className="bg-brand-royal rounded-xl p-4 mb-6 border border-white/10">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoRefresh}
                  onChange={(e) => setIsAutoRefresh(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-brand-midnight text-brand-aqua focus:ring-brand-aqua"
                />
                <span className="text-sm text-gray-300">
                  Auto-atualizar (2s)
                </span>
              </label>
              
              <button
                onClick={fetchLogs}
                disabled={isLoading}
                className="px-4 py-2 bg-brand-aqua text-white rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? '🔄 Atualizando...' : '🔄 Atualizar Agora'}
              </button>
            </div>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="🔍 Filtrar logs (ex: 'múltiplos', 'processando', 'erro')..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean placeholder-gray-500 focus:outline-none focus:border-brand-aqua focus:ring-2 focus:ring-brand-aqua/20"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
            <span>📊 Total de logs: {filteredLogs.length}</span>
            <span>🕐 Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}</span>
          </div>
        </div>

        {/* Logs Container */}
        <div className="bg-brand-royal rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 bg-brand-midnight/50 border-b border-white/10">
            <h2 className="text-lg font-semibold text-brand-clean">
              Logs em Tempo Real
            </h2>
          </div>
          
          <div className="h-[600px] overflow-y-auto p-4 font-mono text-sm">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin text-2xl">🔄</div>
                    <p>Carregando logs...</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-2">📭 Nenhum log encontrado</p>
                    <p className="text-sm">
                      {filter ? 'Tente remover o filtro ou aguarde novos logs' : 'Aguarde mensagens do WhatsApp para ver os logs'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log, index) => {
                  const timestamp = new Date(log.timestamp)
                  const timeStr = format(timestamp, "HH:mm:ss.SSS", { locale: ptBR })
                  const dateStr = format(timestamp, "dd/MM/yyyy", { locale: ptBR })
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getLogLevelColor(log.level)} break-words`}
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-lg">{getLogIcon(log.level)}</span>
                        <span className="text-xs text-gray-400 font-mono">
                          {dateStr} {timeStr}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-black/30">
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-7 text-sm whitespace-pre-wrap">
                        {log.message}
                      </div>
                    </div>
                  )
                })}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-brand-royal rounded-xl p-4 border border-white/10">
          <h3 className="text-lg font-semibold text-brand-clean mb-2">
            💡 Como usar:
          </h3>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Os logs são atualizados automaticamente a cada 2 segundos</li>
            <li>Use o filtro para buscar logs específicos (ex: "múltiplos", "processando")</li>
            <li>Envie uma mensagem via WhatsApp com múltiplos registros para ver os logs</li>
            <li>Os logs mais recentes aparecem no final</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

