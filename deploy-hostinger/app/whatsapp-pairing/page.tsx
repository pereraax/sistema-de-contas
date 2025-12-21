'use client'

import { useState } from 'react'
import { MessageCircle, CheckCircle, XCircle, Loader2, Phone, Key } from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'

export default function WhatsAppPairingPage() {
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [instanceName, setInstanceName] = useState('plenipay')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [status, setStatus] = useState<{
    step: 'config' | 'waiting_code' | 'connected' | 'error'
    loading: boolean
    message: string
    error: string | null
  }>({
    step: 'config',
    loading: false,
    message: '',
    error: null,
  })

  const testarAPI = async () => {
    if (!apiUrl.trim() || !apiKey.trim()) {
      createNotification('Por favor, preencha a URL e API Key para testar', 'warning')
      return
    }

    setStatus({ ...status, loading: true, error: null })

    try {
      console.log('🧪 [Test] Testando conexão com API...')
      const testResponse = await fetch(`/api/whatsapp/evolution/test?apiUrl=${encodeURIComponent(apiUrl)}&apiKey=${encodeURIComponent(apiKey)}`)
      
      const testData = await testResponse.json()
      console.log('🧪 [Test] Resposta:', testData)

      if (testData.success) {
        createNotification('✅ API está funcionando!', 'success')
        setStatus({
          step: 'config',
          loading: false,
          message: 'API está funcionando corretamente!',
          error: null,
        })
      } else {
        throw new Error(testData.error || 'API não está funcionando')
      }
    } catch (error: any) {
      console.error('❌ [Test] Erro:', error)
      setStatus({
        step: 'error',
        loading: false,
        message: '',
        error: error.message || 'Erro ao testar API',
      })
      createNotification(error.message || 'Erro ao testar API', 'error')
    }
  }

  const solicitarPairingCode = async () => {
    if (!apiUrl.trim() || !apiKey.trim() || !phoneNumber.trim()) {
      createNotification('Por favor, preencha todos os campos', 'warning')
      return
    }

    setStatus({ ...status, loading: true, error: null })

    try {
      console.log('🔄 [Pairing] Iniciando solicitação de pairing code...')
      
      // Primeiro, testar se API está funcionando
      console.log('🧪 [Pairing] Testando API antes...')
      const testResponse = await fetch(`/api/whatsapp/evolution/test?apiUrl=${encodeURIComponent(apiUrl)}&apiKey=${encodeURIComponent(apiKey)}`)
      const testData = await testResponse.json()
      
      if (!testData.success) {
        throw new Error(testData.error || 'API não está respondendo. Verifique se o deploy terminou e se as variáveis estão corretas.')
      }
      
      // Criar instância se não existir
      console.log('📦 [Pairing] Criando instância...')
      const createResponse = await fetch('/api/whatsapp/evolution/create-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl,
          apiKey,
          instanceName,
        }),
      })

      const createData = await createResponse.json()
      console.log('📦 [Pairing] Resposta criar instância:', createData)

      if (!createResponse.ok) {
        throw new Error(createData.error || 'Erro ao criar instância')
      }

      // Solicitar pairing code
      console.log('📱 [Pairing] Solicitando pairing code...')
      const pairingResponse = await fetch('/api/whatsapp/evolution/pairing-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl,
          apiKey,
          instanceName,
          phoneNumber,
        }),
      })

      const pairingData = await pairingResponse.json()
      console.log('📱 [Pairing] Resposta pairing code:', pairingData)

      if (!pairingResponse.ok) {
        throw new Error(pairingData.error || 'Erro ao solicitar pairing code')
      }

      if (pairingData.pairingCode) {
        setPairingCode(pairingData.pairingCode)
        setStatus({
          step: 'waiting_code',
          loading: false,
          message: `Código de pairing: ${pairingData.pairingCode}\n\nVocê receberá um SMS com este código no número ${phoneNumber}\n\nDigite o código abaixo para confirmar:`,
          error: null,
        })
        createNotification('Pairing code gerado! Verifique seu SMS.', 'success')
      } else {
        throw new Error('Pairing code não foi retornado. Resposta: ' + JSON.stringify(pairingData))
      }
    } catch (error: any) {
      console.error('❌ [Pairing] Erro:', error)
      setStatus({
        step: 'error',
        loading: false,
        message: '',
        error: error.message || 'Erro ao solicitar pairing code',
      })
      createNotification(error.message || 'Erro ao solicitar pairing code', 'error')
    }
  }

  const confirmarPairing = async () => {
    if (!pairingCode.trim()) {
      createNotification('Por favor, digite o código recebido por SMS', 'warning')
      return
    }

    setStatus({ ...status, loading: true })

    try {
      console.log('🔐 [Pairing] Confirmando pairing code...')
      const response = await fetch('/api/whatsapp/evolution/confirm-pairing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl,
          apiKey,
          instanceName,
          pairingCode,
        }),
      })

      const data = await response.json()
      console.log('🔐 [Pairing] Resposta confirmar:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao confirmar pairing')
      }

      if (data.connected) {
        setStatus({
          step: 'connected',
          loading: false,
          message: 'WhatsApp conectado com sucesso!',
          error: null,
        })
        createNotification('✅ WhatsApp conectado!', 'success')
      } else {
        throw new Error('Conexão não foi estabelecida. ' + (data.message || ''))
      }
    } catch (error: any) {
      console.error('❌ [Pairing] Erro ao confirmar:', error)
      setStatus({
        step: 'error',
        loading: false,
        message: '',
        error: error.message || 'Erro ao confirmar pairing',
      })
      createNotification(error.message || 'Erro ao confirmar pairing', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <Phone className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Conectar WhatsApp - SEM QR Code!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Use <strong>Pairing Code</strong> - Número + Código SMS 🎉
            </p>
          </div>

          {/* Status */}
          {status.error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300 text-sm">{status.error}</span>
              </div>
            </div>
          )}

          {status.step === 'connected' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">
                  {status.message}
                </span>
              </div>
            </div>
          )}

          {/* Configuração */}
          {status.step === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL da Evolution API
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://evolution-api-vbbp.onrender.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Sua API Key da Evolution API"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="plenipay"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Telefone (com código do país)
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="5511999999999"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Apenas números, com código do país (ex: 55 para Brasil)
                </p>
              </div>

              <button
                onClick={testarAPI}
                disabled={status.loading || !apiUrl.trim() || !apiKey.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-3"
              >
                {status.loading && status.message?.includes('testando') ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testando API...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Testar Conexão com API
                  </>
                )}
              </button>

              <button
                onClick={solicitarPairingCode}
                disabled={status.loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Solicitando código...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    Solicitar Código de Pairing
                  </>
                )}
              </button>
            </div>
          )}

          {/* Aguardando código */}
          {status.step === 'waiting_code' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
                  {status.message}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código Recebido por SMS
                </label>
                <input
                  type="text"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
                />
              </div>

              <button
                onClick={confirmarPairing}
                disabled={status.loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    Confirmar Pairing
                  </>
                )}
              </button>
            </div>
          )}

          {/* Instruções */}
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              📱 Como funciona:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
              <li>Configure a URL da Evolution API (ex: Render gratuito)</li>
              <li>Digite seu número de telefone (com código do país)</li>
              <li>Clique em "Solicitar Código de Pairing"</li>
              <li>Você receberá um SMS com um código</li>
              <li>Digite o código e confirme</li>
              <li>Pronto! WhatsApp conectado! 🎉</li>
            </ol>
          </div>

          {/* Info */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>
              ✅ <strong>100% GRATUITO</strong> - Use Evolution API no Render (gratuito)
            </p>
            <p className="mt-1">
              ✅ <strong>SEM QR CODE</strong> - Apenas número + SMS
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}










