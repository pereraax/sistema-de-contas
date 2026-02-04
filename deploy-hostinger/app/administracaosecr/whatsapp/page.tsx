'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, CheckCircle, XCircle, Loader2, Phone, QrCode, RefreshCw } from 'lucide-react'
import { createNotification } from '@/components/NotificationBell'

interface WhatsAppStatus {
  connected: boolean
  status: string
  phoneNumber: string | null
  qrCode: string | null
  message: string
  error?: string
}

export default function AdminWhatsAppPage() {
  const [instanceName, setInstanceName] = useState('plenipay')
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    status: 'unknown',
    phoneNumber: null,
    qrCode: null,
    message: 'Verificando...',
  })
  
  const [loading, setLoading] = useState(false)

  // Verificar status ao carregar e periodicamente
  useEffect(() => {
    verificarStatus()
    verificarCredenciais()
    
    // Verificar status a cada 10 segundos (menos frequente para melhor performance)
    const intervalId = setInterval(() => {
      verificarStatus()
    }, 10000)
    
    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verificarCredenciais = async () => {
    try {
      const response = await fetch('/api/admin/whatsapp-instance/check-auth')
      const data = await response.json()
      
      if (data.hasCredentials && !status.connected) {
        console.log('⚠️ [WhatsApp] Credenciais encontradas:', data.message)
      }
    } catch (error) {
      console.error('Erro ao verificar credenciais:', error)
    }
  }

  const verificarStatus = async () => {
    try {
      // Usar nova API do Evolution
      const response = await fetch('/api/whatsapp/status')
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [WhatsApp Frontend] Erro na resposta da API:', response.status, errorText)
        setStatus({
          connected: false,
          status: 'error',
          phoneNumber: null,
          qrCode: null,
          message: `Erro ao verificar status (${response.status})`,
          error: `Erro HTTP ${response.status}: ${errorText}`,
        })
        return
      }
      
      const data = await response.json()
      
      if (data.error) {
        console.error('❌ [WhatsApp Frontend] Erro retornado pela API:', data.error)
        setStatus({
          connected: false,
          status: 'error',
          phoneNumber: null,
          qrCode: null,
          message: data.error,
          error: data.error,
        })
        createNotification(data.error, 'warning')
      } else {
        setStatus({
          connected: data.connected || false,
          status: data.status || 'unknown',
          phoneNumber: data.phoneNumber,
          qrCode: data.qrCode,
          message: data.connected 
            ? `Conectado! Número: ${data.phoneNumber || 'N/A'}` 
            : data.qrCode 
            ? 'Aguardando scan do QR Code...'
            : 'Desconectado',
        })
      }
    } catch (error: any) {
      console.error('❌ [WhatsApp Frontend] Erro ao verificar status:', error)
      setStatus({
        connected: false,
        status: 'error',
        phoneNumber: null,
        qrCode: null,
        message: 'Erro ao verificar status',
        error: error.message || 'Erro desconhecido',
      })
      createNotification('Erro ao verificar status. Verifique a conexão com o servidor.', 'warning')
    }
  }

  const limparCredenciais = async () => {
    if (!confirm('Limpar credenciais? Isso desconectará o WhatsApp e você precisará escanear o QR Code novamente.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/whatsapp-instance/clear-auth', {
        method: 'POST',
      })

      const data = await response.json()
      if (data.success) {
        createNotification('Credenciais removidas! Agora você pode gerar um novo QR Code.', 'success')
        setStatus({
          ...status,
          connected: false,
          status: 'disconnected',
          qrCode: null,
          phoneNumber: null,
          message: 'Credenciais removidas. Clique em "Conectar" para gerar novo QR Code.',
        })
      } else {
        throw new Error(data.error || 'Erro ao limpar credenciais')
      }
    } catch (error: any) {
      createNotification(error.message || 'Erro ao limpar credenciais', 'warning')
    } finally {
      setLoading(false)
    }
  }

  const conectarWhatsApp = async () => {
    setLoading(true)
    try {
      console.log('🔄 [WhatsApp] Iniciando conexão...')
      
      // Usar nova API do Evolution
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log('📥 [WhatsApp] Resposta:', data)

      if (data.success && data.qrCode) {
        // QR Code recebido
        setStatus({
          ...status,
          status: 'connecting',
          qrCode: data.qrCode,
          message: 'QR Code gerado! Escaneie com o WhatsApp.',
        })
        createNotification('QR Code gerado! Escaneie com o WhatsApp.', 'success')
        
        // Iniciar polling para verificar conexão
        iniciarPolling()
      } else {
        const errorMessage = data.error || 'Erro ao gerar QR Code'
        console.error('❌ [WhatsApp Frontend] Erro ao iniciar conexão:', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('❌ [WhatsApp] Erro:', error)
      setStatus({
        ...status,
        status: 'error',
        message: error.message || 'Erro ao conectar WhatsApp',
        error: error.message,
      })
      createNotification(error.message || 'Erro ao conectar WhatsApp', 'warning')
      setLoading(false)
    }
  }

  const iniciarPolling = () => {
    const maxTentativas = 90 // 90 tentativas (até 90 segundos se verificar a cada 1 segundo)
    let tentativas = 0
    let pollingAtivo = true
    let intervaloAtual = 2000 // Começar com 2 segundos
    let checkInterval: NodeJS.Timeout | null = null

    const fazerPolling = async () => {
      if (!pollingAtivo) {
        if (checkInterval) clearInterval(checkInterval)
        return
      }

      tentativas++
      
      // Log apenas a cada 5 tentativas para não poluir o console
      if (tentativas % 5 === 0) {
        console.log(`🔄 [WhatsApp] Polling tentativa ${tentativas}/${maxTentativas}`)
      }

      try {
        // Usar nova API do WhatsApp
        const response = await fetch('/api/whatsapp/status')
        
        // Se erro 429, aumentar intervalo (backoff)
        if (response.status === 429) {
          console.warn(`⚠️ [WhatsApp] Rate limit atingido. Aumentando intervalo...`)
          intervaloAtual = Math.min(intervaloAtual * 2, 10000) // Máximo 10 segundos
          
          if (checkInterval) clearInterval(checkInterval)
          checkInterval = setTimeout(fazerPolling, intervaloAtual)
          return
        }
        
        // Se sucesso, resetar intervalo
        if (response.ok) {
          intervaloAtual = 2000 // Resetar para 2 segundos
        }
        
        const data = await response.json()

        if (data.error) {
          // Se erro 429, já tratado acima
          if (!data.error.includes('Too Many Requests')) {
            console.error('❌ [WhatsApp] Erro no status:', data.error)
          }
        } else {
          // Atualizar status baseado na resposta
          if (data.qrCode) {
            console.log('✅ [WhatsApp Frontend] QR Code encontrado no polling!')
            
            // CRÍTICO: Parar polling IMEDIATAMENTE
            pollingAtivo = false
            if (checkInterval) {
              clearTimeout(checkInterval)
              checkInterval = null
            }
            
            setStatus((prev) => ({
              ...prev,
              qrCode: data.qrCode,
              status: 'connecting',
              message: 'QR Code gerado! Escaneie com seu WhatsApp.',
            }))
            createNotification('QR Code gerado! Escaneie com seu WhatsApp.', 'success')
            setLoading(false)
            
            // Aguardar um pouco antes de começar a verificar conexão (evitar 429)
            setTimeout(() => {
              aguardarConexao()
            }, 2000)
            return
          }

          if (data.connected) {
            pollingAtivo = false
            if (checkInterval) clearInterval(checkInterval)
            
            setStatus((prev) => ({
              ...prev,
              connected: true,
              status: 'connected',
              phoneNumber: data.phoneNumber,
              qrCode: null,
              message: `Conectado! Número: ${data.phoneNumber || 'N/A'}`,
            }))
            createNotification('✅ WhatsApp conectado com sucesso!', 'success')
            setLoading(false)
            return
          }
          
          // Log intermediário se ainda não tem QR Code mas status é connecting
          if (data.status === 'connecting' && !data.qrCode && tentativas % 10 === 0) {
            console.log(`⏳ [WhatsApp Frontend] Aguardando QR Code... (tentativa ${tentativas}/${maxTentativas})`)
          }
        }

        // Se chegou no limite e ainda não tem QR Code nem conexão
        if (tentativas >= maxTentativas) {
          pollingAtivo = false
          if (checkInterval) clearInterval(checkInterval)
          setLoading(false)
          
          setStatus((prev) => ({
            ...prev,
            status: 'error',
            message: 'Timeout: QR Code não foi gerado após 90 segundos. Verifique os logs do servidor.',
            error: 'Timeout aguardando QR Code',
          }))
          createNotification('Timeout: QR Code não foi gerado. Verifique o terminal do servidor.', 'warning')
        } else {
          // Continuar polling com intervalo atual
          if (checkInterval) clearInterval(checkInterval)
          checkInterval = setTimeout(fazerPolling, intervaloAtual)
        }
      } catch (error: any) {
        console.error('❌ [WhatsApp] Erro no polling:', error)
        
        // Se erro após muitas tentativas, parar
        if (tentativas >= maxTentativas) {
          pollingAtivo = false
          if (checkInterval) clearInterval(checkInterval)
          setLoading(false)
          createNotification('Erro ao verificar status. Tente novamente.', 'warning')
        } else {
          // Aumentar intervalo em caso de erro
          intervaloAtual = Math.min(intervaloAtual * 1.5, 10000)
          if (checkInterval) clearInterval(checkInterval)
          checkInterval = setTimeout(fazerPolling, intervaloAtual)
        }
      }
    }

    // Iniciar primeiro polling após 3 segundos (dar tempo para conexão iniciar)
    checkInterval = setTimeout(fazerPolling, 3000)
  }

  const aguardarConexao = async () => {
    const maxTentativas = 180 // 180 tentativas (3 minutos com intervalo de 1s, mas vamos usar 2s = 6 minutos)
    let tentativas = 0
    let aguardando = true
    let intervaloAtual = 2000 // Começar com 2 segundos (mais rápido para detectar conexão)
    let checkInterval: NodeJS.Timeout | null = null

    const fazerCheck = async () => {
      if (!aguardando) {
        if (checkInterval) clearTimeout(checkInterval)
        return
      }

      tentativas++
      
      // Log a cada 10 tentativas para não poluir o console
      if (tentativas % 10 === 0) {
        console.log(`🔄 [WhatsApp] Aguardando conexão... (tentativa ${tentativas}/${maxTentativas})`)
      }
      
      try {
        // Verificar se conectou
        const response = await fetch(`/api/admin/whatsapp-instance/status?instanceName=${instanceName}`)
        
        // Se erro 429, aumentar intervalo
        if (response.status === 429) {
          console.warn(`⚠️ [WhatsApp] Rate limit ao aguardar conexão. Aumentando intervalo...`)
          intervaloAtual = Math.min(intervaloAtual * 2, 10000) // Máximo 10 segundos
          
          if (checkInterval) clearTimeout(checkInterval)
          checkInterval = setTimeout(fazerCheck, intervaloAtual)
          return
        }
        
        // Se sucesso, resetar intervalo
        if (response.ok) {
          intervaloAtual = 2000 // Resetar para 2 segundos
        }
        
        const data = await response.json()
        
        console.log(`🔍 [WhatsApp Frontend] Verificação ${tentativas}/${maxTentativas}:`, {
          connected: data.connected,
          status: data.status,
          hasPhoneNumber: !!data.phoneNumber,
          hasQR: !!data.qrCode
        })

        if (data.connected) {
          console.log('✅ [WhatsApp Frontend] ==========================================')
          console.log('✅ [WhatsApp Frontend] CONEXÃO DETECTADA!')
          console.log('   - Phone Number:', data.phoneNumber)
          console.log('   - Status:', data.status)
          console.log('✅ [WhatsApp Frontend] ==========================================')
          aguardando = false
          if (checkInterval) clearTimeout(checkInterval)
          
          setStatus((prev) => ({
            ...prev,
            connected: true,
            status: 'connected',
            phoneNumber: data.phoneNumber,
            qrCode: null,
            message: `Conectado! Número: ${data.phoneNumber || 'N/A'}`,
          }))
          createNotification('✅ WhatsApp conectado com sucesso!', 'success')
          
          // Atualizar status também
          await verificarStatus()
          setLoading(false)
        } else if (tentativas >= maxTentativas) {
          aguardando = false
          if (checkInterval) clearTimeout(checkInterval)
          setLoading(false)
          setStatus((prev) => ({
            ...prev,
            status: 'error',
            message: 'Timeout: QR Code expirou. Gere um novo QR Code.',
            error: 'Timeout aguardando conexão',
          }))
          createNotification('Timeout: QR Code expirou. Gere um novo QR Code.', 'warning')
        } else {
          // Continuar verificando com intervalo atual
          if (checkInterval) clearTimeout(checkInterval)
          checkInterval = setTimeout(fazerCheck, intervaloAtual)
        }
      } catch (error: any) {
        console.error('❌ [WhatsApp] Erro ao aguardar conexão:', error)
        
        // Se erro 429 ou similar, aumentar intervalo
        if (error.message?.includes('429') || error.message?.includes('Too Many')) {
          intervaloAtual = Math.min(intervaloAtual * 2, 10000)
        }
        
        if (tentativas >= maxTentativas) {
          aguardando = false
          if (checkInterval) clearTimeout(checkInterval)
          setLoading(false)
          createNotification('Erro ao verificar conexão. Tente novamente.', 'warning')
        } else {
          // Continuar com intervalo aumentado
          if (checkInterval) clearTimeout(checkInterval)
          checkInterval = setTimeout(fazerCheck, intervaloAtual)
        }
      }
    }

    // Iniciar primeira verificação após 2 segundos (mais rápido)
    console.log('⏳ [WhatsApp Frontend] Iniciando verificação de conexão...')
    checkInterval = setTimeout(fazerCheck, 2000)
  }

  const desconectar = async () => {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instanceName }),
      })

      const data = await response.json()

      if (data.success) {
        setStatus({
          connected: false,
          status: 'disconnected',
          phoneNumber: null,
          qrCode: null,
          message: 'Desconectado',
        })
        createNotification('WhatsApp desconectado!', 'success')
      } else {
        throw new Error(data.error || 'Erro ao desconectar')
      }
    } catch (error: any) {
      createNotification(error.message || 'Erro ao desconectar', 'warning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-clean mb-2 flex items-center gap-3">
            <MessageCircle className="text-brand-aqua" size={32} />
            WhatsApp - Assistente PLEN
          </h1>
          <p className="text-brand-clean/60">
            Sistema próprio de WhatsApp integrado ao PLEN - 100% Gratuito!
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`p-6 rounded-xl border-2 ${
        status.connected 
          ? 'bg-green-900/20 border-green-500/50' 
          : status.error
          ? 'bg-red-900/20 border-red-500/50'
          : status.qrCode
          ? 'bg-blue-900/20 border-blue-500/50'
          : 'bg-brand-royal/50 border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {status.connected ? (
              <CheckCircle className="text-green-400" size={24} />
            ) : status.error ? (
              <XCircle className="text-red-400" size={24} />
            ) : status.qrCode ? (
              <QrCode className="text-blue-400" size={24} />
            ) : (
              <Loader2 className="text-yellow-400 animate-spin" size={24} />
            )}
            <h2 className="text-xl font-bold text-brand-clean">
              Status: {
                status.connected ? 'Conectado' : 
                status.error ? 'Erro' : 
                status.qrCode ? 'Aguardando Scan' : 
                'Desconectado'
              }
            </h2>
          </div>
          
          <button
            onClick={verificarStatus}
            disabled={loading}
            className="px-4 py-2 bg-brand-aqua/20 hover:bg-brand-aqua/30 text-brand-aqua rounded-lg transition-smooth disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
        
        {status.connected && status.phoneNumber && (
          <p className="text-brand-clean/80 mb-2">
            📱 Número: {status.phoneNumber}
          </p>
        )}
        
        <p className="text-brand-clean/60">
          {status.message}
        </p>

        {status.error && (
          <p className="text-red-400 mt-2 text-sm">
            ⚠️ {status.error}
          </p>
        )}

        {/* QR Code */}
        {status.qrCode && !status.connected && (
          <div className="mt-6 p-4 bg-brand-midnight/50 rounded-lg">
            <p className="text-sm text-brand-clean/80 mb-4 text-center font-semibold">
              Escaneie este QR Code com seu WhatsApp:
            </p>
            <div className="flex justify-center">
              <div className="p-6 bg-white rounded-lg shadow-2xl">
                {(() => {
                  // Normalizar QR Code antes de usar
                  let qrCodeSrc = status.qrCode
                  
                  if (!qrCodeSrc || typeof qrCodeSrc !== 'string') {
                    console.error('❌ [Frontend] QR Code não disponível ou inválido')
                    return <div className="text-red-500 p-4">QR Code não disponível</div>
                  }
                  
                  try {
                    // CRÍTICO: QR Code base64 válido deve ter pelo menos 5000 caracteres
                    const TAMANHO_MINIMO_QR_CODE = 5000
                    
                    // Extrair base64 para validar tamanho
                    let base64Part = qrCodeSrc
                    if (qrCodeSrc.startsWith('data:image')) {
                      base64Part = qrCodeSrc.includes(',') ? qrCodeSrc.split(',')[1] : qrCodeSrc.replace(/^data:image\/[^;]+;base64,?/, '')
                    }
                    
                    // Remover espaços e caracteres inválidos
                    const base64Limpo = base64Part.trim().replace(/\s/g, '').replace(/[^A-Za-z0-9+\/=]/g, '')
                    
                    // CRÍTICO: Validar tamanho mínimo
                    if (base64Limpo.length < TAMANHO_MINIMO_QR_CODE) {
                      console.error(`❌ [Frontend] QR Code TRUNCADO ou INVÁLIDO!`)
                      console.error(`   - Tamanho: ${base64Limpo.length} caracteres`)
                      console.error(`   - Tamanho mínimo esperado: ${TAMANHO_MINIMO_QR_CODE} caracteres`)
                      console.error(`   - Preview: ${base64Limpo.substring(0, 100)}...`)
                      return (
                        <div className="text-red-500 p-4 border border-red-500 rounded-lg bg-red-900/20">
                          <p className="font-bold mb-2">⚠️ QR Code Inválido ou Truncado</p>
                          <p className="text-sm">O QR Code recebido está incompleto ({base64Limpo.length} caracteres, mínimo {TAMANHO_MINIMO_QR_CODE}).</p>
                          <p className="text-sm mt-2">Tente gerar um novo QR Code clicando em "Limpar Credenciais" e depois "Conectar".</p>
                        </div>
                      )
                    }
                    
                    // Verificar se começa com caracteres válidos de base64
                    if (!/^[A-Za-z0-9+\/]/.test(base64Limpo)) {
                      console.error('❌ [Frontend] QR Code base64 inválido: começa com caractere não-base64')
                      return (
                        <div className="text-red-500 p-4 border border-red-500 rounded-lg bg-red-900/20">
                          <p className="font-bold mb-2">⚠️ QR Code em Formato Inválido</p>
                          <p className="text-sm">O QR Code não está em formato base64 válido.</p>
                          <p className="text-sm mt-2">Tente gerar um novo QR Code.</p>
                        </div>
                      )
                    }
                    
                    // Garantir formato correto
                    if (!qrCodeSrc.startsWith('data:image/png;base64,')) {
                      qrCodeSrc = `data:image/png;base64,${base64Limpo}`
                    } else {
                      // Validar que o base64 após a vírgula está completo
                      const afterComma = qrCodeSrc.split(',')[1]
                      if (!afterComma || afterComma.length < TAMANHO_MINIMO_QR_CODE) {
                        console.error(`❌ [Frontend] QR Code com prefixo mas base64 truncado (${afterComma?.length || 0} chars)`)
                        return (
                          <div className="text-red-500 p-4 border border-red-500 rounded-lg bg-red-900/20">
                            <p className="font-bold mb-2">⚠️ QR Code Truncado</p>
                            <p className="text-sm">O QR Code está incompleto. Tente gerar um novo QR Code.</p>
                          </div>
                        )
                      }
                      // Usar base64 limpo
                      qrCodeSrc = `data:image/png;base64,${base64Limpo}`
                    }
                    
                    return (
                      <img
                        src={qrCodeSrc}
                        alt="QR Code WhatsApp"
                        className="w-96 h-96 object-contain"
                        style={{ imageRendering: 'crisp-edges' }}
                        onError={(e) => {
                          console.error('❌ [Frontend] ==========================================')
                          console.error('❌ [Frontend] Erro ao carregar imagem do QR Code')
                          console.error('   - QR Code length:', qrCodeSrc?.length)
                          console.error('   - QR Code preview (primeiros 150 chars):', qrCodeSrc?.substring(0, 150))
                          console.error('   - QR Code starts with data:', qrCodeSrc?.startsWith('data:'))
                          console.error('   - Base64 part length:', qrCodeSrc?.split(',')[1]?.length || 0)
                          console.error('   - Base64 part preview:', qrCodeSrc?.split(',')[1]?.substring(0, 20) || 'N/A')
                          console.error('   - Element error:', e)
                          console.error('❌ [Frontend] ==========================================')
                        }}
                        onLoad={() => {
                          console.log('✅ [Frontend] QR Code imagem carregada com sucesso!')
                        }}
                      />
                    )
                  } catch (error: any) {
                    console.error('❌ [Frontend] Erro ao processar QR Code:', error)
                    return <div className="text-red-500 p-4">Erro ao processar QR Code: {error.message}</div>
                  }
                })()}
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
              <p className="text-xs text-yellow-200 text-center font-semibold mb-1">
                ⚠️ IMPORTANTE:
              </p>
              <p className="text-xs text-yellow-100 text-center">
                • QR Code expira em ~60 segundos - escaneie rapidamente!<br/>
                • Certifique-se que o celular e o computador estão na mesma rede WiFi<br/>
                • Se não funcionar, gere um novo QR Code clicando em "Limpar Credenciais"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Configuração */}
      <div className="bg-brand-royal/50 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-brand-clean mb-4 flex items-center gap-2">
          <MessageCircle className="text-brand-aqua" size={24} />
          Configuração da Instância
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-clean/80 mb-2">
              Nome da Instância
            </label>
            <input
              type="text"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="plenipay"
              className="w-full px-4 py-2 bg-brand-midnight border border-white/10 rounded-lg text-brand-clean focus:border-brand-aqua focus:ring-2 focus:ring-brand-aqua/50"
            />
            <p className="text-xs text-brand-clean/60 mt-1">
              Nome único para identificar esta instância WhatsApp
            </p>
          </div>

          {!status.connected ? (
            <div className="space-y-3">
              <button
                onClick={conectarWhatsApp}
                disabled={loading || !instanceName.trim()}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Conectando...
                  </>
                ) : (
                  <>
                    <QrCode size={20} />
                    Conectar WhatsApp (QR Code)
                  </>
                )}
              </button>
              
              <button
                onClick={limparCredenciais}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
              >
                🧹 Limpar Credenciais (forçar novo QR)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={desconectar}
                disabled={loading}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <XCircle size={20} />
                    Desconectar WhatsApp
                  </>
                )}
              </button>
              
              <button
                onClick={async () => {
                  setLoading(true)
                  try {
                    // Primeiro, forçar WhatsApp Web a carregar
                    const loadResponse = await fetch('/api/whatsapp/force-load', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    })
                    const loadData = await loadResponse.json()
                    
                    if (!loadData.success) {
                      createNotification(`⚠️ ${loadData.error || 'WhatsApp Web não está pronto. Tente reconectar.'}`, 'warning')
                    } else {
                      createNotification('✅ WhatsApp Web carregado! Reativando listeners...', 'info')
                    }
                    
                    // Depois, reativar listeners
                    const response = await fetch('/api/whatsapp/reativar-listeners', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    })
                    const data = await response.json()
                    if (data.success) {
                      createNotification('✅ Listeners reativados! Tente enviar "oi" novamente.', 'success')
                      // Verificar status novamente
                      await verificarStatus()
                    } else {
                      throw new Error(data.error || 'Erro ao reativar listeners')
                    }
                  } catch (error: any) {
                    createNotification(error.message || 'Erro ao reativar listeners', 'warning')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                ✅ Reativar Listeners (Sem Desconectar)
              </button>
              
              <button
                onClick={async () => {
                  if (!confirm('Forçar reconexão? Isso vai desconectar e reconectar completamente.')) {
                    return
                  }
                  setLoading(true)
                  try {
                    const response = await fetch('/api/whatsapp/reconnect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    })
                    const data = await response.json()
                    if (data.success) {
                      createNotification('Reconectando...', 'info')
                      if (data.qrCode) {
                        setStatus({
                          ...status,
                          qrCode: data.qrCode,
                          status: 'connecting',
                          connected: false,
                          message: 'QR Code gerado. Escaneie para conectar.',
                        })
                        iniciarPolling()
                      } else {
                        setStatus({
                          ...status,
                          connected: true,
                          status: 'connected',
                          message: 'Reconectado com sucesso!',
                        })
                      }
                    } else {
                      throw new Error(data.error || 'Erro ao reconectar')
                    }
                  } catch (error: any) {
                    createNotification(error.message || 'Erro ao reconectar', 'warning')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={20} />
                🔄 Reconectar (Forçar Nova Conexão)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-xl p-6">
        <h3 className="font-semibold text-yellow-200 mb-3 flex items-center gap-2">
          <MessageCircle className="text-yellow-400" size={20} />
          📱 Como conectar:
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-100">
          <li>Clique em "Conectar WhatsApp (QR Code)"</li>
          <li>Um QR Code aparecerá na tela</li>
          <li>Abra o WhatsApp no seu celular</li>
          <li>Vá em: <strong>Configurações → Aparelhos conectados → Conectar um aparelho</strong></li>
          <li>Escaneie o QR Code na tela</li>
          <li>Aguarde alguns segundos</li>
          <li>✅ <strong>Pronto! WhatsApp conectado!</strong></li>
        </ol>
      </div>

      {/* Info */}
      <div className="bg-brand-royal/30 border border-white/10 rounded-xl p-4">
        <div className="space-y-2 text-sm text-brand-clean/80">
          <p>
            ✅ <strong>Sistema Próprio</strong> - Não depende de serviços externos
          </p>
          <p>
            ✅ <strong>100% Gratuito</strong> - Sem custos mensais
          </p>
          <p>
            ✅ <strong>Integrado ao PLEN</strong> - Respostas automáticas inteligentes
          </p>
          <p>
            ✅ <strong>Gerenciado no Admin</strong> - Controle total
          </p>
        </div>
      </div>
    </div>
  )
}


