'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, QrCode, CheckCircle, XCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function WhatsAppWebJSConnectPage() {
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

  // Verificar status inicial
  useEffect(() => {
    verificarStatus()
  }, [])

  const verificarStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/webjs/connect')
      const data = await response.json()
      
      setStatus({
        connected: data.connected || false,
        loading: false,
        qr: data.qr || null,
        error: null,
      })
    } catch (error: any) {
      console.error('Erro ao verificar status:', error)
    }
  }

  const conectar = async () => {
    setStatus({ ...status, loading: true, error: null, qr: null })

    try {
      const response = await fetch('/api/whatsapp/webjs/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceNew: true }),
      })

      const data = await response.json()

      if (!data.success) {
        setStatus({
          connected: false,
          loading: false,
          qr: null,
          error: data.error || 'Erro ao conectar',
        })
        createNotification(data.error || 'Erro ao conectar WhatsApp', 'error')
        return
      }

      // Se já está conectado
      if (data.connected) {
        setStatus({
          connected: true,
          loading: false,
          qr: null,
          error: null,
        })
        createNotification('WhatsApp já está conectado!', 'success')
        return
      }

      // Se tem QR Code
      if (data.qr) {
        setStatus({
          connected: false,
          loading: false,
          qr: data.qr,
          error: null,
        })
        createNotification('QR Code gerado! Escaneie com seu WhatsApp.', 'success')
        
        // Aguardar conexão
        aguardarConexao()
        return
      }

      // Aguardar QR Code ser gerado
      await aguardarQRCode()
    } catch (error: any) {
      console.error('Erro ao conectar:', error)
      setStatus({
        connected: false,
        loading: false,
        qr: null,
        error: error.message || 'Erro ao conectar',
      })
      createNotification('Erro ao conectar WhatsApp', 'error')
    }
  }

  const aguardarQRCode = async () => {
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      try {
        const response = await fetch('/api/whatsapp/webjs/qrcode')
        const data = await response.json()

        if (data.qr) {
          setStatus({
            connected: false,
            loading: false,
            qr: data.qr,
            error: null,
          })
          createNotification('QR Code gerado! Escaneie com seu WhatsApp.', 'success')
          aguardarConexao()
          return
        }
      } catch (error) {
        // Continuar tentando
      }
    }

    setStatus({
      connected: false,
      loading: false,
      qr: null,
      error: 'QR Code não foi gerado. Tente novamente.',
    })
    createNotification('QR Code não foi gerado. Tente novamente.', 'error')
  }

  const aguardarConexao = async () => {
    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/whatsapp/webjs/connect')
        const data = await response.json()

        if (data.connected) {
          clearInterval(checkInterval)
          setStatus({
            connected: true,
            loading: false,
            qr: null,
            error: null,
          })
          createNotification('✅ WhatsApp conectado com sucesso!', 'success')
        }
      } catch (error) {
        // Continuar verificando
      }
    }, 3000) // Verificar a cada 3 segundos

    // Timeout de 5 minutos
    setTimeout(() => {
      clearInterval(checkInterval)
    }, 5 * 60 * 1000)
  }

  const desconectar = async () => {
    setStatus({ ...status, loading: true })

    try {
      const response = await fetch('/api/whatsapp/webjs/disconnect', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setStatus({
          connected: false,
          loading: false,
          qr: null,
          error: null,
        })
        createNotification('WhatsApp desconectado!', 'success')
      } else {
        setStatus({
          ...status,
          loading: false,
          error: data.error || 'Erro ao desconectar',
        })
        createNotification(data.error || 'Erro ao desconectar', 'error')
      }
    } catch (error: any) {
      setStatus({
        ...status,
        loading: false,
        error: error.message || 'Erro ao desconectar',
      })
      createNotification('Erro ao desconectar WhatsApp', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Conectar WhatsApp
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Use <strong>whatsapp-web.js</strong> - 100% GRATUITO! 🎉
            </p>
          </div>

          {/* Status */}
          <div className="mb-6">
            {status.connected ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-700 dark:text-green-300 font-medium">
                  WhatsApp conectado com sucesso!
                </span>
              </div>
            ) : status.qr ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Escaneie este QR Code com seu WhatsApp:
                  </p>
                  <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                    <img
                      src={status.qr}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Aguardando conexão...
                  </p>
                </div>
              </div>
            ) : status.error ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300 text-sm">
                  {status.error}
                </span>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                <p>Clique em "Conectar WhatsApp" para começar</p>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!status.connected ? (
              <button
                onClick={conectar}
                disabled={status.loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Conectar WhatsApp
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={desconectar}
                disabled={status.loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    Desconectar
                  </>
                )}
              </button>
            )}

            <button
              onClick={verificarStatus}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Atualizar
            </button>
          </div>

          {/* Instruções */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📱 Como conectar:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Clique em "Conectar WhatsApp"</li>
              <li>Um QR Code aparecerá na tela</li>
              <li>Abra o WhatsApp no seu celular</li>
              <li>Vá em <strong>Configurações → Aparelhos conectados → Conectar um aparelho</strong></li>
              <li>Escaneie o QR Code na tela</li>
              <li>Pronto! 🎉</li>
            </ol>
          </div>

          {/* Info */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>
              ✅ <strong>100% GRATUITO</strong> - Sem custos mensais ou limites
            </p>
            <p className="mt-1">
              ✅ Mais simples e confiável que Baileys
            </p>
            <p className="mt-1">
              ✅ QR Code funciona perfeitamente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}












