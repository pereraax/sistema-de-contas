'use client'

import { useEffect, useState, useRef } from 'react'

export default function LogsServidorPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [filter, setFilter] = useState('')
  const [showLimitOnly, setShowLimitOnly] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs/servidor?filter=PLEN WhatsApp')
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.logs || [])
      } else {
        console.error('❌ [Logs Page] Erro na resposta:', data.error)
      }
    } catch (error: any) {
      console.error('❌ [Logs Page] Erro ao buscar logs:', error)
      console.error('❌ [Logs Page] Erro completo:', {
        message: error.message,
        stack: error.stack
      })
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

  // Auto-scroll para o final
  useEffect(() => {
    if (logsEndRef.current && autoRefresh) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoRefresh])

  // Filtrar logs - mostrar todos os logs ou apenas do limite
  const filteredLogs = logs.filter(log => {
    // Se "Mostrar apenas limite" estiver ativado
    if (showLimitOnly) {
      const isLimitRelated = 
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
      
      if (!isLimitRelated) return false
    }
    
    // Aplicar filtro manual se existir
    if (filter !== '') {
      return log.toLowerCase().includes(filter.toLowerCase())
    }
    
    return true
  })
  
  // Extrair estatísticas dos logs do limite
  const limitStats = {
    endpointCalled: logs.filter(l => l.includes('ENDPOINT CHAMADO')).length,
    planoTesteDetected: logs.filter(l => l.includes('PLANO TESTE - VERIFICANDO LIMITE')).length,
    enviosRegistrados: logs.filter(l => l.includes('ENVIO REGISTRADO')).length,
    erros: logs.filter(l => l.includes('ERRO AO INSERIR')).length,
    limitesExcedidos: logs.filter(l => l.includes('LIMITE EXCEDIDO')).length,
    totalEnviostLogs: logs.filter(l => l.includes('Total de envios')).length
  }

  const formatLog = (log: string) => {
    // Destacar diferentes tipos de logs com cores mais vibrantes
    if (log.includes('🔥🔥🔥') || log.includes('PLANO TESTE - VERIFICANDO LIMITE')) {
      return <span className="text-orange-500 font-bold text-xl bg-orange-900/30 px-2 py-1 rounded block">{log}</span>
    }
    if (log.includes('🚀🚀🚀') || log.includes('ENDPOINT CHAMADO')) {
      return <span className="text-blue-400 font-bold text-lg">{log}</span>
    }
    if (log.includes('DETECÇÃO DE PLANO') || log.includes('Profile.plano')) {
      return <span className="text-purple-400 font-semibold">{log}</span>
    }
    if (log.includes('✅ ENVIO REGISTRADO') || log.includes('SUCESSO')) {
      return <span className="text-green-400 font-bold bg-green-900/30 px-2 py-1 rounded">{log}</span>
    }
    if (log.includes('❌ ERRO AO INSERIR') || (log.includes('ERRO') && log.includes('INSERIR'))) {
      return <span className="text-red-400 font-bold bg-red-900/30 px-2 py-1 rounded block">{log}</span>
    }
    if (log.includes('📊') || log.includes('Total de envios')) {
      return <span className="text-cyan-400 font-semibold text-lg">{log}</span>
    }
    if (log.includes('📝') || log.includes('Inserindo envio')) {
      return <span className="text-purple-400 font-semibold">{log}</span>
    }
    if (log.includes('🔍') || log.includes('VERIFICANDO') || log.includes('DETECÇÃO')) {
      return <span className="text-yellow-400">{log}</span>
    }
    if (log.includes('⚠️') || log.includes('LIMITE EXCEDIDO')) {
      return <span className="text-orange-400 font-bold text-lg bg-orange-900/30 px-2 py-1 rounded">{log}</span>
    }
    if (log.includes('❌') || log.includes('ERRO')) {
      return <span className="text-red-400 font-bold">{log}</span>
    }
    if (log.includes('✅')) {
      return <span className="text-green-400">{log}</span>
    }
    return <span className="text-gray-300">{log}</span>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <span className="text-orange-500">🔥</span>
            Logs do Limite de 7 Mensagens WhatsApp
          </h1>
          <p className="text-gray-400">
            Monitoramento em tempo real do limite de mensagens para plano TESTE
          </p>
        </div>

        {/* Estatísticas do Limite */}
        {logs.length > 0 && (
          <div className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-2 border-orange-600 rounded-lg p-4 mb-4">
            <h2 className="text-xl font-bold text-orange-400 mb-3">📊 Estatísticas do Limite</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <div className="text-gray-400 text-xs">Endpoint Chamado</div>
                <div className="text-2xl font-bold text-blue-400">{limitStats.endpointCalled}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Plano Teste Detectado</div>
                <div className="text-2xl font-bold text-orange-400">{limitStats.planoTesteDetected}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Envios Registrados</div>
                <div className="text-2xl font-bold text-green-400">{limitStats.enviosRegistrados}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Erros</div>
                <div className="text-2xl font-bold text-red-400">{limitStats.erros}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Limites Excedidos</div>
                <div className="text-2xl font-bold text-red-500">{limitStats.limitesExcedidos}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs">Total de Verificações</div>
                <div className="text-2xl font-bold text-cyan-400">{limitStats.totalEnviostLogs}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Atualização automática (2s)</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLimitOnly}
                onChange={(e) => setShowLimitOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-orange-400 font-semibold">🔥 Mostrar apenas logs do limite</span>
            </label>
            
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9c-6.22 0-9.12 5.06-9 9 0 6.22 5.06 9.12 9 9a9 9 0 0 0 9-9Z"/><path d="M17 2.5V9H2.5"/></svg>
              Atualizar Agora
            </button>

            <span className="text-gray-400 ml-auto">
              {filteredLogs.length} / {logs.length} logs
            </span>
          </div>
          
          <input
            type="text"
            placeholder="Filtrar logs (ex: 'ENVIO REGISTRADO', 'ERRO', 'Total de envios')..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="bg-black rounded-lg p-4 font-mono text-sm overflow-auto" style={{ maxHeight: '70vh' }}>
          {loading && logs.length === 0 ? (
            <div className="text-gray-400">Carregando logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-gray-400">
              {filter ? 'Nenhum log encontrado com o filtro.' : (
                <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-600 rounded">
                  <strong className="text-yellow-400">⚠️ Nenhum log disponível</strong>
                  <br />
                  <br />
                  <div className="text-sm">
                    <p>Possíveis causas:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Nenhuma mensagem foi enviada ainda</li>
                      <li>O sistema de logs não está funcionando</li>
                      <li>Os logs estão em outro processo (serverless)</li>
                    </ul>
                    <br />
                    <p className="text-yellow-300">
                      💡 <strong>Teste:</strong> Acesse <code className="bg-gray-800 px-1 rounded">/api/logs/test-direct</code> para testar o sistema de logs.
                    </p>
                    <p className="text-yellow-300 mt-2">
                      💡 <strong>Verifique:</strong> O console do Render pode ter os logs mesmo que não apareçam aqui.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {filteredLogs.map((log, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap break-words">
                  {formatLog(log)}
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <h3 className="font-bold text-blue-400 mb-3 text-lg">📋 O que procurar nos logs:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-2">✅ Fluxo Normal (deve aparecer):</h4>
              <ul className="space-y-1 text-gray-300">
                <li>🚀 <code className="bg-gray-800 px-1 rounded">ENDPOINT CHAMADO</code> - Endpoint foi acionado</li>
                <li>🔍 <code className="bg-gray-800 px-1 rounded">DETECÇÃO DE PLANO</code> - Detectou o plano do usuário</li>
                <li>🔥 <code className="bg-gray-800 px-1 rounded">PLANO TESTE - VERIFICANDO LIMITE</code> - Se plano for "teste"</li>
                <li>📊 <code className="bg-gray-800 px-1 rounded">Total de envios: X / 7</code> - Contagem atual</li>
                <li>📝 <code className="bg-gray-800 px-1 rounded">Inserindo envio</code> - Tentando inserir</li>
                <li>✅ <code className="bg-gray-800 px-1 rounded">ENVIO REGISTRADO! ID: ...</code> - Sucesso!</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">❌ Problemas (copie o erro completo):</h4>
              <ul className="space-y-1 text-gray-300">
                <li>❌ <code className="bg-gray-800 px-1 rounded">ERRO AO INSERIR</code> - Erro ao inserir na tabela</li>
                <li>⚠️ <code className="bg-gray-800 px-1 rounded">LIMITE EXCEDIDO</code> - Usuário excedeu 7 envios</li>
                <li>❌ <code className="bg-gray-800 px-1 rounded">ERRO ao contar envios</code> - Problema na contagem</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

