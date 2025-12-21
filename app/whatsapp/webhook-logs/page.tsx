'use client'

import { useEffect, useState } from 'react'

interface WebhookLog {
  timestamp: string
  method: string
  body: any
  response: any
  error?: string
}

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/whatsapp/apifacil/logs')
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
      const interval = setInterval(fetchLogs, 2000) // Atualizar a cada 2 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Logs do Webhook</h1>
              <p className="text-gray-600 mt-2">
                Monitoramento em tempo real das mensagens recebidas
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
                <span className="text-sm text-gray-700">Auto-atualizar</span>
              </label>
              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum log encontrado</h2>
              <p className="text-gray-600 mb-4">
                O webhook não está recebendo mensagens do apifacil.dev
              </p>
              <div className="bg-white rounded-lg p-4 text-left max-w-2xl mx-auto">
                <h3 className="font-bold mb-2">🔍 Verificações necessárias:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>Túnel está rodando? (`npm run tunnel`)</li>
                  <li>Servidor está rodando? (`npm run dev`)</li>
                  <li>URL está correta no painel do apifacil.dev?</li>
                  <li>Webhook está ativado no painel?</li>
                  <li>Evento MENSAGEM_RECEBIDA está marcado?</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold">
                  ✅ {logs.length} requisição(ões) recebida(s)
                </p>
              </div>
              
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {log.method}
                      </span>
                    </div>
                    {log.error && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                        Erro
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Body recebido:</h3>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                      {JSON.stringify(log.body, null, 2)}
                    </pre>
                  </div>
                  
                  {log.response && (
                    <div className="mt-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Resposta:</h3>
                      <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-xs">
                        {JSON.stringify(log.response, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {log.error && (
                    <div className="mt-3">
                      <h3 className="text-sm font-semibold text-red-700 mb-2">Erro:</h3>
                      <pre className="bg-red-50 text-red-800 p-4 rounded-lg overflow-x-auto text-xs">
                        {log.error}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}









