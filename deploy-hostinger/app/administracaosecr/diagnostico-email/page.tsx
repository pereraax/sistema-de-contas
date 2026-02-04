'use client'

import { useState } from 'react'
import { Terminal, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function DiagnosticoEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleDiagnostico = async () => {
    if (!email) {
      alert('Digite um email')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/diagnosticar-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: 'Erro ao executar diagnóstico',
        details: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-clean flex items-center gap-3">
          <Terminal size={32} className="text-brand-aqua" />
          Diagnóstico de Email
        </h1>
        <p className="text-brand-cloud mt-2">Diagnostique por que o email não está sendo enviado</p>
      </div>

      {/* Formulário */}
      <div className="bg-brand-royal/30 border border-white/10 rounded-xl p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-clean mb-2">
              Email para Diagnosticar
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              className="w-full px-4 py-3 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean placeholder-brand-cloud focus:outline-none focus:border-brand-aqua"
            />
          </div>

          <button
            onClick={handleDiagnostico}
            disabled={loading || !email}
            className="w-full px-4 py-3 bg-brand-aqua text-white rounded-lg font-semibold hover:bg-brand-aqua/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Diagnosticando...
              </>
            ) : (
              <>
                <Mail size={20} />
                Executar Diagnóstico
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div className={`border rounded-xl p-6 ${
          result.success 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-start gap-3 mb-4">
            {result.success ? (
              <CheckCircle size={24} className="text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={24} className="text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h2 className={`text-xl font-bold mb-2 ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.success ? '✅ Diagnóstico Concluído' : '❌ Problema Detectado'}
              </h2>
              <p className="text-brand-cloud">
                {result.success ? result.message : result.error}
              </p>
            </div>
          </div>

          {result.diagnostics && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-brand-clean">Diagnósticos:</h3>
              <ul className="space-y-1">
                {result.diagnostics.map((diag: string, i: number) => (
                  <li key={i} className="text-sm text-brand-cloud flex items-start gap-2">
                    <span>•</span>
                    <span>{diag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.details && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-brand-clean">Detalhes do Erro:</h3>
              <div className="bg-brand-midnight rounded-lg p-3 font-mono text-xs text-brand-cloud">
                <pre>{JSON.stringify(result.details, null, 2)}</pre>
              </div>
            </div>
          )}

          {result.suggestions && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-brand-clean">Sugestões:</h3>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion: string, i: number) => (
                  <li key={i} className="text-sm text-brand-cloud flex items-start gap-2">
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.note && (
            <div className="mt-4 p-3 bg-brand-royal/30 rounded-lg">
              <p className="text-sm text-brand-cloud">{result.note}</p>
            </div>
          )}
        </div>
      )}

      {/* Instruções */}
      <div className="bg-brand-royal/30 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-brand-clean mb-3">📋 Como Usar</h3>
        <ol className="space-y-2 text-sm text-brand-cloud list-decimal list-inside">
          <li>Digite o email do usuário que criou conta</li>
          <li>Clique em "Executar Diagnóstico"</li>
          <li>O sistema vai tentar enviar email e mostrar o resultado</li>
          <li>Se houver erro, o diagnóstico mostrará a causa</li>
          <li>Verifique os logs em <code className="bg-brand-midnight px-2 py-1 rounded">/administracaosecr/logs</code></li>
        </ol>
      </div>
    </div>
  )
}
