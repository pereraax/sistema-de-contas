/**
 * Integração com whatsapp-web.js - 100% GRATUITO
 * Mais simples e confiável que Baileys
 * 
 * IMPORTANTE: Este módulo deve rodar APENAS no servidor!
 * As importações são feitas dinamicamente para evitar bundling no cliente
 */

// Importar store global
import {
  getClient,
  setClient as setClientInStore,
  getQRCode as getQRCodeFromStore,
  setQRCode as setQRCodeInStore,
  getIsConnecting as getIsConnectingFromStore,
  setIsConnecting as setIsConnectingInStore,
  getConnectionStatus as getConnectionStatusFromStore,
  setConnectionStatus as setConnectionStatusInStore,
  getPhoneNumber as getPhoneNumberFromStore,
  setPhoneNumber as setPhoneNumberInStore,
} from './whatsapp-client-store'

// Variáveis locais para referência rápida (atualizadas junto com o store)
let client = getClient()
let qrCodeAtual = getQRCodeFromStore()
let isConnecting = getIsConnectingFromStore()
let connectionStatus = getConnectionStatusFromStore()
let phoneNumber = getPhoneNumberFromStore()

/**
 * Carregar whatsapp-web.js dinamicamente (apenas no servidor)
 * DESABILITADA - estava causando abertura infinita de Chromium
 */
async function loadWhatsAppWebJS() {
  // BLOQUEADO - não carregar whatsapp-web.js
  console.log('⚠️ [WhatsApp-WebJS] loadWhatsAppWebJS está DESABILITADA')
  throw new Error('WhatsApp Web.js está desabilitado. Use apifacil.dev em vez disso.')
  
  /* CÓDIGO ORIGINAL DESABILITADO
  if (typeof window !== 'undefined') {
    throw new Error('whatsapp-web.js só pode ser usado no servidor!')
  }
  
  try {
    const whatsapp = await import('whatsapp-web.js')
    return whatsapp
  } catch (error: any) {
    throw new Error(`Erro ao carregar whatsapp-web.js: ${error.message}`)
  }
  */
}

/**
 * Obter QR Code atual (para exibir na página)
 */
export function getQRCodeWebJS(): string | null {
  return getQRCodeFromStore()
}

/**
 * Verificar se está conectado
 */
// Intervalo para verificar conexão periodicamente (a cada 30 segundos)
let connectionCheckInterval: NodeJS.Timeout | null = null
let whatsappWebCheckInterval: NodeJS.Timeout | null = null

function startConnectionCheck() {
  // DESABILITADA - estava causando loop infinito de reconexão
  console.log('⚠️ [WhatsApp-WebJS] startConnectionCheck está DESABILITADA para evitar loops infinitos')
  
  // Limpar intervalos se existirem
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval)
    connectionCheckInterval = null
  }
  if (whatsappWebCheckInterval) {
    clearInterval(whatsappWebCheckInterval)
    whatsappWebCheckInterval = null
  }
  
  // NÃO iniciar nenhum intervalo - isso estava causando abertura infinita de Chromium
  return
  
  /* CÓDIGO ORIGINAL DESABILITADO
  // Limpar intervalo anterior se existir
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval)
  }
  
  // Verificar conexão a cada 30 segundos
  connectionCheckInterval = setInterval(async () => {
    const connected = isConnectedWebJS()
    client = getClient()
    
    if (!connected && client) {
      // Cliente existe mas não está conectado - pode estar perdido
      console.log('⚠️ [WhatsApp-WebJS] Cliente existe mas não está conectado. Verificando...')
      
      // Verificar se o cliente realmente está conectado
      if (client.pupPage || client.pupBrowser) {
        // Cliente parece estar ativo, atualizar status
        setConnectionStatusInStore('connected')
        console.log('✅ [WhatsApp-WebJS] Status corrigido: conectado')
      } else {
        // Cliente não está ativo, tentar reconectar
        console.log('🔄 [WhatsApp-WebJS] Cliente não está ativo. Reconectando...')
        // DESABILITADO - não reconectar automaticamente
        // await connectWhatsAppWebJS(false)
      }
    } else if (!connected && !client && connectionStatus !== 'connecting') {
      // Não está conectado e não está conectando - tentar reconectar se houver sessão
      console.log('🔄 [WhatsApp-WebJS] Verificando se há sessão salva para reconectar...')
      await autoInitializeWhatsApp_DISABLED()
    }
  }, 30000) // 30 segundos
  
  // CRÍTICO: Verificar se WhatsApp Web está carregado periodicamente (a cada 60 segundos)
  if (whatsappWebCheckInterval) {
    clearInterval(whatsappWebCheckInterval)
  }
  
  whatsappWebCheckInterval = setInterval(async () => {
    const currentClient = getClient()
    if (currentClient && currentClient.info && currentClient.pupPage) {
      try {
        const ready = await currentClient.pupPage.evaluate(() => {
          try {
            const win = window as any
            return typeof window !== 'undefined' && 
                   typeof win.Store !== 'undefined' && 
                   typeof win.Store.Chat !== 'undefined'
          } catch (e) {
            return false
          }
        }).catch(() => false)
        
        if (!ready) {
          console.warn('⚠️ [WhatsApp-WebJS] WhatsApp Web não está pronto! Tentando garantir listeners...')
          // Tentar garantir que listeners estão ativos mesmo se WhatsApp Web não estiver pronto
          try {
            const { ensureMessageListeners } = await import('./whatsapp-webjs')
            await ensureMessageListeners()
          } catch (e: any) {
            console.warn('⚠️ [WhatsApp-WebJS] Erro ao garantir listeners:', e.message)
          }
        } else {
          // WhatsApp Web está pronto, garantir listeners estão ativos
          const events = (currentClient as any)._events || {}
          const hasMessageListener = !!(events.message || events.message_create)
          
          if (!hasMessageListener) {
            console.warn('⚠️ [WhatsApp-WebJS] Listeners não encontrados! Reconfigurando...')
            try {
              const { ensureMessageListeners } = await import('./whatsapp-webjs')
              await ensureMessageListeners()
            } catch (e: any) {
              console.warn('⚠️ [WhatsApp-WebJS] Erro ao reconfigurar listeners:', e.message)
            }
          }
        }
      } catch (e: any) {
        // Ignorar erros silenciosamente
      }
    }
  }, 60000) // Verificar a cada 60 segundos
  */
}

// DESABILITADO PERMANENTEMENTE - estava causando loop infinito de reconexão
// Iniciar verificação periódica quando o módulo é carregado
// if (typeof window === 'undefined') {
//   setTimeout(() => {
//     startConnectionCheck()
//   }, 10000) // Iniciar após 10 segundos
// }
// 
// NUNCA MAIS EXECUTAR startConnectionCheck() AUTOMATICAMENTE!

export function isConnectedWebJS(): boolean {
  // Atualizar referências locais do store
  connectionStatus = getConnectionStatusFromStore()
  client = getClient()
  
  // Primeiro verificar se status foi marcado como conectado
  if (connectionStatus === 'connected') {
    return true
  }
  
  if (!client) {
    return false
  }
  
  // Se o cliente tem pupPage, provavelmente está conectado (mesmo sem info ainda)
  if (client.pupPage || client.pupBrowser) {
    // Se recebeu mensagens, definitivamente está conectado
    if (connectionStatus === 'connected') {
      return true
    }
  }
  
  // Verificar múltiplos sinais de conexão
  const hasInfo = client.info !== undefined && client.info !== null
  const hasWid = client.info?.wid !== undefined && client.info?.wid !== null
  
  const connected = hasInfo && hasWid
  
  if (connected) {
    // Atualizar estado global
    connectionStatus = 'connected'
    const wid = client.info?.wid
    if (wid) {
      if (typeof wid === 'string') {
        phoneNumber = wid.split('@')[0]
      } else if (wid.user) {
        phoneNumber = wid.user
      }
    }
    
    console.log('✅ [WhatsApp-WebJS] Status: CONECTADO', {
      hasInfo,
      hasWid,
      phoneNumber: phoneNumber || 'N/A'
    })
  }
  
  return connected
}

/**
 * Função para auto-inicializar WhatsApp se houver sessão salva
 * DESABILITADA - estava causando abertura infinita de Chromium
 */
