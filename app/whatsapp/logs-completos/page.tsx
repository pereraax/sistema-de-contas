'use client'

import { useEffect, useState } from 'react'

interface WebhookLog {
  timestamp: string
  method: string
  body: any
  response: any
  error?: string
}

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

export default function LogsCompletosPage() {
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [sendLogs, setSendLogs] = useState<SendLog[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      
      const [webhookResponse, sendResponse] = await Promise.all([
        fetch('/api/whatsapp/apifacil/webhook-logs').catch(err => {
          console.error('Erro ao buscar webhook logs:', err)
          return { ok: false, json: async () => ({ success: false, error: err.message }) }
        }),
        fetch('/api/whatsapp/apifacil/send-logs').catch(err => {
          console.error('Erro ao buscar send logs:', err)
          return { ok: false, json: async () => ({ success: false, error: err.message }) }
        }),
      ])
      
      const webhookData = await webhookResponse.json().catch(() => ({ success: false, logs: [] }))
      const sendData = await sendResponse.json().catch(() => ({ success: false, logs: [] }))
      
      if (webhookData.success) {
        setWebhookLogs(webhookData.logs || [])
      } else {
        console.error('Webhook logs error:', webhookData.error || webhookData)
        setWebhookLogs([])
      }
      
      if (sendData.success) {
        setSendLogs(sendData.logs || [])
      } else {
        console.error('Send logs error:', sendData.error || sendData)
        setSendLogs([])
      }
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error)
      setWebhookLogs([])
      setSendLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000)
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Webhook Logs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📨 Logs do Webhook (Mensagens Recebidas)
              </h2>
              <p className="text-gray-600">
                Mensagens que chegaram do apifacil.dev
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
              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Carregando logs...</p>
            </div>
          ) : webhookLogs.length === 0 ? (
            <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-yellow-800 text-lg font-semibold">
                ⚠️ Nenhum log de webhook encontrado
              </p>
              <p className="text-yellow-600 text-sm mt-2">
                O webhook não está recebendo mensagens. Verifique:
              </p>
              <ul className="text-yellow-600 text-sm mt-4 text-left max-w-md mx-auto">
                <li>• Túnel está rodando? (npm run tunnel)</li>
                <li>• URL está correta no apifacil.dev?</li>
                <li>• Servidor está rodando? (npm run dev)</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              {webhookLogs.map((log, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {log.method}
                    </span>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                      📦 Body Recebido
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.body, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Logs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📤 Logs de Envio (Tentativas de Enviar)
              </h2>
              <p className="text-gray-600">
                Tentativas de enviar mensagens via apifacil.dev
              </p>
            </div>
          </div>

          {sendLogs.length === 0 ? (
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
              {sendLogs.map((log, index) => (
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
        </div>

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-sm text-gray-500">
            Webhook: <strong>{webhookLogs.length}</strong> | Envio: <strong>{sendLogs.length}</strong> | Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}



