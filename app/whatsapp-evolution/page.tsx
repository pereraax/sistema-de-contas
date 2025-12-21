'use client'

import { useState } from 'react'
import { MessageCircle, QrCode, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createNotification } from '@/components/NotificationBell'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function WhatsAppEvolutionPage() {
  const router = useRouter()
  const [apiUrl, setApiUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [instanceName, setInstanceName] = useState('plenipay')
  const [status, setStatus] = useState<{
    connected: boolean
    loading: boolean
    qr: string | null
    error: string | null
  }>({
    connected: false,
    loading: false,
    qr: null,
    error: null,
  })

  const conectar = async () => {
    if (!apiUrl.trim() || !apiKey.trim()) {
      createNotification('Por favor, preencha a URL da API e a API Key', 'warning')
      return
    }

    setStatus({ ...status, loading: true, error: null })

    try {
      // Criar instância
      const createResponse = await fetch(`${apiUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instanceName,
          token: apiKey,
          qrcode: true,
        }),
      })

      if (!createResponse.ok) {
        const error = await createResponse.json().catch(() => ({ message: 'Erro ao criar instância' }))
        throw new Error(error.message || 'Erro ao criar instância')
      }

      // Obter QR Code
      const qrResponse = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
      })

      if (!qrResponse.ok) {
        throw new Error('Erro ao obter QR Code')
      }

      const qrData = await qrResponse.json()
      
      if (qrData.qrcode?.base64) {
        setStatus({
          connected: false,
          loading: false,
          qr: `data:image/png;base64,${qrData.qrcode.base64}`,
          error: null,
        })
        createNotification('QR Code gerado! Escaneie com seu WhatsApp.', 'success')
      } else if (qrData.qrcode?.code) {
        // QR Code como string
        const QRCode = (await import('qrcode')).default
        const qrImage = await QRCode.toDataURL(qrData.qrcode.code)
        setStatus({
          connected: false,
          loading: false,
          qr: qrImage,
          error: null,
        })
        createNotification('QR Code gerado! Escaneie com seu WhatsApp.', 'success')
      } else {
        throw new Error('QR Code não encontrado na resposta')
      }

      // Verificar status periodicamente
      const checkStatus = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
              'apikey': apiKey,
            },
          })

          const instances = await statusResponse.json()
          const instance = instances.find((i: any) => i.instance.instanceName === instanceName)

          if (instance?.instance?.status === 'open') {
            clearInterval(checkStatus)
            setStatus({
              connected: true,
              loading: false,
              qr: null,
              error: null,
            })
            createNotification('WhatsApp conectado com sucesso!', 'success')
            
            // Salvar configuração
            localStorage.setItem('evolution_api_url', apiUrl)
            localStorage.setItem('evolution_api_key', apiKey)
            localStorage.setItem('evolution_instance_name', instanceName)
            
            setTimeout(() => {
              router.push('/home')
            }, 2000)
          }
        } catch (error) {
          // Continuar verificando
        }
      }, 3000)

    } catch (error: any) {
      console.error('Erro ao conectar:', error)
      setStatus({
        connected: false,
        loading: false,
        qr: null,
        error: error.message || 'Erro ao conectar',
      })
      createNotification(`Erro: ${error.message}`, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Conectar WhatsApp (Evolution API)
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Método alternativo mais confiável
          </p>
        </div>

        {/* Campos de Configuração */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL da Evolution API
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://sua-evolution-api.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              placeholder="Sua API Key"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-center gap-2">
            {status.loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conectando...
                </span>
              </>
            ) : status.connected ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Conectado com sucesso!
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Desconectado
                </span>
              </>
            )}
          </div>
        </div>

        {/* QR Code */}
        {status.qr && (
          <div className="mb-6 p-6 bg-white dark:bg-gray-700 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Escaneie o QR Code
              </h3>
            </div>
            <div className="flex justify-center mb-4">
              <img
                src={status.qr}
                alt="QR Code WhatsApp"
                className="w-64 h-64 border-4 border-green-500 rounded-lg shadow-lg"
              />
            </div>
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">
              Abra o WhatsApp no seu celular → Menu (3 pontos) → Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        )}

        {/* Erro */}
        {status.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400 text-center">
              {status.error}
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="space-y-3">
          <button
            onClick={conectar}
            disabled={status.loading || !apiUrl.trim() || !apiKey.trim()}
            className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status.loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                Conectar WhatsApp
              </>
            )}
          </button>

          <div className="text-center">
            <a
              href="https://railway.app/template/evolution-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              Criar Evolution API grátis no Railway <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={() => router.push('/home')}
            className="w-full px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors"
          >
            Voltar para Home
          </button>
        </div>

        {/* Instruções */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Como obter Evolution API grátis:
          </h3>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Acesse <a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="underline">Railway.app</a> e crie conta grátis</li>
            <li>Clique em "New Project" → "Deploy from GitHub"</li>
            <li>Use o template: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">evolution-api</code></li>
            <li>Copie a URL e API Key geradas</li>
            <li>Cole acima e clique em "Conectar WhatsApp"</li>
          </ol>
        </div>
      </div>
    </div>
  )
}