async function autoInitializeWhatsApp_DISABLED() {
  try {
    // Verificar se já existe sessão salva
    const fs = await import('fs/promises')
    const path = await import('path')
    const authDir = path.join(process.cwd(), 'whatsapp_auth_webjs')
    
    try {
      await fs.access(authDir)
      // Diretório existe, pode ter sessão salva
      const files = await fs.readdir(authDir)
      
      if (files.length > 0) {
        console.log('🔄 [WhatsApp-WebJS] Sessão encontrada! Auto-inicializando...')
        // Aguardar um pouco para garantir que o servidor está pronto
        setTimeout(async () => {
          const result = await connectWhatsAppWebJS(false)
          if (result.success) {
            console.log('✅ [WhatsApp-WebJS] Auto-inicialização bem-sucedida!')
          }
        }, 3000) // 3 segundos após o servidor iniciar
      }
    } catch (e) {
      // Diretório não existe, sem sessão salva
      console.log('ℹ️ [WhatsApp-WebJS] Nenhuma sessão salva encontrada. Aguardando conexão manual...')
    }
  } catch (error: any) {
    console.log('ℹ️ [WhatsApp-WebJS] Não foi possível verificar sessão salva:', error.message)
  }
}

// DESABILITADO: Auto-inicialização estava abrindo Chromium automaticamente
// Auto-inicializar quando o módulo for carregado (apenas no servidor)
// if (typeof window === 'undefined') {
//   // Executar auto-inicialização após um delay para garantir que o servidor está pronto
//   setTimeout(() => {
//     autoInitializeWhatsApp()
//   }, 5000) // 5 segundos após o módulo ser carregado
// }

/**
 * Conectar WhatsApp via whatsapp-web.js
 * @param forceNew - Forçar nova conexão (limpar sessão anterior)
 */
