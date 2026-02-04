'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PlenLogEntry {
  id: string
  requestId: string
  timestamp: string
  step: string
  message: string
  data?: unknown
  level?: 'info' | 'warn' | 'error'
}

export default function LogsPlenPage() {
  const [logs, setLogs] = useState<PlenLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [testMessage, setTestMessage] = useState('gastei 50 reais de teste')
  const [testResult, setTestResult] = useState<{ status: number; headers: Record<string, string>; body: unknown; error?: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/plen/logs?limit=80', { cache: 'no-store' })
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (e) {
      setLogs([{ id: '1', requestId: '-', timestamp: new Date().toISOString(), step: 'error', message: 'Falha ao carregar logs: ' + String(e), level: 'error' }])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(fetchLogs, 3000)
    return () => clearInterval(t)
  }, [autoRefresh, fetchLogs])

  const runTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/plen/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: testMessage }),
      })
      const headers: Record<string, string> = {}
      res.headers.forEach((v, k) => { headers[k] = v })
      let body: unknown
      try {
        body = await res.json()
      } catch {
        body = await res.text()
      }
      setTestResult({
        status: res.status,
        headers,
        body,
      })
      await fetchLogs()
    } catch (e: any) {
      setTestResult({
        status: 0,
        headers: {},
        body: null,
        error: e?.message ?? String(e),
      })
    } finally {
      setTesting(false)
    }
  }

  const levelColor = (level?: string) => {
    switch (level) {
      case 'error': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'warn': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
      default: return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs do PLEN – Diagnóstico</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Logs em tempo real da rota <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/api/plen/chat</code>. Use o teste abaixo para simular uma mensagem.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1">
              Se aparecer <strong>Auth session missing!</strong>: faça login na aplicação (menu ou <Link href="/login" className="underline">/login</Link>) no <strong>mesmo navegador</strong> e teste de novo. A API precisa dos cookies de sessão.
            </p>
          </div>
          <Link
            href="/home"
            className="text-sm text-brand-aqua hover:underline"
          >
            ← Voltar ao início
          </Link>
        </div>

        {/* Teste manual */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Testar API agora</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Ex: gastei 50 reais"
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={runTest}
              disabled={testing}
              className="px-4 py-2 rounded-lg bg-brand-aqua text-white font-medium disabled:opacity-50"
            >
              {testing ? 'Enviando…' : 'Enviar e ver resposta'}
            </button>
          </div>
          {testResult && (
            <div className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-sm overflow-x-auto">
              <div className="font-mono space-y-2">
                <div><strong>Status HTTP:</strong> {testResult.status}</div>
                <div><strong>Header X-Plen-Chat:</strong> {testResult.headers['x-plen-chat'] ?? '(não presente)'}</div>
                {testResult.error && <div className="text-red-600 dark:text-red-400">Erro: {testResult.error}</div>}
                <div><strong>Corpo da resposta:</strong></div>
                <pre className="whitespace-pre-wrap break-words mt-1">
                  {JSON.stringify(testResult.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </section>

        {/* Controle de atualização */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Atualizar logs a cada 3 segundos</span>
          </label>
          <button
            type="button"
            onClick={() => fetchLogs()}
            className="text-sm text-brand-aqua hover:underline"
          >
            Atualizar agora
          </button>
        </div>

        {/* Lista de logs */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-gray-700">
            Últimos logs do servidor
          </h2>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando…</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum log ainda. Envie uma mensagem no PLEN ou use o teste acima.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
              {logs.map((entry) => (
                <li
                  key={entry.id}
                  className={`p-3 text-sm font-mono ${levelColor(entry.level)}`}
                >
                  <span className="text-gray-400 dark:text-gray-500 mr-2">
                    {new Date(entry.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                  <span className="font-semibold mr-2">[{entry.step}]</span>
                  <span className="mr-2">{entry.message}</span>
                  {entry.data != null && (
                    <pre className="mt-1 text-xs opacity-90 whitespace-pre-wrap break-all">
                      {typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
