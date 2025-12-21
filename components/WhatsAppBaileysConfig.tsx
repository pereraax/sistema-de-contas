'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, QrCode, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react'
import { createNotification } from './NotificationBell'

export default function WhatsAppBaileysConfig() {
  const [status, setStatus] = useState<{ connected: boolean; loading: boolean; qr: string | null }>({
    connected: false,
    loading: false,
    qr: null,
  })
  const [checkingQR, setCheckingQR] = useState(false)

  useEffect(() => {
    // Verificar status inicial
    verificarStatus()
    
    // Verificar QR Code a cada 2 segundos se não estiver conectado
    const interval = setInterval(() => {
      if (!status.connected && !status.loading) {
        verificarStatus()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [status.connected, status.loading])

  const verificarStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status')
      const data = await response.json()
      
      setStatus({
        connected: data.connected,
        loading: false,
        qr: null,
      })
    } catch (error: any) {
      console.error('Erro ao verificar status:', error)
    }
  }

  const conectar = async () => {
    setStatus({ ...status, loading: true })
    setCheckingQR(true)

    try {
      // Iniciar conexão
      const connectResponse = await fetch('/api/whatsapp/connect', {
        method: 'POST',
      })

      const connectData = await connectResponse.json()

      if (!connectData.success) {
        createNotification(`Erro: ${connectData.message || 'Erro ao conectar'}`, 'error')
        setStatus({ connected: false, loading: false, qr: null })
        setCheckingQR(false)
        return
      }

      // Aguardar QR Code aparecer
      let tentativas = 0
      const maxTentativas = 15 // 30 segundos (15 * 2s)

      const checkQR = setInterval(async () => {
        tentativas++
        
        try {
          const qrResponse = await fetch('/api/whatsapp/qrcode')
          
          if (qrResponse.ok && qrResponse.headers.get('content-type')?.includes('image')) {
            // QR Code disponível como imagem
            const blob = await qrResponse.blob()
            const reader = new FileReader()
            reader.onloadend = () => {
              const base64 = reader.result as string
              setStatus({
                connected: false,
                loading: false,
                qr: base64,
              })
              setCheckingQR(false)
              createNotification('QR Code gerado! Escaneie com seu WhatsApp.', 'success')
            }
            reader.readAsDataURL(blob)
            clearInterval(checkQR)
            return
          }
        } catch (error) {
          // Continuar tentando
        }

        if (tentativas >= maxTentativas) {
          clearInterval(checkQR)
          setCheckingQR(false)
          setStatus({ ...status, loading: false })
          createNotification('QR Code não apareceu. Tente novamente ou verifique o terminal do servidor.', 'warning')
        }
      }, 2000)

      // Verificar status de conexão periodicamente
      const checkStatus = setInterval(async () => {
        const statusResponse = await fetch('/api/whatsapp/status')
        const statusData = await statusResponse.json()
        
        if (statusData.connected) {
          clearInterval(checkStatus)
          clearInterval(checkQR)
          setStatus({
            connected: true,
            loading: false,
            qr: null,
          })
          setCheckingQR(false)
          createNotification('WhatsApp conectado com sucesso!', 'success')
        }
      }, 2000)

    } catch (error: any) {
      createNotification(`Erro ao conectar: ${error.message}`, 'error')
      setStatus({ connected: false, loading: false, qr: null })
      setCheckingQR(false)
    }
  }

  const desconectar = async () => {
    try {
      // Limpar sessão (deletar pasta whatsapp_auth)
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setStatus({ connected: false, loading: false, qr: null })
        createNotification('WhatsApp desconectado com sucesso!', 'success')
      } else {
        createNotification(`Erro: ${data.error}`, 'error')
      }
    } catch (error: any) {
      createNotification(`Erro ao desconectar: ${error.message}`, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-brand-dark rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-brand-primary" />
          <h2 className="text-xl font-bold text-brand-midnight dark:text-brand-clean">
            WhatsApp Assistente (Baileys - Ilimitado)
          </h2>
          <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span className="text-lg text-green-600 dark:text-green-400">∞</span>
            <span className="text-xs font-medium text-green-700 dark:text-green-300">100% Gratuito e Ilimitado</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Conecte seu WhatsApp diretamente ao PleniPay usando Baileys. <strong>Totalmente gratuito, sem limites de mensagens ou chats!</strong>
        </p>

        {/* Status da Conexão */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.loading || checkingQR ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
              ) : status.connected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium text-brand-midnight dark:text-brand-clean">
                Status: {
                  status.loading || checkingQR 
                    ? 'Conectando...' 
                    : status.connected 
                    ? 'Conectado' 
                    : 'Desconectado'
                }
              </span>
            </div>
            <button
              onClick={verificarStatus}
              disabled={status.loading || checkingQR}
              className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 mb-6">
          {!status.connected ? (
            <button
              onClick={conectar}
              disabled={status.loading || checkingQR}
              className="flex-1 px-4 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status.loading || checkingQR ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {checkingQR ? 'Aguardando QR Code...' : 'Conectando...'}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Conectar WhatsApp
                </>
              )}
            </button>
          ) : (
            <button
              onClick={desconectar}
              disabled={status.loading}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Desconectar
            </button>
          )}
        </div>

        {/* QR Code */}
        {status.qr && (
          <div className="mt-6 p-4 bg-white dark:bg-brand-dark rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-brand-midnight dark:text-brand-clean mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Escaneie o QR Code
            </h3>
            <div className="flex justify-center">
              <img
                src={status.qr}
                alt="QR Code WhatsApp"
                className="w-64 h-64 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>
            <p className="mt-3 text-xs text-center text-gray-600 dark:text-gray-400">
              Abra o WhatsApp no seu celular → Menu (3 pontos) → Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        )}

        {/* Informações */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-brand-midnight dark:text-brand-clean mb-3">
            ℹ️ Como funciona:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>100% Gratuito:</strong> Sem custos, sem limites de mensagens ou chats</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>Direto no seu servidor:</strong> Não depende de serviços externos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>Webhook automático:</strong> Mensagens recebidas são processadas automaticamente pelo PLEN</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>Privacidade total:</strong> Seus dados ficam apenas no seu servidor</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Aviso sobre servidor */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          ⚠️ Importante
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          O servidor precisa estar rodando para manter a conexão ativa. Se você reiniciar o servidor, 
          precisará escanear o QR Code novamente (mas a conexão é mantida automaticamente após o primeiro scan).
        </p>
      </div>
    </div>
  )
}












