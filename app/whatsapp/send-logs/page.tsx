'use client'

import { useEffect, useState } from 'react'

// Forçar renderização dinâmica - desabilita prerendering completamente
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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

export default function SendLogsPage() {
  const [logs, setLogs] = useState<SendLog[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [dismissedErrors, setDismissedErrors] = useState<string[]>([])
  const [filterErrors, setFilterErrors] = useState(false)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/whatsapp/apifacil/send-logs')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000) // Atualiza a cada 2 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return timestamp
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📤 Logs de Envio de Mensagens
              </h1>
              <p className="text-gray-600">
                Visualize todas as tentativas de envio de mensagens via WhatsApp
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Atualizar automaticamente</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterErrors}
                  onChange={(e) => setFilterErrors(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Mostrar apenas erros</span>
              </label>
              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>

          {/* Banner de Erros - Só mostra se houver erros reais */}
          {(() => {
            const errorLogs = logs.filter(log => log.error && !dismissedErrors.includes(log.timestamp))
            if (errorLogs.length === 0) return null
            
            return (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 text-2xl">⚠️</span>
                    <div>
                      <h3 className="text-red-800 font-semibold">
                        {errorLogs.length} {errorLogs.length === 1 ? 'erro encontrado' : 'erros encontrados'}
                      </h3>
                      <p className="text-red-600 text-sm mt-1">
                        Algumas mensagens falharam ao serem enviadas. Verifique os detalhes abaixo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Marcar todos os erros como dispensados
                      setDismissedErrors(errorLogs.map(log => log.timestamp))
                    }}
                    className="text-red-600 hover:text-red-800 font-bold text-xl px-2"
                    title="Dispensar aviso"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })()}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                📭 Nenhum log de envio encontrado
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Envie "oi" pelo WhatsApp para gerar logs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(filterErrors ? logs.filter(log => log.error) : logs).map((log, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    log.success
                      ? 'border-green-200 bg-green-50'
                      : log.error
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {log.success ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                            ✅ SUCESSO
                          </span>
                        ) : log.error ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                            ❌ ERRO
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                            ⚠️ TENTANDO
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Para:</span>{' '}
                          <span className="text-gray-900">{log.phoneNumber}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Endpoint:</span>{' '}
                          <span className="text-gray-900 font-mono text-xs">
                            {log.method} {log.endpoint}
                          </span>
                        </div>
                        {log.status && (
                          <div>
                            <span className="font-semibold text-gray-700">Status:</span>{' '}
                            <span
                              className={`font-semibold ${
                                log.status >= 200 && log.status < 300
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {log.status} {log.statusText}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="font-semibold text-gray-700 text-sm">Mensagem:</span>
                      <p className="text-gray-900 mt-1 bg-white p-2 rounded border text-sm">
                        {log.message.substring(0, 200)}
                        {log.message.length > 200 && '...'}
                      </p>
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                        📦 Payload Enviado
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </details>

                    {log.response && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                          📥 Resposta Recebida
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </details>
                    )}

                    {log.error && (
                      <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded">
                        <span className="font-semibold text-red-800 text-sm">❌ Erro:</span>
                        <p className="text-red-900 text-sm mt-1">{log.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-gray-500 text-center">
              Total de logs: <strong>{logs.length}</strong> | 
              {' '}Sucessos: <strong className="text-green-600">{logs.filter(l => l.success).length}</strong> | 
              {' '}Erros: <strong className="text-red-600">{logs.filter(l => l.error).length}</strong> | 
              {' '}Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}









