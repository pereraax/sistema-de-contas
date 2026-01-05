'use client'

import { useEffect, useState, useRef } from 'react'

export default function LogsLimiteWhatsAppPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [stats, setStats] = useState<{
    totalLogs: number
    logsInMemory: number
    timestamp: string
  } | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs/servidor?filter=PLEN WhatsApp')
      const data = await response.json()
      
      if (data.success) {
        // Filtrar apenas logs relevantes ao limite
        const relevantLogs = (data.logs || []).filter((log: string) => 
          log.includes('[PLEN WhatsApp]') ||
          log.includes('PLANO TESTE') ||
          log.includes('VERIFICANDO LIMITE') ||
          log.includes('Total de envios') ||
          log.includes('Inserindo envio') ||
          log.includes('ENVIO REGISTRADO') ||
          log.includes('ERRO AO INSERIR') ||
          log.includes('DETECÇÃO DE PLANO') ||
          log.includes('ENDPOINT CHAMADO') ||
          log.includes('🔥') ||
          log.includes('📊') ||
          log.includes('📝') ||
          log.includes('✅') ||
          log.includes('❌')
        )
        
        setLogs(relevantLogs)
        setStats({
          totalLogs: relevantLogs.length,
          logsInMemory: data.logsInMemory || 0,
          timestamp: data.timestamp || new Date().toISOString()
        })
      } else {
        console.error('Erro ao buscar logs:', data.error)
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

  useEffect(() => {
    if (logsEndRef.current && autoRefresh) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoRefresh])

  const formatLog = (log: string) => {
    // Logs críticos do limite
    if (log.includes('🔥🔥🔥') || log.includes('PLANO TESTE - VERIFICANDO LIMITE')) {
      return <span className="text-orange-500 font-bold text-xl bg-orange-900/30 px-2 py-1 rounded">{log}</span>
    }
    // Endpoint chamado
    if (log.includes('🚀🚀🚀') || log.includes('ENDPOINT CHAMADO')) {
      return <span className="text-blue-400 font-bold text-lg">{log}</span>
    }
    // Detecção de plano
    if (log.includes('DETECÇÃO DE PLANO') || log.includes('Profile.plano')) {
      return <span className="text-purple-400 font-semibold">{log}</span>
    }
    // Sucesso na inserção
    if (log.includes('✅ ENVIO REGISTRADO') || log.includes('SUCESSO')) {
      return <span className="text-green-400 font-bold">{log}</span>
    }
    // Erro na inserção
    if (log.includes('❌ ERRO AO INSERIR') || log.includes('ERRO')) {
      return <span className="text-red-400 font-bold bg-red-900/30 px-2 py-1 rounded">{log}</span>
    }
    // Contagem de envios
    if (log.includes('📊') || log.includes('Total de envios')) {
      return <span className="text-cyan-400 font-semibold text-lg">{log}</span>
    }
    // Inserindo envio
    if (log.includes('📝') || log.includes('Inserindo envio')) {
      return <span className="text-purple-400 font-semibold">{log}</span>
    }
    // Warning
    if (log.includes('⚠️') || log.includes('WARN') || log.includes('LIMITE EXCEDIDO')) {
      return <span className="text-orange-400 font-semibold">{log}</span>
    }
    return <span className="text-gray-300">{log}</span>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <span className="text-orange-500">🔥</span>
            Logs do Limite de 7 Mensagens WhatsApp
          </h1>
          <p className="text-gray-400 text-lg">
            Monitoramento em tempo real do limite de mensagens para plano TESTE
          </p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4 grid grid-cols-3 gap-4">
            <div>
              <div className="text-gray-400 text-sm">Total de Logs</div>
              <div className="text-2xl font-bold text-blue-400">{stats.totalLogs}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Logs em Memória</div>
              <div className="text-2xl font-bold text-green-400">{stats.logsInMemory}</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Última Atualização</div>
              <div className="text-sm font-mono text-yellow-400">
                {new Date(stats.timestamp).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Atualização automática (2s)</span>
          </label>
          
          <button
            onClick={() => {
              setLoading(true)
              fetchLogs()
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9c-6.22 0-9.12 5.06-9 9 0 6.22 5.06 9.12 9 9a9 9 0 0 0 9-9Z"/><path d="M17 2.5V9H2.5"/></svg>
            Atualizar Agora
          </button>
        </div>

        {/* Área de Logs */}
        <div className="bg-black rounded-lg p-6 font-mono text-sm overflow-auto border-2 border-gray-700" style={{ maxHeight: '70vh' }}>
          {loading && logs.length === 0 ? (
            <div className="text-gray-400">Carregando logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-gray-400 space-y-4">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">📭</div>
                <h2 className="text-2xl font-bold mb-2">Nenhum log encontrado</h2>
                <p className="mb-4">
                  Os logs aparecerão aqui quando você enviar mensagens via WhatsApp.
                </p>
                <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 text-left max-w-2xl mx-auto">
                  <p className="font-bold text-yellow-400 mb-2">💡 Para ver os logs:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Envie uma mensagem via WhatsApp (ex: "ganhei 30 reais")</li>
                    <li>Os logs devem aparecer automaticamente aqui</li>
                    <li>Procure por logs que começam com <code className="bg-gray-800 px-1 rounded">🔥🔥🔥 PLANO TESTE</code></li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <>
              {logs.map((log, index) => (
                <div key={index} className="mb-2 whitespace-pre-wrap break-words border-b border-gray-800 pb-2 last:border-b-0">
                  {formatLog(log)}
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </div>

        {/* Instruções */}
        <div className="mt-6 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <h3 className="font-bold text-blue-400 mb-2">📋 O que procurar nos logs:</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-orange-400 font-bold">🔥 PLANO TESTE - VERIFICANDO LIMITE</span> - 
              Deve aparecer quando o plano é "teste"
            </li>
            <li>
              <span className="text-cyan-400 font-bold">📊 Total de envios: X / 7</span> - 
              Mostra quantos envios já foram feitos
            </li>
            <li>
              <span className="text-purple-400 font-bold">📝 Inserindo envio: entrada</span> - 
              Quando está tentando inserir na tabela
            </li>
            <li>
              <span className="text-green-400 font-bold">✅ ENVIO REGISTRADO! ID: ...</span> - 
              Quando a inserção foi bem-sucedida
            </li>
            <li>
              <span className="text-red-400 font-bold">❌ ERRO AO INSERIR! ...</span> - 
              Se aparecer, copie o erro completo para corrigir
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

