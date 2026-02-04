'use client'

import { useEffect, useState, useRef } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface LogEntry {
  timestamp: string
  level: 'log' | 'error' | 'warn' | 'info'
  message: string
}

interface DetailedEntry {
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

export default function LogsWhatsAppPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [detailed, setDetailed] = useState<DetailedEntry[]>([])
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [filter, setFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'detailed' | 'server'>('detailed')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/logs/plen-whatsapp?limit=500${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`)
      const data = await response.json()
      
      if (data.success) {
        setDetailed(data.detailed || [])
        setLogs(data.serverLogs || [])
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

  const stepColor = (step: string) => {
    switch (step) {
      case 'error': return 'border-red-500/50 bg-red-900/20'
      case 'invalid_result': return 'border-amber-500/50 bg-amber-900/20'
      case 'response': return 'border-green-500/30 bg-green-900/10'
      default: return 'border-gray-500/30 bg-gray-800/30'
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-brand-clean p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-clean mb-2">
            📋 Logs do WhatsApp (PLEN)
          </h1>
          <p className="text-gray-400">
            Últimas tentativas (request → response → erro). Use para ver por que o assistente respondeu com erro.
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

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('detailed')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'detailed' ? 'bg-brand-aqua text-white' : 'bg-brand-midnight text-gray-400'}`}
              >
                Tentativas (request/response)
              </button>
              <button
                onClick={() => setActiveTab('server')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'server' ? 'bg-brand-aqua text-white' : 'bg-brand-midnight text-gray-400'}`}
              >
                Linhas do servidor
              </button>
            </div>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="🔍 Filtrar (só na aba Linhas)..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean placeholder-gray-500 focus:outline-none focus:border-brand-aqua focus:ring-2 focus:ring-brand-aqua/20"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
            <span>📊 Tentativas: {detailed.length}</span>
            <span>🕐 Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}</span>
          </div>
        </div>

        {/* Logs Container */}
        <div className="bg-brand-royal rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 bg-brand-midnight/50 border-b border-white/10">
            <h2 className="text-lg font-semibold text-brand-clean">
              {activeTab === 'detailed' ? 'Últimas tentativas (URL, status, resposta, erro)' : 'Logs em tempo real (servidor)'}
            </h2>
          </div>
          
          <div className="h-[600px] overflow-y-auto p-4 font-mono text-sm">
            {activeTab === 'detailed' ? (
              detailed.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin text-2xl">🔄</div>
                      <p>Carregando...</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">📭 Nenhuma tentativa registrada</p>
                      <p className="text-sm">Envie uma mensagem pelo WhatsApp (ex: &quot;gastei 50&quot;) e aguarde alguns segundos.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {detailed.map((entry) => (
                    <div key={entry.id} className={`p-4 rounded-xl border ${stepColor(entry.step)} break-words`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-400">
                          {format(new Date(entry.timestamp), "dd/MM HH:mm:ss", { locale: ptBR })}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-black/30">
                          {entry.step}
                        </span>
                      </div>
                      {entry.url && <p className="text-xs text-cyan-300 mb-1"><strong>URL:</strong> {entry.url}</p>}
                      {entry.userId && <p className="text-xs text-gray-400 mb-1"><strong>userId:</strong> {entry.userId}</p>}
                      {entry.message != null && <p className="text-xs text-gray-300 mb-1"><strong>mensagem:</strong> {entry.message}</p>}
                      {entry.status != null && <p className="text-xs mb-1"><strong>HTTP:</strong> {entry.status} {entry.statusText || ''}</p>}
                      {entry.responseBody != null && (
                        <pre className="text-xs bg-black/40 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                          {entry.responseBody}
                        </pre>
                      )}
                      {entry.responseParsed != null && (
                        <pre className="text-xs bg-black/40 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(entry.responseParsed, null, 2)}
                        </pre>
                      )}
                      {entry.plenResult != null && (
                        <p className="text-xs mt-1"><strong>plenResult:</strong> {JSON.stringify(entry.plenResult)}</p>
                      )}
                      {entry.error && <p className="text-red-400 text-xs mt-1"><strong>erro:</strong> {entry.error}</p>}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )
            ) : (
              filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Nenhum log do servidor com &quot;WhatsApp PLEN&quot;.
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
                          <span className="text-xs text-gray-400 font-mono">{dateStr} {timeStr}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-black/30">{log.level.toUpperCase()}</span>
                        </div>
                        <div className="ml-7 text-sm whitespace-pre-wrap">{log.message}</div>
                      </div>
                    )
                  })}
                  <div ref={logsEndRef} />
                </div>
              )
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

