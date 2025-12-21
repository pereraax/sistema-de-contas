'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, QrCode, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createNotification } from '@/components/NotificationBell'

export default function WhatsAppConnectPage() {
  const router = useRouter()
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
  
  const [showPhoneOption, setShowPhoneOption] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [loadingPhone, setLoadingPhone] = useState(false)

  const desconectarPrimeiro = async () => {
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      })
      console.log('✅ Sessão anterior limpa')
    } catch (error) {
      console.log('⚠️ Erro ao limpar sessão (pode não existir):', error)
    }
  }

  const conectar = async () => {
    setStatus({ ...status, loading: true, error: null, qr: null })

    try {
      // Limpar sessão anterior primeiro (para forçar novo QR Code)
      console.log('🧹 Limpando sessão anterior...')
      await desconectarPrimeiro()
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Iniciar conexão com forceNew para garantir novo QR Code
      console.log('🔄 Iniciando conexão...')
      const connectResponse = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceNew: true }),
      })

      const connectData = await connectResponse.json()
      console.log('📥 Resposta da conexão:', connectData)

      if (!connectData.success) {
        setStatus({
          connected: false,
          loading: false,
          qr: null,
          error: connectData.message || connectData.error || 'Erro ao conectar',
        })
        return
      }

      // Se já tem QR Code, buscar imediatamente
      if (connectData.hasQR) {
        console.log('✅ QR Code já disponível!')
        await buscarQRCode()
        return
      }

      // Se ainda está gerando, aguardar mais e buscar
      console.log('⏳ QR Code ainda sendo gerado, aguardando...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Buscar QR Code (vai tentar por até 60 segundos)
      await buscarQRCode()
    } catch (error: any) {
      console.error('❌ Erro ao conectar:', error)
      setStatus({
        connected: false,
        loading: false,
        qr: null,
        error: error.message || 'Erro ao conectar',
      })
    }
  }

  const buscarQRCode = async () => {
    let tentativas = 0
    const maxTentativas = 30 // 60 segundos (30 * 2s)

    const checkQR = setInterval(async () => {
      tentativas++

      try {
        // Primeiro, verificar se já está conectado
        const statusResponse = await fetch('/api/whatsapp/status')
        const statusData = await statusResponse.json()

        if (statusData.connected) {
          clearInterval(checkQR)
          setStatus({
            connected: true,
            loading: false,
            qr: null,
            error: null,
          })
          // Redirecionar após 2 segundos
          setTimeout(() => {
            router.push('/home')
          }, 2000)
          return
        }

        // Buscar QR Code
        const qrResponse = await fetch('/api/whatsapp/qrcode?' + new Date().getTime(), {
          cache: 'no-store',
        })

        if (qrResponse.ok) {
          const contentType = qrResponse.headers.get('content-type')
          
          if (contentType && contentType.includes('image')) {
            // QR Code disponível como imagem
            const blob = await qrResponse.blob()
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              setStatus({
                connected: false,
                loading: false,
                qr: base64,
                error: null,
              })
            }
            reader.readAsDataURL(blob)
            clearInterval(checkQR)
            return
          } else {
            // Ainda processando
            const data = await qrResponse.json()
            console.log('QR Code ainda processando:', data.message)
          }
        }
      } catch (error: any) {
        console.error('Erro ao buscar QR Code:', error)
        if (tentativas >= 5) {
          setStatus({
            ...status,
            error: 'Erro ao buscar QR Code. Tente novamente.',
          })
        }
      }

      if (tentativas >= maxTentativas) {
        clearInterval(checkQR)
        setStatus({
          ...status,
          loading: false,
          error: 'QR Code não apareceu após 60 segundos. Tente clicar em "Conectar WhatsApp" novamente.',
        })
      }
    }, 2000)

    // Verificar status de conexão periodicamente
    const checkStatus = setInterval(async () => {
      try {
        const statusResponse = await fetch('/api/whatsapp/status')
        const statusData = await statusResponse.json()

        if (statusData.connected) {
          clearInterval(checkStatus)
          clearInterval(checkQR)
          setStatus({
            connected: true,
            loading: false,
            qr: null,
            error: null,
          })
          // Redirecionar após 2 segundos
          setTimeout(() => {
            router.push('/home')
          }, 2000)
        }
      } catch (error) {
        // Continuar tentando
      }
    }, 2000)
  }

  const verificarStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      const data = await response.json()

      if (data.connected) {
        setStatus({
          connected: true,
          loading: false,
          qr: null,
          error: null,
        })
      } else {
        setStatus({
          connected: false,
          loading: false,
          qr: null,
          error: null,
        })
      }
    } catch (error: any) {
      setStatus({
        ...status,
        error: error.message,
      })
    }
  }

  useEffect(() => {
    verificarStatus()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Conectar WhatsApp
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Conecte seu WhatsApp para usar o Assistente PLEN
          </p>
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
                onError={(e) => {
                  console.error('Erro ao carregar imagem do QR Code')
                  setStatus({
                    ...status,
                    error: 'Erro ao exibir QR Code. Tente atualizar.',
                  })
                }}
              />
            </div>
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">
              Abra o WhatsApp no seu celular → Menu (3 pontos) → Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        )}

        {/* Loading QR Code */}
        {status.loading && !status.qr && (
          <div className="mb-6 p-6 bg-white dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Gerando QR Code... Isso pode levar alguns segundos.
              </p>
            </div>
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

        {/* Pairing Code (se gerado) */}
        {pairingCode && (
          <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-500 dark:border-green-700">
            <div className="text-center">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                Código de Pairing Gerado!
              </h3>
              <div className="text-4xl font-mono font-bold text-green-700 dark:text-green-300 mb-4 tracking-wider">
                {pairingCode}
              </div>
              <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                Digite este código no seu WhatsApp:
              </p>
              <ol className="text-xs text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside text-left max-w-md mx-auto">
                <li>Abra o WhatsApp no seu celular</li>
                <li>Vá em: Menu → Aparelhos conectados</li>
                <li>Clique em "Conectar um aparelho"</li>
                <li>Selecione "Conectar com número de telefone"</li>
                <li>Digite o código acima: <strong className="font-mono">{pairingCode}</strong></li>
                <li>Aguarde a confirmação</li>
              </ol>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="space-y-3">
          {!status.connected && !status.qr && !pairingCode && (
            <>
              <button
                onClick={conectar}
                disabled={status.loading}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status.loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Conectar com QR Code
                  </>
                )}
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">OU</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowPhoneOption(!showPhoneOption)}
                className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Conectar com Número de Telefone
              </button>
              
              {showPhoneOption && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Telefone (formato internacional)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="5511999999999"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
                      <br />
                      Exemplo: 5511999999999 (Brasil: 55 + 11 + 999999999)
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!phoneNumber || phoneNumber.length < 10) {
                        createNotification('Digite um número de telefone válido', 'warning')
                        return
                      }
                      
                      setLoadingPhone(true)
                      setPairingCode(null)
                      
                      try {
                        const response = await fetch('/api/whatsapp/connect-phone', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ phoneNumber }),
                        })
                        
                        const data = await response.json()
                        
                        if (data.success && data.pairingCode) {
                          setPairingCode(data.pairingCode)
                          createNotification('Código gerado! Digite no seu WhatsApp.', 'success')
                          setShowPhoneOption(false)
                        } else {
                          const errorMsg = data.error || 'Erro ao gerar código'
                          createNotification(errorMsg, 'error')
                          console.error('Erro ao gerar pairing code:', data)
                        }
                      } catch (error: any) {
                        createNotification('Erro ao conectar: ' + error.message, 'error')
                      } finally {
                        setLoadingPhone(false)
                      }
                    }}
                    disabled={loadingPhone || !phoneNumber}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingPhone ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando código...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Gerar Código de Pairing
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {status.error && status.error.includes('60 segundos') && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    <strong>⚠️ Problema:</strong> O QR Code não foi gerado. Isso geralmente acontece por credenciais antigas bloqueando.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={async () => {
                        setStatus({ ...status, loading: true, error: null })
                        try {
                          // Limpar forçadamente
                          const cleanResponse = await fetch('/api/whatsapp/force-clean', { method: 'POST' })
                          const cleanData = await cleanResponse.json()
                          
                          if (cleanData.success) {
                            createNotification('Credenciais limpas! Aguardando 3 segundos...', 'success')
                            await new Promise(resolve => setTimeout(resolve, 3000))
                            await conectar()
                          } else {
                            setStatus({
                              ...status,
                              loading: false,
                              error: cleanData.message || 'Erro ao limpar',
                            })
                          }
                        } catch (error: any) {
                          setStatus({
                            ...status,
                            loading: false,
                            error: error.message,
                          })
                        }
                      }}
                      className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all"
                    >
                      🔥 Limpar TUDO e Tentar Novamente (RECOMENDADO)
                    </button>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Isso vai deletar completamente a pasta whatsapp_auth e forçar uma nova conexão.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {status.qr && (
            <button
              onClick={buscarQRCode}
              className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar QR Code
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={async () => {
                setStatus({ ...status, loading: true, error: null })
                try {
                  const response = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
                  const data = await response.json()
                  if (data.success) {
                    createNotification('Sessão limpa! Agora clique em "Conectar WhatsApp" novamente.', 'success')
                    setStatus({ connected: false, loading: false, qr: null, error: null })
                  }
                } catch (error: any) {
                  createNotification('Erro ao limpar sessão: ' + error.message, 'error')
                  setStatus({ ...status, loading: false })
                }
              }}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all"
            >
              Limpar Sessão
            </button>
            <button
              onClick={() => router.push('/home')}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Duas Formas de Conectar:
          </h3>
          <div className="text-xs text-blue-800 dark:text-blue-200 space-y-3">
            <div>
              <strong>1. QR Code (Método Tradicional):</strong>
              <ol className="list-decimal list-inside ml-2 mt-1 space-y-0.5">
                <li>Clique em "Conectar com QR Code"</li>
                <li>Escaneie o QR Code que aparecer</li>
                <li>Aguarde a confirmação</li>
              </ol>
            </div>
            <div>
              <strong>2. Número de Telefone (Mais Fácil!):</strong>
              <ol className="list-decimal list-inside ml-2 mt-1 space-y-0.5">
                <li>Clique em "Conectar com Número de Telefone"</li>
                <li>Digite seu número (formato: 5511999999999)</li>
                <li>Receba um código de pairing</li>
                <li>Digite o código no seu WhatsApp</li>
                <li>Pronto!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Aviso Importante: Verificar Terminal */}
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
            <span>⚠️</span> <span>QR Code não apareceu?</span>
          </h3>
          <div className="text-xs text-yellow-800 dark:text-yellow-200 space-y-2">
            <p><strong>1. Verifique o TERMINAL onde está rodando `npm run dev`!</strong></p>
            <p>O QR Code pode aparecer lá primeiro (em formato de caracteres). Você pode escanear direto do terminal!</p>
            <p><strong>2. Se ainda não aparecer:</strong></p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Clique em "Limpar Sessão" acima</li>
              <li>Aguarde 3 segundos</li>
              <li>Clique em "Conectar WhatsApp" novamente</li>
              <li>Aguarde 30-60 segundos</li>
            </ol>
            <p><strong>3. Problema persistindo?</strong></p>
            <p>Execute no terminal (dentro da pasta do projeto):</p>
            <code className="block bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded mt-1 text-[10px]">
              rm -rf whatsapp_auth
            </code>
            <p>Depois reinicie o servidor e tente novamente.</p>
          </div>
        </div>

        {/* Debug Info (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
            <button
              onClick={async () => {
                const debug = await fetch('/api/whatsapp/debug')
                const data = await debug.json()
                console.log('🔍 Debug Info:', data)
                alert(`Debug Info:\n${JSON.stringify(data, null, 2)}`)
              }}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Ver Debug Info
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