export async function connectWhatsAppWebJS(forceNew = false) {
  // BLOQUEIO PERMANENTE: Desabilitar WhatsApp Web.js para evitar abertura de Chromium
  // O sistema agora usa apenas apifacil.dev que não precisa de navegador
  console.log('⚠️ [WhatsApp-WebJS] WhatsApp Web.js está DESABILITADO. Use apifacil.dev em vez disso.')
  console.log('⚠️ [WhatsApp-WebJS] Esta função foi bloqueada para evitar abertura infinita de Chromium.')
  
  // RETORNAR IMEDIATAMENTE - NÃO EXECUTAR NENHUM CÓDIGO ABAIXO
  return {
    success: false,
    error: 'WhatsApp Web.js está desabilitado. Use apifacil.dev que não precisa de navegador.',
    connected: false,
    qr: null,
  }
  
  // CÓDIGO ORIGINAL COMPLETAMENTE DESABILITADO
  // Removido para evitar erros de compilação e abertura de Chromium
  /*
  // Se já está conectado e não quer forçar, garantir que listeners estão configurados
  if (client && isConnectedWebJS() && !forceNew) {
    // Verificar se os listeners estão configurados
    const existingClient = getClient()
    if (existingClient) {
      const listeners = (existingClient as any)._events || {}
      const hasMessageListener = listeners.message || listeners.message_create
      
      if (!hasMessageListener) {
        console.warn('⚠️ [WhatsApp-WebJS] Cliente existe mas sem listeners! Reconfigurando...')
        // Continuar para configurar listeners
      } else {
        console.log('✅ [WhatsApp-WebJS] Cliente já conectado com listeners configurados')
    return { 
      success: true, 
      connected: true, 
      qr: null,
      message: 'Já está conectado!'
        }
      }
    } else {
    return { 
      success: true, 
      connected: true, 
      qr: null,
      message: 'Já está conectado!'
      }
    }
  }

  // Se já está conectando, aguardar
  if (isConnecting) {
    return { 
      success: false, 
      error: 'Já está conectando. Aguarde...',
      qr: qrCodeAtual
    }
  }

  setIsConnectingInStore(true)
  setQRCodeInStore(null)
  setConnectionStatusInStore('connecting')
  isConnecting = true
  qrCodeAtual = null
  connectionStatus = 'connecting'

  try {
    // Carregar whatsapp-web.js dinamicamente
    const whatsapp = await loadWhatsAppWebJS()
    const { Client } = whatsapp
    const { LocalAuth } = whatsapp

    // Carregar qrcode dinamicamente
    const qrcodeModule = await import('qrcode')

    // Se forçar novo, limpar sessão anterior
    if (forceNew && client) {
      try {
        await client.destroy()
      } catch (e: any) {
        console.log('⚠️ [WhatsApp-WebJS] Erro ao destruir cliente anterior:', e.message)
      }
      setClientInStore(null)
      client = null
      
      // Limpar pasta de autenticação
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        const authDir = path.join(process.cwd(), 'whatsapp_auth_webjs')
        
        try {
          await fs.access(authDir)
          await fs.rm(authDir, { recursive: true, force: true })
          console.log('✅ [WhatsApp-WebJS] Pasta de autenticação limpa')
        } catch (e: any) {
          // Pasta não existe, tudo bem
        }
      } catch (e: any) {
        console.log('⚠️ [WhatsApp-WebJS] Erro ao limpar autenticação:', e.message)
      }
    }

    // Tentar usar puppeteer instalado, ou usar o que vem com whatsapp-web.js
    // CRÍTICO: Usar headless: 'new' para melhor compatibilidade com WhatsApp Web
    // FORÇAR HEADLESS para não abrir navegador
    let puppeteerOptions: any = {
      headless: 'new', // SEMPRE headless - não abrir navegador
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security', // Permitir carregamento de recursos
        '--disable-features=IsolateOrigins,site-per-process', // Melhorar compatibilidade
        '--window-size=1920,1080', // Tamanho de janela fixo
        '--start-maximized', // Maximizar janela
        '--disable-blink-features=AutomationControlled', // Não detectar automação
      ],
      // Timeout maior para garantir que carrega
      timeout: 60000,
    }
    
    // Se puppeteer estiver instalado, usar o executável dele
    try {
      const puppeteer = require('puppeteer')
      if (puppeteer.executablePath) {
        puppeteerOptions.executablePath = puppeteer.executablePath()
      }
    } catch (e) {
      // Puppeteer não encontrado, usar o padrão do whatsapp-web.js
      console.log('⚠️ [WhatsApp-WebJS] Puppeteer não encontrado, usando padrão do whatsapp-web.js')
    }

    // Criar novo cliente
    const newClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: './whatsapp_auth_webjs',
        clientId: 'plenipay',
      }),
      puppeteer: puppeteerOptions,
      // IMPORTANTE: Configurar para receber mensagens
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51.html',
      },
      // CRÍTICO: Aguardar WhatsApp Web carregar completamente
      waitForSelector: 'div[data-testid="chat-list"]',
      // Timeout maior para garantir que carrega
      authTimeoutMs: 90000, // Aumentado para 90 segundos
      // CRÍTICO: Configurações adicionais para garantir carregamento
      qrMaxRetries: 10, // Máximo de tentativas para QR code
      restartOnAuthFail: true, // Reiniciar se autenticação falhar
      takeoverOnConflict: true, // Assumir controle se houver conflito
      takeoverTimeoutMs: 0, // Sem timeout para takeover
    })
    
    console.log('📱 [WhatsApp-WebJS] Cliente criado, configurando eventos...')
    
    // Armazenar no store global ANTES de configurar eventos
    setClientInStore(newClient)
    client = newClient

    // Evento: QR Code gerado
    newClient.on('qr', async (qr: string) => {
      console.log('📱 [WhatsApp-WebJS] QR Code gerado!')
      try {
        // Converter QR Code para imagem base64
        const qrCodeImage = await qrcodeModule.toDataURL(qr)
        setQRCodeInStore(qrCodeImage)
        qrCodeAtual = qrCodeImage
        console.log('✅ [WhatsApp-WebJS] QR Code convertido para imagem')
      } catch (error: any) {
        console.error('❌ [WhatsApp-WebJS] Erro ao converter QR Code:', error.message)
        setQRCodeInStore(qr) // Fallback: retornar string do QR Code
        qrCodeAtual = qr
      }
    })

    // Evento: Cliente pronto (conectado)
    newClient.on('ready', async () => {
      console.log('✅ [WhatsApp-WebJS] ==========================================')
      console.log('✅ [WhatsApp-WebJS] WhatsApp CONECTADO COM SUCESSO!')
      
      // CRÍTICO: Aguardar WhatsApp Web carregar COMPLETAMENTE antes de continuar
      console.log('⏳ [WhatsApp-WebJS] Aguardando WhatsApp Web carregar completamente...')
      
      if (newClient.pupPage) {
        // Aguardar até 60 segundos para WhatsApp Web carregar
        let whatsappWebReady = false
        for (let i = 0; i < 20; i++) {
          try {
            whatsappWebReady = await newClient.pupPage.evaluate(() => {
              try {
                // Verificar múltiplos sinais de que WhatsApp Web está pronto
                const win = window as any
                return typeof window !== 'undefined' && 
                       typeof win.Store !== 'undefined' && 
                       typeof win.Store.Chat !== 'undefined' &&
                       typeof win.Store.Msg !== 'undefined' &&
                       typeof win.Store.SendMessage !== 'undefined' &&
                       typeof win.Store.Conn !== 'undefined'
              } catch (e) {
                return false
              }
            }).catch(() => false)
            
            if (whatsappWebReady) {
              console.log(`✅ [WhatsApp-WebJS] WhatsApp Web carregado completamente após ${(i + 1) * 3} segundos!`)
              break
            }
            
            if (i < 19) {
              console.log(`⏳ [WhatsApp-WebJS] Aguardando WhatsApp Web carregar... (${i + 1}/20)`)
              await new Promise(resolve => setTimeout(resolve, 3000))
            }
          } catch (e: any) {
            console.warn(`⚠️ [WhatsApp-WebJS] Erro ao verificar WhatsApp Web (tentativa ${i + 1}):`, e.message)
            await new Promise(resolve => setTimeout(resolve, 3000))
          }
        }
        
        if (!whatsappWebReady) {
          console.error('❌ [WhatsApp-WebJS] WhatsApp Web NÃO carregou após 60 segundos!')
          console.error('❌ [WhatsApp-WebJS] Isso pode causar problemas ao receber/enviar mensagens!')
          console.error('❌ [WhatsApp-WebJS] Tentando forçar carregamento...')
          
          // Tentar recarregar a página
          try {
            await newClient.pupPage.reload({ waitUntil: 'networkidle2', timeout: 30000 })
            console.log('🔄 [WhatsApp-WebJS] Página recarregada. Aguardando 10 segundos...')
            await new Promise(resolve => setTimeout(resolve, 10000))
          } catch (e: any) {
            console.error('❌ [WhatsApp-WebJS] Erro ao recarregar página:', e.message)
          }
        }
      }
      
      // SEMPRE reconfigurar listeners após ready, mesmo que já existam
      // Isso garante que estão funcionando corretamente
      console.log('🔧 [WhatsApp-WebJS] RECONFIGURANDO listeners após ready...')
      
      // Remover listeners antigos
      newClient.removeAllListeners('message')
      newClient.removeAllListeners('message_create')
      newClient.removeAllListeners('message_ack')
      
      // Aguardar um pouco para garantir que WhatsApp Web está totalmente carregado
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Reconfigurar listeners com logs detalhados
      const messageHandler = async (msg: any) => {
        console.log('🔔 [WhatsApp-WebJS] ==========================================')
        console.log('🔔 [WhatsApp-WebJS] EVENTO message DISPARADO!')
        console.log('🔔 [WhatsApp-WebJS] Handler está FUNCIONANDO!')
        console.log('🔔 [WhatsApp-WebJS] ID:', msg.id?._serialized || msg.id)
        console.log('🔔 [WhatsApp-WebJS] De:', msg.from)
        console.log('🔔 [WhatsApp-WebJS] ==========================================')
        await processarMensagemRecebida(msg, newClient)
      }
      
      const messageCreateHandler = async (msg: any) => {
        console.log('🔔 [WhatsApp-WebJS] EVENTO message_create DISPARADO!')
        await processarMensagemRecebida(msg, newClient)
      }
      
      newClient.on('message', messageHandler)
      newClient.on('message_create', messageCreateHandler)
      
      // Adicionar listener de ACK para debug
      newClient.on('message_ack', (msg: any, ack: any) => {
        console.log('📬 [WhatsApp-WebJS] Message ACK recebido (eventos funcionando!):', ack)
      })
      
      // Verificar listeners configurados
      const readyListeners = (newClient as any)._events || {}
      const messageListeners = readyListeners.message || []
      const messageCreateListeners = readyListeners.message_create || []
      
      console.log('🔍 [WhatsApp-WebJS] Listeners configurados após ready:')
      console.log('🔍 [WhatsApp-WebJS] Eventos:', Object.keys(readyListeners))
      console.log('🔍 [WhatsApp-WebJS] Tem message?', !!(readyListeners.message))
      console.log('🔍 [WhatsApp-WebJS] Message listeners count:', Array.isArray(messageListeners) ? messageListeners.length : (messageListeners ? 1 : 0))
      console.log('🔍 [WhatsApp-WebJS] Tem message_create?', !!(readyListeners.message_create))
      console.log('🔍 [WhatsApp-WebJS] Message_create listeners count:', Array.isArray(messageCreateListeners) ? messageCreateListeners.length : (messageCreateListeners ? 1 : 0))
      console.log('✅ [WhatsApp-WebJS] Listeners reconfigurados e prontos!')
      console.log('✅ [WhatsApp-WebJS] ==========================================')
      
      // Marcar tempo de conexão para verificar se acabou de conectar
      (newClient as any)._readyTime = Date.now()
      
      // Extrair número de telefone
      const wid = newClient?.info?.wid
      if (wid) {
        let phone = null
        if (typeof wid === 'string') {
          phone = wid.split('@')[0]
        } else if (wid.user) {
          phone = wid.user
        }
        if (phone) {
          setPhoneNumberInStore(phone)
          phoneNumber = phone
        }
      }
      
      console.log('✅ [WhatsApp-WebJS] Número:', phoneNumber || 'N/A')
      console.log('✅ [WhatsApp-WebJS] Nome:', newClient?.info?.pushname || 'N/A')
      console.log('✅ [WhatsApp-WebJS] Info completo:', JSON.stringify(newClient?.info, null, 2))
      console.log('✅ [WhatsApp-WebJS] Cliente está pronto para receber mensagens!')
      console.log('✅ [WhatsApp-WebJS] Listener de mensagens ATIVO!')
      console.log('✅ [WhatsApp-WebJS] ==========================================')
      
      // CRÍTICO: Limpar QR Code após conectar - só marcar como conectado se realmente conectou
      console.log('🧹 [WhatsApp-WebJS] Limpando QR Code após conexão...')
      setQRCodeInStore(null) // Limpar QR Code após conectar
      setIsConnectingInStore(false)
      setConnectionStatusInStore('connected')
      qrCodeAtual = null
      isConnecting = false
      connectionStatus = 'connected'
      
      // Garantir que QR code foi realmente limpo
      const qrCodeAposLimpar = getQRCodeFromStore()
      if (qrCodeAposLimpar) {
        console.warn('⚠️ [WhatsApp-WebJS] QR Code ainda existe após limpar! Forçando limpeza...')
        setQRCodeInStore(null)
        qrCodeAtual = null
      } else {
        console.log('✅ [WhatsApp-WebJS] QR Code limpo com sucesso!')
      }
      
      // Aguardar 5 segundos após ready para garantir que WhatsApp Web está totalmente carregado
      console.log('⏳ [WhatsApp-WebJS] Aguardando 5 segundos para garantir que WhatsApp Web está totalmente carregado...')
      setTimeout(() => {
        console.log('✅ [WhatsApp-WebJS] WhatsApp Web deve estar totalmente carregado agora!')
        console.log('✅ [WhatsApp-WebJS] Pronto para enviar e receber mensagens!')
      }, 5000)
      
      // Aguardar um pouco e verificar novamente
      setTimeout(() => {
        const stillConnected = isConnectedWebJS()
        console.log('🔍 [WhatsApp-WebJS] Verificação pós-ready:', stillConnected)
        if (stillConnected) {
          connectionStatus = 'connected'
        }
      }, 2000)
    })

    // Evento: Autenticação realizada
    newClient.on('authenticated', () => {
      console.log('✅ [WhatsApp-WebJS] Autenticado!')
    })

    // Evento: Autenticação falhou
    newClient.on('auth_failure', (msg: string) => {
      console.error('❌ [WhatsApp-WebJS] Falha na autenticação:', msg)
      isConnecting = false
    })

    // Evento: Desconectado - DESABILITADA RECONEXÃO AUTOMÁTICA (estava causando loops infinitos)
    newClient.on('disconnected', async (reason: string) => {
      console.log('⚠️ [WhatsApp-WebJS] Desconectado:', reason)
      console.log('ℹ️ [WhatsApp-WebJS] Reconexão automática DESABILITADA para evitar loops infinitos')
      
      // Atualizar estado
      setConnectionStatusInStore('disconnected')
      setIsConnectingInStore(false)
      setQRCodeInStore(null)
      connectionStatus = 'disconnected'
      isConnecting = false
      qrCodeAtual = null
      
      // Limpar cliente
      try {
        if (newClient) {
          await newClient.destroy()
        }
      } catch (e) {
        // Ignorar erros ao destruir cliente desconectado
      }
      
      setClientInStore(null)
      client = null
      setPhoneNumberInStore(null)
      phoneNumber = null
      
      // NÃO reconectar automaticamente - isso estava causando loops infinitos
      // Usuário deve reconectar manualmente se necessário
      // Isso evita que o Chromium abra repetidamente
    })

    // CRÍTICO: Configurar listeners ANTES de initialize() para garantir que capturam TODAS as mensagens
    console.log('🎧 [WhatsApp-WebJS] Configurando listener de mensagens ANTES de initialize()...')
    
    // Variável para evitar processar mensagens duplicadas
    let processandoMensagens = new Set<string>()
    
    // Função auxiliar para processar mensagens (definida ANTES de usar nos listeners)
    async function processarMensagemRecebida(msg: any, clientInstance: any) {
      try {
        // Criar ID único para a mensagem
        const msgId = msg.id?._serialized || msg.id || `${msg.from}-${Date.now()}`
        
        // Evitar processar a mesma mensagem duas vezes
        if (processandoMensagens.has(msgId)) {
          console.log('⏭️ [WhatsApp-WebJS] Mensagem já sendo processada, ignorando duplicata:', msgId)
          return
        }
        
        processandoMensagens.add(msgId)
        
        // Limpar IDs antigos após 1 minuto (evitar vazamento de memória)
        setTimeout(() => {
          processandoMensagens.delete(msgId)
        }, 60000)
        
        console.log('📨 [WhatsApp-WebJS] ==========================================')
        console.log('📨 [WhatsApp-WebJS] EVENTO MESSAGE DISPARADO!')
        console.log('📨 [WhatsApp-WebJS] ID da mensagem:', msgId)
        console.log('📨 [WhatsApp-WebJS] De:', msg.from)
        console.log('📨 [WhatsApp-WebJS] Tipo:', msg.type)
        console.log('📨 [WhatsApp-WebJS] Timestamp:', msg.timestamp)
        console.log('📨 [WhatsApp-WebJS] ==========================================')
        
        // Atualizar referências do store
        connectionStatus = getConnectionStatusFromStore()
        client = getClient()
        
        // Se recebeu mensagem, está conectado! Marcar como conectado
        if (connectionStatus !== 'connected') {
          console.log('✅ [WhatsApp-WebJS] Detectado conectado via mensagem recebida!')
          setConnectionStatusInStore('connected')
          setQRCodeInStore(null)
          setIsConnectingInStore(false)
          connectionStatus = 'connected'
          qrCodeAtual = null
          isConnecting = false
          
          // Tentar extrair número do próprio cliente
          if (client?.info?.wid) {
            const wid = client.info.wid
            let phone = null
            if (typeof wid === 'string') {
              phone = wid.split('@')[0]
            } else if (wid.user) {
              phone = wid.user
            }
            if (phone) {
              setPhoneNumberInStore(phone)
              phoneNumber = phone
            }
          }
        }
        
        // Ignorar mensagens próprias e de status
        if (msg.from === 'status@broadcast') {
          console.log('⏭️ [WhatsApp-WebJS] Ignorando mensagem de status')
          return
        }

        if (msg.from && msg.from.includes('@g.us')) {
          console.log('⏭️ [WhatsApp-WebJS] Ignorando mensagem de grupo')
          return
        }

        // Ignorar mensagens enviadas por nós mesmos
        if (msg.fromMe === true) {
          console.log('⏭️ [WhatsApp-WebJS] Ignorando mensagem própria')
          return
        }

        // Extrair texto da mensagem de forma mais robusta
        let texto = ''
        if (msg.body) {
          texto = msg.body
        } else if (msg.text) {
          texto = msg.text
        } else if (msg.message?.conversation) {
          texto = msg.message.conversation
        } else if (msg.message?.extendedTextMessage?.text) {
          texto = msg.message.extendedTextMessage.text
        } else if (msg.msg?.conversation) {
          texto = msg.msg.conversation
        }
        
        const numero = msg.from ? msg.from.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '') : 'unknown'
        const isGroup = msg.from && msg.from.includes('@g.us')

        // Se for grupo, ignorar por enquanto
        if (isGroup) {
          console.log('⏭️ [WhatsApp-WebJS] Ignorando grupo')
          return
        }
        
        if (!texto || texto.trim() === '') {
          console.log('⏭️ [WhatsApp-WebJS] Ignorando mensagem sem texto')
          console.log('⏭️ [WhatsApp-WebJS] Estrutura da mensagem:', JSON.stringify(msg, null, 2).substring(0, 300))
          return
        }

        console.log('📨 [WhatsApp-WebJS] Mensagem recebida:', {
          de: numero,
          texto: texto.substring(0, 50),
          from: msg.from,
          hasBody: !!msg.body,
          hasText: !!msg.text,
          tipo: msg.type,
        })

        // Processar mensagem via webhook interno
        // IMPORTANTE: Atualizar referência do cliente do store ANTES de fazer qualquer chamada async
        client = getClient()
        const currentClientRef = client
        const numeroRemetente = numero
        const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        
        try {
          // Formato esperado pelo handler
          const messageData = {
              key: {
                remoteJid: msg.from,
              id: msg.id?._serialized || msg.id,
              },
              message: {
                conversation: texto,
                extendedTextMessage: {
                  text: texto,
                },
              },
            messageTimestamp: msg.timestamp,
            pushName: msg.notifyName || msg.pushName,
          }

          console.log('📤 [WhatsApp-WebJS] Enviando para webhook:', {
            remoteJid: msg.from,
            textLength: texto.length,
            hasClientRef: !!currentClientRef,
          })
          
          // Função para enviar resposta usando o cliente capturado
          const enviarResposta = async (mensagemResposta: string) => {
            // Garantir que temos o cliente - usar store global
            let clientToUse = getClient()
            if (!clientToUse && currentClientRef) {
              setClientInStore(currentClientRef)
              clientToUse = currentClientRef
              client = currentClientRef
              console.log('✅ [WhatsApp-WebJS] Cliente restaurado para envio')
            }
            
            if (!clientToUse) {
              console.error('❌ [WhatsApp-WebJS] Não foi possível restaurar cliente para envio')
              return false
            }
            
            return await enviarMensagemWebJS(numeroRemetente, mensagemResposta)
          }
          
          const response = await fetch(`${webhookUrl}/api/whatsapp/webhook`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ [WhatsApp-WebJS] Erro ao processar webhook:', response.status, errorText)
          } else {
            console.log('✅ [WhatsApp-WebJS] Mensagem processada pelo webhook')
            
            // Verificar se cliente ainda existe após webhook - usar store
            const clientAfter = getClient()
            if (!clientAfter && currentClientRef) {
              console.warn('⚠️ [WhatsApp-WebJS] Cliente foi perdido após webhook, restaurando...')
              setClientInStore(currentClientRef)
              client = currentClientRef
            }
          }
        } catch (webhookError: any) {
          console.error('❌ [WhatsApp-WebJS] Erro ao chamar webhook:', {
            message: webhookError.message,
            stack: webhookError.stack?.substring(0, 300),
          })
        }
      } catch (error: any) {
        console.error('❌ [WhatsApp-WebJS] Erro ao processar mensagem:', {
          message: error.message,
          stack: error.stack?.substring(0, 300),
          msgId: msg.id?._serialized || msg.id,
        })
      } finally {
        // Sempre remover da lista de processamento, mesmo em caso de erro
        const msgIdFinal = msg.id?._serialized || msg.id || `${msg.from}-${Date.now()}`
        setTimeout(() => {
          processandoMensagens.delete(msgIdFinal)
        }, 5000)
      }
    }
    
    // Configurar listeners DEPOIS de definir a função
    // CRÍTICO: Remover listeners antigos se existirem (para evitar duplicação)
    console.log('🔧 [WhatsApp-WebJS] Configurando listeners de mensagens...')
    
    // Verificar listeners existentes ANTES de remover
    const existingListeners = (newClient as any)._events || {}
    console.log('🔍 [WhatsApp-WebJS] Listeners existentes ANTES:', Object.keys(existingListeners))
    
    newClient.removeAllListeners('message')
    newClient.removeAllListeners('message_create')
    
    // Configurar listener para 'message' (evento principal)
    newClient.on('message', async (msg: any) => {
      console.log('🔔 [WhatsApp-WebJS] EVENTO message DISPARADO!')
      await processarMensagemRecebida(msg, newClient)
    })
    
    // Configurar listener para 'message_create' (evento secundário)
    newClient.on('message_create', async (msg: any) => {
      console.log('🔔 [WhatsApp-WebJS] EVENTO message_create DISPARADO!')
      await processarMensagemRecebida(msg, newClient)
    })
    
    // Também configurar listener para 'message_ack' para debug
    newClient.on('message_ack', (msg: any, ack: any) => {
      console.log('📬 [WhatsApp-WebJS] Message ACK recebido:', ack)
    })
    
    console.log('✅ [WhatsApp-WebJS] Listeners de mensagens configurados!')
    
    // Verificar se listeners foram configurados corretamente
    const listenersCheck = (newClient as any)._events || {}
    const messageListeners = listenersCheck.message || []
    const messageCreateListeners = listenersCheck.message_create || []
    console.log('🔍 [WhatsApp-WebJS] Eventos registrados:', Object.keys(listenersCheck))
    console.log('🔍 [WhatsApp-WebJS] Listeners de message:', Array.isArray(messageListeners) ? messageListeners.length : (messageListeners ? 1 : 0))
    console.log('🔍 [WhatsApp-WebJS] Listeners de message_create:', Array.isArray(messageCreateListeners) ? messageCreateListeners.length : (messageCreateListeners ? 1 : 0))

    // Inicializar cliente (não aguardar - eventos vão disparar)
    console.log('🔄 [WhatsApp-WebJS] Inicializando cliente...')
    
    // CRÍTICO: Se já está inicializado, garantir que listeners estão configurados
    if ((newClient as any).pupPage || (newClient as any).info) {
      console.log('ℹ️ [WhatsApp-WebJS] Cliente já parece estar inicializado. Verificando estado...')
      
      // Verificar se realmente está pronto
      try {
        if (newClient.info) {
          console.log('✅ [WhatsApp-WebJS] Cliente já está conectado!')
          
          // CRÍTICO: Sempre reconfigurar listeners mesmo se já conectado
          console.log('🔧 [WhatsApp-WebJS] Garantindo que listeners estão configurados em cliente já conectado...')
          await ensureMessageListeners()
          
          setConnectionStatusInStore('connected')
          setIsConnectingInStore(false)
          setQRCodeInStore(null)
          connectionStatus = 'connected'
          isConnecting = false
          qrCodeAtual = null
          
          // Extrair número
          const wid = newClient.info.wid
          if (wid) {
            let phone = null
            if (typeof wid === 'string') {
              phone = wid.split('@')[0]
            } else if (wid.user) {
              phone = wid.user
            }
            if (phone) {
              setPhoneNumberInStore(phone)
              phoneNumber = phone
            }
          }
          
          // Verificar se WhatsApp Web está realmente carregado
          try {
            if (newClient.pupPage) {
              const whatsappLoaded = await newClient.pupPage.evaluate(() => {
                try {
                  const win = window as any
                  return typeof window !== 'undefined' && 
                         typeof win.Store !== 'undefined' && 
                         typeof win.Store.Chat !== 'undefined'
                } catch (e) {
                  return false
                }
              }).catch(() => false)
              
              console.log('🔍 [WhatsApp-WebJS] WhatsApp Web carregado?', whatsappLoaded)
              
              if (!whatsappLoaded) {
                console.warn('⚠️ [WhatsApp-WebJS] WhatsApp Web pode não estar totalmente carregado!')
              }
            }
          } catch (e: any) {
            console.warn('⚠️ [WhatsApp-WebJS] Erro ao verificar WhatsApp Web:', e.message)
          }
          
          return {
            success: true,
            connected: true,
            qr: null,
            message: 'Cliente já estava conectado! Listeners reconfigurados.'
          }
        }
      } catch (e) {
        // Continuar com inicialização
      }
    }
    
    // CRÍTICO: Aguardar um pouco antes de inicializar para garantir que tudo está pronto
    console.log('⏳ [WhatsApp-WebJS] Aguardando 2 segundos antes de inicializar...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    newClient.initialize().catch((error: any) => {
      console.error('❌ [WhatsApp-WebJS] Erro ao inicializar:', error)
      setIsConnectingInStore(false)
      setConnectionStatusInStore('disconnected')
      isConnecting = false
      connectionStatus = 'disconnected'
    })
    
    // CRÍTICO: Após inicializar, aguardar e verificar se WhatsApp Web carregou
    // Fazer isso em background para não bloquear
    setTimeout(async () => {
      try {
        if (newClient.pupPage) {
          console.log('🔍 [WhatsApp-WebJS] Verificando se WhatsApp Web está pronto após inicialização...')
          
          // Aguardar até 30 segundos para WhatsApp Web carregar
          for (let i = 0; i < 10; i++) {
            const ready = await newClient.pupPage.evaluate(() => {
              try {
                const win = window as any
                return typeof window !== 'undefined' && 
                       typeof win.Store !== 'undefined' && 
                       typeof win.Store.Chat !== 'undefined' &&
                       typeof win.Store.Msg !== 'undefined'
              } catch (e) {
                return false
              }
            }).catch(() => false)
            
            if (ready) {
              console.log(`✅ [WhatsApp-WebJS] WhatsApp Web carregado após ${(i + 1) * 3} segundos!`)
              // Garantir listeners após WhatsApp Web carregar
              await ensureMessageListeners()
              break
            }
            
            if (i < 9) {
              console.log(`⏳ [WhatsApp-WebJS] Aguardando WhatsApp Web carregar... (${i + 1}/10)`)
              await new Promise(resolve => setTimeout(resolve, 3000))
            } else {
              console.error('❌ [WhatsApp-WebJS] WhatsApp Web não carregou após 30 segundos!')
            }
          }
        }
      } catch (e: any) {
        console.warn('⚠️ [WhatsApp-WebJS] Erro ao verificar WhatsApp Web:', e.message)
      }
    }, 5000) // Aguardar 5 segundos após initialize() antes de verificar
    
    // CRÍTICO: Após inicializar, aguardar e verificar se WhatsApp Web carregou
    // Fazer isso em background para não bloquear
    setTimeout(async () => {
      try {
        if (newClient.pupPage) {
          console.log('🔍 [WhatsApp-WebJS] Verificando se WhatsApp Web está pronto após inicialização...')
          
          // Aguardar até 30 segundos para WhatsApp Web carregar
          for (let i = 0; i < 10; i++) {
            const ready = await newClient.pupPage.evaluate(() => {
              try {
                const win = window as any
                return typeof window !== 'undefined' && 
                       typeof win.Store !== 'undefined' && 
                       typeof win.Store.Chat !== 'undefined' &&
                       typeof win.Store.Msg !== 'undefined'
              } catch (e) {
                return false
              }
            }).catch(() => false)
            
            if (ready) {
              console.log(`✅ [WhatsApp-WebJS] WhatsApp Web carregado após ${(i + 1) * 3} segundos!`)
              break
            }
            
            if (i < 9) {
              console.log(`⏳ [WhatsApp-WebJS] Aguardando WhatsApp Web carregar... (${i + 1}/10)`)
              await new Promise(resolve => setTimeout(resolve, 3000))
            } else {
              console.error('❌ [WhatsApp-WebJS] WhatsApp Web não carregou após 30 segundos!')
            }
          }
        }
      } catch (e: any) {
        console.warn('⚠️ [WhatsApp-WebJS] Erro ao verificar WhatsApp Web:', e.message)
      }
    }, 5000) // Aguardar 5 segundos após initialize() antes de verificar

    // Aguardar QR Code ser gerado OU conexão estabelecida (máximo 30 segundos)
    let tentativas = 0
    while (tentativas < 30) {
      // Atualizar estado do store
      connectionStatus = getConnectionStatusFromStore()
      qrCodeAtual = getQRCodeFromStore()
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      tentativas++
      
      console.log(`⏳ [WhatsApp-WebJS] Aguardando QR/conexão (${tentativas}/30):`, {
        connectionStatus,
        hasQR: !!qrCodeAtual,
        qrLength: qrCodeAtual?.length || 0,
      })
      
      // Verificar se conectou durante a espera
      if (connectionStatus === 'connected' || isConnectedWebJS()) {
        setIsConnectingInStore(false)
        isConnecting = false
        console.log('✅ [WhatsApp-WebJS] Conectado durante espera!')
        return {
          success: true,
          connected: true,
          qr: null,
          message: 'Conectado com sucesso!',
        }
      }
      
      // Se QR Code foi gerado, retornar
    if (qrCodeAtual) {
        setIsConnectingInStore(false)
        isConnecting = false
        console.log('✅ [WhatsApp-WebJS] QR Code gerado!')
        return {
          success: true,
          connected: false,
          qr: qrCodeAtual,
          message: 'QR Code gerado. Escaneie com seu WhatsApp.',
        }
      }
      
      // Se não está mais conectando, sair do loop
      if (connectionStatus !== 'connecting') {
        console.log('⚠️ [WhatsApp-WebJS] Estado mudou durante espera:', connectionStatus)
        break
      }
    }

    if (qrCodeAtual) {
      isConnecting = false
      return {
        success: true,
        connected: false,
        qr: qrCodeAtual,
        message: 'QR Code gerado! Escaneie com seu WhatsApp.',
      }
    }

    // Se não gerou QR mas já está conectado, tudo bem
    if (isConnectedWebJS() || connectionStatus === 'connected') {
      isConnecting = false
      return {
        success: true,
        connected: true,
        qr: null,
        message: 'Conectado com sucesso!',
      }
    }

    isConnecting = false
    return {
      success: false,
      error: 'QR Code não foi gerado. Tente novamente.',
      qr: null,
    }
  } catch (error: any) {
    isConnecting = false
    console.error('❌ [WhatsApp-WebJS] Erro ao conectar:', error)
    return {
      success: false,
      error: error.message || 'Erro ao conectar WhatsApp',
      qr: null,
    }
  }
  */
  // Fim do código desabilitado
}

