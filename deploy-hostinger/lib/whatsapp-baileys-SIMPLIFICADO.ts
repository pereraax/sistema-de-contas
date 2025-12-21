/**
 * VERSÃO SIMPLIFICADA - WhatsApp Baileys
 * Código direto e simples que FUNCIONA
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'

let sock: WASocket | null = null
let isConnecting = false
let qrCodeAtual: string | null = null

export async function connectWhatsApp(forceNewQR = false) {
  try {
    // Se já está conectando, retornar status atual
    if (isConnecting && sock && !forceNewQR) {
      return {
        success: true,
        connected: !!(sock.user),
        qrCode: qrCodeAtual,
        socket: sock,
      }
    }

    // Se já está conectado, retornar sucesso
    if (sock && sock.user && !forceNewQR) {
      return {
        success: true,
        connected: true,
        qrCode: null,
        socket: sock,
      }
    }

    // Limpar socket anterior se forceNewQR
    if (forceNewQR && sock) {
      try {
        if (sock.user) await sock.logout()
        sock.end(undefined)
        // Remover todos os listeners - usar verificação de tipo segura
        if (sock.ev && typeof sock.ev.removeAllListeners === 'function') {
          (sock.ev.removeAllListeners as any)()
        }
      } catch (e) {
        // Ignorar erros
      }
      sock = null
      qrCodeAtual = null
      isConnecting = false

      // Limpar credenciais
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        const authDir = path.join(process.cwd(), 'whatsapp_auth')
        await fs.rm(authDir, { recursive: true, force: true })
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (e) {
        // Ignorar erros
      }
    }

    isConnecting = true

    // Carregar auth state
    const { state, saveCreds } = await useMultiFileAuthState('whatsapp_auth')
    const shouldGenerateQR = forceNewQR || !state.creds.me

    console.log('🔄 [WhatsApp] Iniciando conexão...')
    console.log('   - hasCreds:', !!state.creds.me)
    console.log('   - shouldGenerateQR:', shouldGenerateQR)

    // Se deve gerar QR mas tem credenciais, erro
    if (shouldGenerateQR && state.creds.me) {
      throw new Error('Credenciais existem mas forceNewQR=true. Delete a pasta whatsapp_auth manualmente.')
    }

    // Buscar versão do Baileys
    let version
    try {
      const versionData = await fetchLatestBaileysVersion()
      version = versionData.version || versionData
    } catch (e) {
      version = undefined // Usar padrão
    }

    // Criar logger
    const logger = pino({ level: 'silent' })
    
    // Criar socket com configuração SIMPLES
    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: shouldGenerateQR,
      logger,
    })

    // Salvar credenciais quando mudarem
    sock.ev.on('creds.update', saveCreds)

    // LISTENER ÚNICO E SIMPLES - connection.update
    sock.ev.on('connection.update', async (update) => {
      const { connection, qr, isOnline } = update

      // QR Code gerado
      if (qr && shouldGenerateQR) {
        const qrString = qr
        console.log('✅ [WhatsApp] QR Code gerado!')
        
        // Converter para imagem base64
        try {
          const qrcode = await import('qrcode')
          const qrImage = await qrcode.toDataURL(qrString, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 512,
            margin: 4,
          })
          
          qrCodeAtual = qrImage
          
          // Salvar no banco
          try {
            const { createClient } = await import('./supabase/server')
            const supabase = await createClient()
            await supabase
              .from('whatsapp_instances')
              .update({
                qr_code: qrImage,
                status: 'connecting',
                updated_at: new Date().toISOString(),
              })
              .eq('instance_name', 'plenipay')
            console.log('✅ [WhatsApp] QR Code salvo no banco')
          } catch (e: any) {
            console.error('❌ [WhatsApp] Erro ao salvar QR Code:', e.message)
          }
        } catch (e: any) {
          console.error('❌ [WhatsApp] Erro ao gerar imagem QR Code:', e.message)
        }
      }

      // Conectado
      if (connection === 'open' && sock?.user) {
        console.log('✅ [WhatsApp] CONECTADO COM SUCESSO!')
        console.log('   - User ID:', sock.user.id)
        
        isConnecting = false
        qrCodeAtual = null

        // Atualizar status no banco
        try {
          const { atualizarStatusInstanciaConectada } = await import('./whatsapp-instance-manager')
          const phoneNumber = sock.user.id?.split(':')[0] || null
          if (phoneNumber) {
            await atualizarStatusInstanciaConectada('plenipay', phoneNumber)
            console.log('✅ [WhatsApp] Status atualizado no banco')
          }
        } catch (e: any) {
          console.error('❌ [WhatsApp] Erro ao atualizar status:', e.message)
        }
      }

      // Conexão fechada
      if (connection === 'close') {
        const statusCode = (update.lastDisconnect?.error as Boom)?.output?.statusCode
        
        if (statusCode === DisconnectReason.loggedOut) {
          console.log('⚠️ [WhatsApp] Logout realizado')
          qrCodeAtual = null
        }
        
        sock = null
        isConnecting = false
      }
    })

    // Aguardar QR Code ou conexão
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          success: true,
          connected: !!(sock && sock.user),
          qrCode: qrCodeAtual,
          socket: sock,
        })
      }, 10000) // 10 segundos

      // Verificar periodicamente
      const checkInterval = setInterval(() => {
        if (sock?.user) {
          clearTimeout(timeout)
          clearInterval(checkInterval)
          resolve({
            success: true,
            connected: true,
            qrCode: null,
            socket: sock,
          })
        } else if (qrCodeAtual) {
          clearTimeout(timeout)
          clearInterval(checkInterval)
          resolve({
            success: true,
            connected: false,
            qrCode: qrCodeAtual,
            socket: sock,
          })
        }
      }, 1000)
    })
  } catch (error: any) {
    console.error('❌ [WhatsApp] Erro ao conectar:', error)
    isConnecting = false
    sock = null
    qrCodeAtual = null
    return {
      success: false,
      connected: false,
      qrCode: null,
      error: error.message,
      socket: null,
    }
  }
}

export function getWhatsAppStatus() {
  return {
    connected: !!(sock && sock.user),
    user: sock?.user || null,
    phoneNumber: sock?.user?.id?.split(':')[0] || null,
    qrCode: qrCodeAtual,
  }
}

export async function disconnectWhatsApp() {
  if (sock) {
    try {
      if (sock.user) await sock.logout()
      sock.end(undefined)
      // Remover todos os listeners - usar verificação de tipo segura
      if (sock.ev && typeof sock.ev.removeAllListeners === 'function') {
        (sock.ev.removeAllListeners as any)()
      }
    } catch (e) {
      // Ignorar
    }
  }
  sock = null
  isConnecting = false
  qrCodeAtual = null
  return { success: true }
}

export async function enviarMensagemWhatsApp(numero: string, mensagem: string) {
  if (!sock || !sock.user) return false
  
  try {
    const numeroFormatado = numero.includes('@') 
      ? numero 
      : `${numero}@s.whatsapp.net`
    await sock.sendMessage(numeroFormatado, { text: mensagem })
    return true
  } catch (error) {
    console.error('❌ [WhatsApp] Erro ao enviar mensagem:', error)
    return false
  }
}