/**
 * Desconectar WhatsApp
 */
export async function disconnectWhatsAppWebJS() {
  try {
    console.log('🔄 [WhatsApp-WebJS] Iniciando desconexão...')
    
    // Buscar cliente do store
    const currentClient = getClient()
    
    if (currentClient) {
      console.log('🔌 [WhatsApp-WebJS] Destruindo cliente...')
      try {
        // Remover todos os listeners antes de destruir
        currentClient.removeAllListeners()
        
        // Destruir cliente
        await currentClient.destroy()
        console.log('✅ [WhatsApp-WebJS] Cliente destruído')
      } catch (destroyError: any) {
        console.warn('⚠️ [WhatsApp-WebJS] Erro ao destruir cliente:', destroyError.message)
        // Continuar mesmo se houver erro ao destruir
      }
    }
    
    // Limpar store
    setClientInStore(null)
    client = null
    setQRCodeInStore(null)
    setIsConnectingInStore(false)
    setConnectionStatusInStore('disconnected')
    setPhoneNumberInStore(null)
    
    qrCodeAtual = null
    isConnecting = false
    connectionStatus = 'disconnected'
    phoneNumber = null
    
    // Limpar pasta de autenticação
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const authDir = path.join(process.cwd(), 'whatsapp_auth_webjs')
      
      try {
        await fs.access(authDir)
        await fs.rm(authDir, { recursive: true, force: true })
        console.log('✅ [WhatsApp-WebJS] Pasta de autenticação removida')
      } catch (e: any) {
        console.log('ℹ️ [WhatsApp-WebJS] Pasta de autenticação não existe ou já foi removida')
      }
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp-WebJS] Erro ao limpar autenticação:', e.message)
    }
    
    console.log('✅ [WhatsApp-WebJS] Desconexão completa!')
    return { success: true, message: 'Desconectado com sucesso!' }
  } catch (error: any) {
    console.error('❌ [WhatsApp-WebJS] Erro ao desconectar:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Obter cliente atual (garantir que está acessível)
 * EXPORTADO para ser usado externamente
 */
export function getClientWebJS() {
  // Buscar do store global sempre
  client = getClient()
  
  // Se cliente existe e tem o método sendMessage, retornar
  if (client) {
    // Verificar se o cliente está realmente inicializado
    if (typeof client.sendMessage === 'function') {
      return client
    }
    
    // Se tem cliente mas não tem sendMessage, ainda pode estar inicializando
    // Verificar se tem outros sinais de que está conectado
    if (client.pupPage || client.pupBrowser) {
      console.log('⚠️ [WhatsApp-WebJS] Cliente existe mas sendMessage não disponível ainda')
      return client // Retornar mesmo assim - pode funcionar
    }
  }
  
  // Se não existe cliente mas status indica conectado, algo está errado
  if (connectionStatus === 'connected' && !client) {
    console.log('⚠️ [WhatsApp-WebJS] Status indica conectado mas cliente não existe!')
  }
  
  return client
}

/**
 * Enviar mensagem via WhatsApp
 */
export async function enviarMensagemWebJS(numero: string, mensagem: string): Promise<boolean> {
  // SEMPRE buscar do store global primeiro
  client = getClient()
  connectionStatus = getConnectionStatusFromStore()
  
  console.log('📤 [WhatsApp-WebJS] Tentando enviar mensagem:', {
    numero,
    mensagemPreview: mensagem.substring(0, 50),
    hasClient: !!client,
    connectionStatus,
  })
  
  // Obter cliente do store global
  let currentClient = getClient()
  
  // CRÍTICO: Se ainda não encontrou, o cliente pode estar em outro contexto
  // Tentar recarregar o módulo ou verificar se precisa reconectar
  if (!currentClient) {
    console.error('❌ [WhatsApp-WebJS] Cliente não existe ou não está disponível', {
      hasClient: !!client,
      connectionStatus,
      hasSendMessage: client ? typeof client.sendMessage === 'function' : false,
      clientType: client ? typeof client : 'undefined',
      clientKeys: client ? Object.keys(client).slice(0, 5) : [],
    })
    
    // Se mensagens estão chegando, o cliente DEVE existir
    // Pode ser que o cliente esteja em um worker/processo diferente
    if (connectionStatus === 'connected') {
      console.error('❌ [WhatsApp-WebJS] ERRO CRÍTICO: Status conectado mas cliente não acessível!')
      console.error('❌ [WhatsApp-WebJS] Isso pode acontecer se o cliente está em um contexto diferente do Next.js')
      console.error('❌ [WhatsApp-WebJS] Tentando criar nova conexão...')
      
      // Não criar nova conexão automaticamente - isso pode causar problemas
      // Melhor deixar o usuário reconectar manualmente
    }
    
    return false
  }
  
  // Verificar se tem o método sendMessage
  if (typeof currentClient.sendMessage !== 'function') {
    console.error('❌ [WhatsApp-WebJS] Cliente não tem método sendMessage', {
      hasPupPage: !!currentClient.pupPage,
      hasPupBrowser: !!currentClient.pupBrowser,
      clientKeys: Object.keys(currentClient).slice(0, 10),
    })
    
    // Se não tem sendMessage mas tem outras propriedades, pode estar inicializando
    if (!currentClient.pupPage && !currentClient.pupBrowser) {
      return false
    }
    
    console.log('⚠️ [WhatsApp-WebJS] Cliente pode estar inicializando...')
  }
  
  // Se mensagens estão chegando, estamos conectados - tentar enviar!
  // Não bloquear por detecção de conexão se o cliente existe e tem sendMessage
  const connected = isConnectedWebJS() || 
                    connectionStatus === 'connected' || 
                    currentClient.pupPage !== undefined ||
                    currentClient.pupBrowser !== undefined
  
  if (!connected) {
    console.log('⚠️ [WhatsApp-WebJS] Status não detectado como conectado, mas tentando enviar...', {
      hasClient: !!currentClient,
      connectionStatus,
      hasPupPage: !!currentClient.pupPage,
      hasPupBrowser: !!currentClient.pupBrowser,
      hasInfo: !!currentClient.info,
      hasSendMessage: typeof currentClient.sendMessage === 'function',
    })
    // Marcar como conectado se temos pupPage (prova que está rodando)
    if (currentClient.pupPage || currentClient.pupBrowser) {
      connectionStatus = 'connected'
      console.log('✅ [WhatsApp-WebJS] Marca como conectado (pupPage detectado)')
    }
  }

  try {
    // Formatar número (remover caracteres não numéricos)
    const numeroLimpo = numero.replace(/\D/g, '')
    
    // Adicionar sufixo se não tiver
    const numeroFormatado = numeroLimpo.includes('@')
      ? numeroLimpo
      : `${numeroLimpo}@c.us`

    console.log('📤 [WhatsApp-WebJS] Enviando mensagem para:', numeroFormatado)
    
    // CRÍTICO: Verificar se o cliente está realmente pronto antes de enviar
    // Aguardar um pouco se necessário para garantir que está pronto
    let tentativasEnvio = 0
    let enviado = false
    
    while (tentativasEnvio < 3 && !enviado) {
      try {
        // Verificar se o cliente tem o método sendMessage
        if (typeof currentClient.sendMessage !== 'function') {
          console.error('❌ [WhatsApp-WebJS] Cliente não tem método sendMessage')
          await new Promise(resolve => setTimeout(resolve, 1000))
          // Tentar obter cliente novamente
          currentClient = getClient()
          tentativasEnvio++
          continue
        }
        
        // Verificar se o cliente está realmente pronto
        if (!currentClient.pupPage && !currentClient.pupBrowser) {
          console.warn('⚠️ [WhatsApp-WebJS] Cliente pode não estar pronto, aguardando...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          currentClient = getClient()
          tentativasEnvio++
          continue
        }
        
        // Tentar enviar mensagem
        console.log(`🔄 [WhatsApp-WebJS] Tentativa ${tentativasEnvio + 1}/3 de enviar mensagem...`)
        console.log('🔍 [WhatsApp-WebJS] Estado do cliente antes de enviar:', {
          hasSendMessage: typeof currentClient.sendMessage === 'function',
          hasPupPage: !!currentClient.pupPage,
          hasPupBrowser: !!currentClient.pupBrowser,
          hasInfo: !!currentClient.info,
          numeroFormatado,
          mensagemLength: mensagem.length,
        })
        
        // CRÍTICO: Verificar se o cliente está realmente pronto
        // O erro getChat acontece quando o contexto do Puppeteer não está pronto
        // Aguardar um pouco mais se necessário
        if (!currentClient.pupPage && !currentClient.pupBrowser) {
          console.warn('⚠️ [WhatsApp-WebJS] Cliente pode não estar totalmente pronto, aguardando 3 segundos...')
          await new Promise(resolve => setTimeout(resolve, 3000))
          // Tentar obter cliente novamente após espera
          currentClient = getClient()
          if (!currentClient || typeof currentClient.sendMessage !== 'function') {
            console.error('❌ [WhatsApp-WebJS] Cliente não está disponível após espera')
            tentativasEnvio++
            continue
          }
        }
        
        // Verificar se o número está no formato correto
        // whatsapp-web.js espera formato: número@c.us ou número@s.whatsapp.net
        let numeroFinal = numeroFormatado
        if (!numeroFinal.includes('@')) {
          numeroFinal = `${numeroLimpo}@c.us`
        }
        
        console.log('📤 [WhatsApp-WebJS] Tentando enviar para:', numeroFinal)
        
        // CRÍTICO: Verificar se o WhatsApp Web está completamente carregado
        // O erro getChat acontece quando o objeto window.Store não está pronto
        try {
          if (currentClient.pupPage) {
            console.log('🔍 [WhatsApp-WebJS] Verificando se WhatsApp Web está pronto...')
            const isReady = await currentClient.pupPage.evaluate(() => {
              // Verificar se o objeto Store existe e tem getChat
              return typeof window !== 'undefined' &&
                     typeof (window as any).Store !== 'undefined' &&
                     typeof (window as any).Store?.Chat !== 'undefined'
            }).catch(() => false)
            
            if (!isReady) {
              console.warn('⚠️ [WhatsApp-WebJS] WhatsApp Web não está pronto! Aguardando 5 segundos...')
              await new Promise(resolve => setTimeout(resolve, 5000))
              
              // Tentar novamente
              const isReadyAfterWait = await currentClient.pupPage.evaluate(() => {
                return typeof window !== 'undefined' &&
                       typeof (window as any).Store !== 'undefined' &&
                       typeof (window as any).Store?.Chat !== 'undefined'
              }).catch(() => false)
              
              if (!isReadyAfterWait) {
                console.error('❌ [WhatsApp-WebJS] WhatsApp Web ainda não está pronto após espera')
                tentativasEnvio++
                continue
              }
            }
            console.log('✅ [WhatsApp-WebJS] WhatsApp Web está pronto!')
          }
        } catch (checkError: any) {
          console.warn('⚠️ [WhatsApp-WebJS] Não foi possível verificar se WhatsApp Web está pronto:', checkError.message)
          // Continuar mesmo assim - pode funcionar
        }
        
        const resultado = await Promise.race([
          currentClient.sendMessage(numeroFinal, mensagem),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout ao enviar mensagem')), 20000)
          )
        ])
    
    console.log('✅ [WhatsApp-WebJS] Mensagem enviada com sucesso!')
        enviado = true
        
        // Se conseguiu enviar, marcar como conectado
        if (connectionStatus !== 'connected') {
          setConnectionStatusInStore('connected')
          connectionStatus = 'connected'
          console.log('✅ [WhatsApp-WebJS] Marcado como conectado após envio bem-sucedido')
        }
        
        return true
      } catch (envioError: any) {
        tentativasEnvio++
        console.error(`❌ [WhatsApp-WebJS] Erro na tentativa ${tentativasEnvio}:`, {
          message: envioError.message,
          tipo: envioError.message.includes('getChat') ? 'getChat error' : 'outro erro',
        })
        
        // Se é erro de getChat, pode ser que o cliente precisa ser reinicializado
        if (envioError.message.includes('getChat')) {
          console.warn('⚠️ [WhatsApp-WebJS] Erro getChat detectado. Cliente pode precisar ser reconectado.')
          
          // Aguardar um pouco e tentar obter cliente novamente
          await new Promise(resolve => setTimeout(resolve, 2000))
          currentClient = getClient()
          
          if (!currentClient || typeof currentClient.sendMessage !== 'function') {
            console.error('❌ [WhatsApp-WebJS] Cliente não está disponível após erro getChat')
            return false
          }
        }
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (tentativasEnvio < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    if (!enviado) {
      console.error('❌ [WhatsApp-WebJS] Falhou ao enviar após 3 tentativas')
      return false
    }
    
    return true
  } catch (error: any) {
    console.error('❌ [WhatsApp-WebJS] Erro geral ao enviar mensagem:', error)
    console.error('❌ [WhatsApp-WebJS] Detalhes do erro:', {
      message: error.message,
      stack: error.stack?.substring(0, 200),
    })
    return false
  }
}

/**
 * Obter informações do cliente
 */
export function getClientInfoWebJS() {
  // Se temos número salvo, usar ele
  if (phoneNumber && connectionStatus === 'connected') {
    return {
      wid: phoneNumber,
      pushname: client?.info?.pushname || null,
      platform: client?.info?.platform || null,
    }
  }
  
  if (!client) {
    return null
  }

  const connected = isConnectedWebJS()
  if (!connected) {
    return null
  }

  const wid = client.info?.wid
  let extractedWid = null
  
  if (wid) {
    if (typeof wid === 'string') {
      extractedWid = wid.split('@')[0]
    } else if (wid.user) {
      extractedWid = wid.user
    }
  }

  const info = {
    wid: extractedWid || phoneNumber || null,
    pushname: client.info?.pushname || null,
    platform: client.info?.platform || null,
  }

  return info
}

/**
 * Função para adicionar listeners a um cliente já existente
 * CRÍTICO: Usar quando o cliente já está conectado mas os listeners podem não estar funcionando
 */
export async function ensureMessageListeners() {
  // DESABILITADA - estava causando abertura de Chromium
  console.log('⚠️ [WhatsApp-WebJS] ensureMessageListeners está DESABILITADA')
  return false
  
  // CÓDIGO ORIGINAL DESABILITADO - REMOVIDO PARA EVITAR ERROS
  /*
  const { getClient } = await import('@/lib/whatsapp-client-store')
  const client = getClient()
  if (!client) {
    console.warn('⚠️ [WhatsApp-WebJS] Nenhum cliente encontrado para adicionar listeners')
    return false
  }
  
  console.log('🔧 [WhatsApp-WebJS] Garantindo que listeners estão configurados...')
  
  // Verificar se já tem listeners
  const events = (client as any)._events || {}
  const messageListeners = events.message || []
  const messageCreateListeners = events.message_create || []
  const hasMessageListener = !!(messageListeners || messageCreateListeners)
  
  console.log('🔍 [WhatsApp-WebJS] Estado atual dos listeners:', {
    hasMessageListener,
    messageListenersCount: Array.isArray(messageListeners) ? messageListeners.length : (messageListeners ? 1 : 0),
    messageCreateListenersCount: Array.isArray(messageCreateListeners) ? messageCreateListeners.length : (messageCreateListeners ? 1 : 0),
    allEvents: Object.keys(events),
  })
  
  // SEMPRE reconfigurar listeners para garantir que estão funcionando
  // Mesmo que existam, pode ser que não estejam funcionando corretamente
  console.warn('⚠️ [WhatsApp-WebJS] Reconfigurando listeners para garantir funcionamento...')
  
  // CRÍTICO: Verificar se o cliente está realmente ativo antes de configurar listeners
  if (!client.pupPage && !client.pupBrowser) {
    console.warn('⚠️ [WhatsApp-WebJS] Cliente não tem pupPage/pupBrowser. Pode não estar totalmente inicializado.')
  }
  
  // CRÍTICO: Verificar se o cliente está realmente conectado
  if (!client.info) {
    console.warn('⚠️ [WhatsApp-WebJS] Cliente não tem info. Pode não estar conectado.')
    return false
  }
  
  // CRÍTICO: Verificar se WhatsApp Web está realmente carregado ANTES de configurar listeners
  let whatsappWebReady = false
  if (client.pupPage) {
    try {
      whatsappWebReady = await client.pupPage.evaluate(() => {
        try {
          const win = window as any
          return typeof window !== 'undefined' && 
                 typeof win.Store !== 'undefined' && 
                 typeof win.Store.Chat !== 'undefined' &&
                 typeof win.Store.Msg !== 'undefined'
        } catch (e) {
          return false
        }
      }).catch(() => false)
      
      console.log('🔍 [WhatsApp-WebJS] WhatsApp Web está pronto?', whatsappWebReady)
      
      if (!whatsappWebReady) {
        console.warn('⚠️ [WhatsApp-WebJS] WhatsApp Web NÃO está pronto! Aguardando 5 segundos...')
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        // Verificar novamente
        whatsappWebReady = await client.pupPage.evaluate(() => {
          try {
            const win = window as any
            return typeof window !== 'undefined' && 
                   typeof win.Store !== 'undefined' && 
                   typeof win.Store.Chat !== 'undefined'
          } catch (e) {
            return false
          }
        }).catch(() => false)
        
        if (!whatsappWebReady) {
          console.error('❌ [WhatsApp-WebJS] WhatsApp Web AINDA não está pronto após espera!')
          console.error('❌ [WhatsApp-WebJS] Isso pode impedir que mensagens sejam recebidas!')
          console.error('❌ [WhatsApp-WebJS] Recomendação: Reconectar completamente.')
        } else {
          console.log('✅ [WhatsApp-WebJS] WhatsApp Web agora está pronto!')
        }
      }
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp-WebJS] Erro ao verificar WhatsApp Web:', e.message)
    }
  } else {
    console.warn('⚠️ [WhatsApp-WebJS] Cliente não tem pupPage. Pode não estar totalmente inicializado.')
  }
  
  // Remover TODOS os listeners antigos (CRÍTICO: fazer isso primeiro)
  console.log('🧹 [WhatsApp-WebJS] Removendo listeners antigos...')
  client.removeAllListeners('message')
  client.removeAllListeners('message_create')
  client.removeAllListeners('message_ack')
  
  // Aguardar um pouco para garantir que listeners foram removidos
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Criar função de processamento inline
  let processandoMensagens = new Set<string>()
  
  const processarMensagem = async (msg: any) => {
    try {
      const msgId = msg.id?._serialized || msg.id || `${msg.from}-${Date.now()}`
      
      if (processandoMensagens.has(msgId)) {
        return
      }
      
      processandoMensagens.add(msgId)
      setTimeout(() => {
        processandoMensagens.delete(msgId)
      }, 60000)
      
      console.log('📨 [WhatsApp-WebJS] ==========================================')
      console.log('📨 [WhatsApp-WebJS] EVENTO MESSAGE DISPARADO!')
      console.log('📨 [WhatsApp-WebJS] ID:', msgId)
      console.log('📨 [WhatsApp-WebJS] De:', msg.from)
      console.log('📨 [WhatsApp-WebJS] ==========================================')
      
      // Ignorar mensagens próprias, status e grupos
      if (msg.from === 'status@broadcast' || msg.fromMe === true || (msg.from && msg.from.includes('@g.us'))) {
        return
      }
      
      // Extrair texto
      const texto = msg.body || msg.text || msg.message?.conversation || ''
      if (!texto || texto.trim() === '') {
        return
      }
      
      const numero = msg.from ? msg.from.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '') : 'unknown'
      
      console.log('📨 [WhatsApp-WebJS] Mensagem recebida:', {
        de: numero,
        texto: texto.substring(0, 50),
      })
      
      // Chamar webhook
      const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const messageData = {
        key: {
          remoteJid: msg.from,
          id: msg.id?._serialized || msg.id,
        },
        message: {
          conversation: texto,
          extendedTextMessage: { text: texto },
        },
        messageTimestamp: msg.timestamp,
        pushName: msg.notifyName || msg.pushName,
      }
      
      try {
        const response = await fetch(`${webhookUrl}/api/whatsapp/webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        })
        
        if (response.ok) {
          console.log('✅ [WhatsApp-WebJS] Mensagem processada pelo webhook')
        } else {
          console.error('❌ [WhatsApp-WebJS] Erro ao processar webhook:', response.status)
        }
      } catch (error: any) {
        console.error('❌ [WhatsApp-WebJS] Erro ao chamar webhook:', error.message)
      }
    } catch (error: any) {
      console.error('❌ [WhatsApp-WebJS] Erro ao processar mensagem:', error.message)
    }
  }
  
  // Adicionar listeners com logging detalhado
  const messageHandler = async (msg: any) => {
    console.log('🔔 [WhatsApp-WebJS] ==========================================')
    console.log('🔔 [WhatsApp-WebJS] EVENTO message DISPARADO!')
    console.log('🔔 [WhatsApp-WebJS] Handler ativo e funcionando!')
    console.log('🔔 [WhatsApp-WebJS] ==========================================')
    await processarMensagem(msg)
  }
  
  const messageCreateHandler = async (msg: any) => {
    console.log('🔔 [WhatsApp-WebJS] EVENTO message_create DISPARADO!')
    await processarMensagem(msg)
  }
  
  client.on('message', messageHandler)
  client.on('message_create', messageCreateHandler)
  
  // Adicionar listener de teste para verificar se eventos estão funcionando
  client.on('message_ack', (msg: any, ack: any) => {
    console.log('📬 [WhatsApp-WebJS] Message ACK recebido (teste de eventos):', ack)
  })
  
  console.log('✅ [WhatsApp-WebJS] Listeners adicionados com sucesso!')
  
  // Verificar novamente
  const newEvents = (client as any)._events || {}
  const finalMessageListeners = newEvents.message || []
  const finalMessageCreateListeners = newEvents.message_create || []
  
  console.log('🔍 [WhatsApp-WebJS] Eventos após adicionar listeners:', Object.keys(newEvents))
  console.log('🔍 [WhatsApp-WebJS] Message listeners finais:', Array.isArray(finalMessageListeners) ? finalMessageListeners.length : (finalMessageListeners ? 1 : 0))
  console.log('🔍 [WhatsApp-WebJS] Message_create listeners finais:', Array.isArray(finalMessageCreateListeners) ? finalMessageCreateListeners.length : (finalMessageCreateListeners ? 1 : 0))
  
  // Testar se o cliente está realmente ativo
  if (client.pupPage) {
    try {
      const isActive = await client.pupPage.evaluate(() => {
        return typeof window !== 'undefined' && typeof (window as any).Store !== 'undefined'
      }).catch(() => false)
      
      if (isActive) {
        console.log('✅ [WhatsApp-WebJS] WhatsApp Web está ativo e pronto para receber mensagens!')
      } else {
        console.warn('⚠️ [WhatsApp-WebJS] WhatsApp Web pode não estar totalmente carregado!')
      }
    } catch (e) {
      console.warn('⚠️ [WhatsApp-WebJS] Não foi possível verificar se WhatsApp Web está ativo')
    }
  }
  
  return true
  */
}

