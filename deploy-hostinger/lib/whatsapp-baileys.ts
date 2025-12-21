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

// Função para limpar QR Code (útil quando desconecta)
export function limparQRCode() {
  qrCodeAtual = null
  console.log('🧹 [WhatsApp] QR Code limpo')
}

export function getQRCodeAtual() {
  return qrCodeAtual
}

export async function connectWhatsApp(forceNewQR = false) {
  // Se forçar novo QR, SEMPRE limpar tudo primeiro
  if (forceNewQR) {
    console.log('🔄 [WhatsApp] ForceNewQR ativado - limpando TUDO primeiro...')
    
    // Limpar socket se existir
    if (sock) {
      try {
        if (sock.user) {
          await sock.logout()
        }
        sock.end(undefined)
      } catch (e) {
        console.log('⚠️ [WhatsApp] Erro ao limpar socket:', e)
      }
      sock = null
    }
    
    isConnecting = false
    qrCodeAtual = null
    
    // Limpar credenciais FORÇADAMENTE e AGUARDAR
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const authDir = path.join(process.cwd(), 'whatsapp_auth')
      
      try {
        // Verificar se existe
        try {
          await fs.access(authDir)
          console.log('🧹 [WhatsApp] Removendo TODAS as credenciais antigas...')
        } catch {
          console.log('ℹ️ [WhatsApp] Diretório de auth não existe (ok, será criado novo)')
        }
        
        // Deletar com força
        await fs.rm(authDir, { recursive: true, force: true })
        console.log('✅ [WhatsApp] Diretório removido!')
        
        // CRÍTICO: Aguardar mais tempo para garantir que foi deletado completamente
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Verificar se realmente foi deletado
        try {
          await fs.access(authDir)
          console.error('❌ [WhatsApp] ERRO: Diretório ainda existe após tentar deletar!')
          throw new Error('Não foi possível remover o diretório whatsapp_auth. Delete manualmente.')
        } catch (verifyError: any) {
          if (verifyError.code === 'ENOENT') {
            console.log('✅ [WhatsApp] Confirmado: Diretório foi completamente removido!')
          } else {
            throw verifyError
          }
        }
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          console.log('ℹ️ [WhatsApp] Diretório não existe (ok)')
        } else if (e.message?.includes('Não foi possível remover')) {
          throw e
        } else {
          console.log('⚠️ [WhatsApp] Erro ao limpar credenciais:', e)
        }
      }
    } catch (e: any) {
      console.error('❌ [WhatsApp] Erro crítico ao limpar credenciais:', e)
      if (e.message?.includes('Não foi possível remover')) {
        throw e
      }
    }
  }

  // Se já está conectando e não forçar novo QR, aguardar resultado
  if (isConnecting && sock && !forceNewQR) {
    console.log('⚠️ [WhatsApp] Já está conectando... aguardando QR Code ou conexão')
    console.log('⚠️ [WhatsApp] Se forceNew=true, isso será ignorado')
  }

  // Se forceNewQR, sempre reiniciar mesmo que já esteja conectando
  if (forceNewQR) {
    console.log('🔄 [WhatsApp] forceNewQR=true - forçando nova conexão mesmo se já estiver conectando')
    // Limpar estado anterior FORÇADAMENTE
    isConnecting = false
    qrCodeAtual = null
    
    if (sock) {
      try {
        console.log('🔄 [WhatsApp] Fechando socket anterior...')
        if (sock.user) {
          try {
            await sock.logout()
          } catch (e) {
            // Ignorar erro de logout
          }
        }
        sock.end(undefined)
        // Remover todos os listeners - usar verificação de tipo segura
        if (sock.ev && typeof sock.ev.removeAllListeners === 'function') {
          (sock.ev.removeAllListeners as any)()
        }
      } catch (e) {
        console.log('⚠️ [WhatsApp] Erro ao limpar socket anterior:', e)
      }
      sock = null
    }
    
    // Aguardar um pouco para garantir limpeza
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('✅ [WhatsApp] Estado anterior limpo, pronto para nova conexão')
  }

  // Se já está conectado e não forçar novo QR, retornar sucesso
  if (sock && sock.user && !forceNewQR) {
    console.log('✅ [WhatsApp] Já está conectado!')
    return { success: true, connected: true, qrCode: null, socket: sock }
  }


  isConnecting = true

  try {
    console.log('🔄 [WhatsApp] Iniciando conexão...')
    
    // CRÍTICO: Se forceNewQR, garantir que diretório não existe ANTES de chamar useMultiFileAuthState
    if (forceNewQR) {
      const fs = await import('fs/promises')
      const path = await import('path')
      const authDir = path.join(process.cwd(), 'whatsapp_auth')
      
      // Verificar uma última vez se foi deletado
      try {
        await fs.access(authDir)
        console.error('❌ [WhatsApp] ERRO CRÍTICO: Diretório ainda existe!')
        console.error('❌ [WhatsApp] Tentando deletar novamente...')
        await fs.rm(authDir, { recursive: true, force: true })
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (e: any) {
        if (e.code !== 'ENOENT') {
          console.error('❌ [WhatsApp] Erro ao verificar/deletar diretório:', e)
        } else {
          console.log('✅ [WhatsApp] Confirmado: Diretório não existe, pronto para criar novo')
        }
      }
    }
    
    // AGORA carregar auth state (se forceNewQR, deve estar vazio)
    const { state, saveCreds } = await useMultiFileAuthState('whatsapp_auth')
    console.log('✅ [WhatsApp] Auth state carregado')
    console.log('🔍 [WhatsApp] Credenciais existentes:', !!state.creds.me)
    console.log('🔍 [WhatsApp] ID do usuário nas credenciais:', state.creds.me?.id || 'Nenhum')
    console.log('🔍 [WhatsApp] Estado completo das credenciais:', {
      hasMe: !!state.creds.me,
      meId: state.creds.me?.id || null,
      meName: state.creds.me?.name || null,
      registered: state.creds.registered || false
    })
    
    // Se forceNewQR e ainda tem credenciais, é um erro crítico
    if (forceNewQR && state.creds.me) {
      // Tentar deletar novamente de forma mais agressiva
      console.error('❌ [WhatsApp] ERRO: Credenciais ainda existem após limpeza!')
      console.error('❌ [WhatsApp] Tentando deletar novamente de forma mais agressiva...')
      
      try {
        const fs = await import('fs/promises')
        const path = await import('path')
        const authDir = path.join(process.cwd(), 'whatsapp_auth')
        
        // Deletar tudo com força máxima
        await fs.rm(authDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 })
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Recarregar auth state
        const { state: newState } = await useMultiFileAuthState('whatsapp_auth')
        
        if (newState.creds.me) {
          const error = new Error('ERRO CRÍTICO: Credenciais ainda existem mesmo após múltiplas tentativas de limpeza! Por favor, pare o servidor, delete manualmente a pasta whatsapp_auth completamente e reinicie.')
          console.error('❌ [WhatsApp]', error.message)
          throw error
        } else {
          console.log('✅ [WhatsApp] Credenciais removidas com sucesso na segunda tentativa!')
          state.creds = newState.creds
          state.keys = newState.keys
        }
      } catch (cleanError: any) {
        const error = new Error(`ERRO CRÍTICO: Não foi possível remover credenciais. ${cleanError.message}. Por favor, delete manualmente a pasta whatsapp_auth e tente novamente.`)
        console.error('❌ [WhatsApp]', error.message)
        throw error
      }
    }
    
    // Se tem credenciais mas não está conectado, pode precisar de novo QR Code
    if (state.creds.me && !sock?.user && !forceNewQR) {
      console.log('⚠️ [WhatsApp] Credenciais encontradas mas não conectado.')
      console.log('⚠️ [WhatsApp] Isso pode significar que as credenciais estão inválidas ou expiradas.')
      console.log('💡 [WhatsApp] Use forceNewQR=true para gerar novo QR Code')
    }
    
    // Baileys 6.x: fetchLatestBaileysVersion retorna { version, isLatest }
    // Pode dar erro se não conseguir buscar, então usamos fallback
    let version: any
    try {
      const versionData = await fetchLatestBaileysVersion()
      version = versionData.version || versionData
      console.log('✅ [WhatsApp] Versão Baileys obtida:', version)
    } catch (versionError: any) {
      console.warn('⚠️ [WhatsApp] Erro ao buscar versão do Baileys:', versionError.message)
      console.warn('⚠️ [WhatsApp] Usando versão padrão...')
      // Fallback: Baileys pode usar versão padrão se não conseguir buscar
      version = undefined // Baileys usará a versão padrão
    }

    // CRÍTICO: Se forceNewQR, DEVE gerar QR Code (não deve ter credenciais)
    // Se tem credenciais, o Baileys pode tentar reconectar automaticamente
    let shouldGenerateQR = forceNewQR || !state.creds.me
    
    // FORÇAR shouldGenerateQR se forceNewQR está true
    if (forceNewQR) {
      shouldGenerateQR = true
      console.log('🔧 [WhatsApp] forceNewQR=true - FORÇANDO shouldGenerateQR=true')
    }
    
    console.log('🔍 [WhatsApp] ==========================================')
    console.log('🔍 [WhatsApp] Configuração ANTES de criar socket:')
    console.log('🔍 [WhatsApp] - hasCreds:', !!state.creds.me)
    console.log('🔍 [WhatsApp] - credsMeId:', state.creds.me?.id || 'Nenhum')
    console.log('🔍 [WhatsApp] - forceNewQR:', forceNewQR)
    console.log('🔍 [WhatsApp] - shouldGenerateQR:', shouldGenerateQR)
    console.log('🔍 [WhatsApp] - IMPORTANTE:', shouldGenerateQR ? '✅ DEVE gerar QR Code' : '⚠️ Pode tentar reconectar (não gerará QR)')
    console.log('🔍 [WhatsApp] ==========================================')
    
    // Se deveria gerar QR mas tem credenciais, erro CRÍTICO
    if (shouldGenerateQR && state.creds.me) {
      const error = new Error('ERRO CRÍTICO: shouldGenerateQR=true mas credenciais ainda existem! O QR Code NÃO será gerado. Delete manualmente a pasta whatsapp_auth e tente novamente.')
      console.error('❌ [WhatsApp] ==========================================')
      console.error('❌ [WhatsApp]', error.message)
      console.error('❌ [WhatsApp] Credenciais encontradas:', state.creds.me)
      console.error('❌ [WhatsApp] ==========================================')
      throw error
    }
    
    // Se NÃO deveria gerar QR mas não tem credenciais, algo está errado
    if (!shouldGenerateQR && !state.creds.me) {
      console.warn('⚠️ [WhatsApp] AVISO: shouldGenerateQR=false mas não tem credenciais. Forçando shouldGenerateQR=true')
      // Forçar geração de QR Code
    }

    // Configurar socket com logs detalhados
    console.log('🔄 [WhatsApp] Criando socket do Baileys...')
    console.log('🔍 [WhatsApp] Config do socket:', {
      version,
      hasCreds: !!state.creds.me,
      printQRInTerminal: true,
      shouldGenerateQR,
      loggerLevel: shouldGenerateQR ? 'info' : 'silent'
    })
    
    // Declarar socketConfig fora do try para uso no catch
    let socketConfig: any = null
    
    try {
      // Criar logger
      const logger = pino({ 
        level: shouldGenerateQR ? 'info' : 'silent' // INFO para ver mais logs quando gerando QR
      })
      
      // CRÍTICO: Configurações otimizadas para gerar QR Code
      socketConfig = {
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        // CRÍTICO: printQRInTerminal SEMPRE true se shouldGenerateQR
        printQRInTerminal: shouldGenerateQR,
        generateHighQualityLinkPreview: true,
        logger,
        // Configurações adicionais para garantir QR Code
        connectTimeoutMs: 120000, // 2 minutos
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        // Não sincronizar histórico para conexão mais rápida
        shouldSyncHistoryMessage: () => false,
        // Não baixar mídia automaticamente
        shouldIgnoreJid: () => false,
        // NÃO reconectar automaticamente - evitar loops
        shouldReconnect: () => false,
        // Identificação do navegador
        browser: ['PleniPay', 'Desktop', '1.0.0'],
        // Configurações importantes para QR Code
        syncFullHistory: false,
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 1,
        // IMPORTANTE: Forçar geração de QR Code se necessário
        ...(shouldGenerateQR && !state.creds.me ? {
          // Se não tem credenciais, garantir que o Baileys gere QR
          // Não passar nenhuma configuração que impeça a geração
        } : {})
      }
      
      console.log('🔍 [WhatsApp] Configuração do socket:', {
        version: socketConfig.version ? 'definida' : 'undefined (padrão)',
        hasCreds: !!socketConfig.auth.creds.me,
        printQRInTerminal: socketConfig.printQRInTerminal,
        shouldGenerateQR,
        loggerLevel: socketConfig.logger?.level
      })
      
      sock = makeWASocket(socketConfig)
      
      console.log('✅ [WhatsApp] Socket criado com sucesso!')
      // Removido: readyState não existe no tipo WebSocketClient
      console.log('🔍 [WhatsApp] Socket configurado:', {
        hasSocket: !!sock,
        hasWebSocket: !!sock?.ws,
        printQR: socketConfig.printQRInTerminal,
        shouldGenerateQR,
      })
      
      // Verificar se o socket foi criado corretamente
      if (!sock) {
        throw new Error('Socket não foi criado - makeWASocket retornou null/undefined')
      }
      
      // Verificar se o WebSocket está disponível
      if (!sock.ws) {
        console.warn('⚠️ [WhatsApp] WebSocket não está disponível imediatamente após criar socket')
        console.warn('⚠️ [WhatsApp] Isso é normal - o WebSocket será criado quando conectar')
      }
    } catch (socketError: any) {
      console.error('❌ [WhatsApp] ==========================================')
      console.error('❌ [WhatsApp] ERRO CRÍTICO ao criar socket:')
      console.error('❌ [WhatsApp] - Message:', socketError.message)
      console.error('❌ [WhatsApp] - Stack:', socketError?.stack)
      console.error('❌ [WhatsApp] - Full Error:', JSON.stringify(socketError, Object.getOwnPropertyNames(socketError), 2))
      console.error('❌ [WhatsApp] - Config usada:', {
        hasVersion: !!socketConfig?.version,
        hasCreds: !!socketConfig?.auth?.creds,
        hasKeys: !!socketConfig?.auth?.keys,
        printQR: socketConfig?.printQRInTerminal,
      })
      console.error('❌ [WhatsApp] ==========================================')
      
      // Limpar estado em caso de erro
      isConnecting = false
      sock = null
      
      throw new Error(`Erro ao criar socket Baileys: ${socketError.message}. Verifique os logs do servidor para mais detalhes.`)
    }
    
    console.log('✅ [WhatsApp] Socket criado com sucesso!')
    console.log('🔍 [WhatsApp] Socket criado:', {
      hasSocket: !!sock,
      hasCreds: !!state.creds.me,
      printQR: true,
      esperandoQR: shouldGenerateQR
    })
    
    // CRÍTICO: Adicionar listeners diretos no WebSocket para capturar fechamentos prematuros
    // No Baileys 6.x, o WebSocket pode estar em sock.ws ou em outro lugar
    const ws = (sock as any)?.ws || (sock as any)?.socket || null
    
    if (ws) {
      console.log('🔍 [WhatsApp] Configurando listeners diretos do WebSocket...')
      console.log('🔍 [WhatsApp] WebSocket encontrado! Tipo:', typeof ws)
      
      try {
        ws.on('open', () => {
          console.log('✅ [WhatsApp WebSocket] WebSocket ABERTO!')
        })
        
        ws.on('error', (wsError: any) => {
          console.error('❌ [WhatsApp WebSocket] ==========================================')
          console.error('❌ [WhatsApp WebSocket] ERRO no WebSocket:')
          console.error('   - Erro:', wsError)
          console.error('   - Message:', wsError?.message)
          console.error('   - Code:', wsError?.code)
          // Removido: readyState não existe no tipo WebSocketClient
          console.error('❌ [WhatsApp WebSocket] ==========================================')
        })
        
        ws.on('close', (code: number, reason: Buffer) => {
          console.error('❌ [WhatsApp WebSocket] ==========================================')
          console.error('❌ [WhatsApp WebSocket] WebSocket FECHADO!')
          console.error('   - Code:', code)
          console.error('   - Reason:', reason?.toString() || 'N/A')
          console.error('   - shouldGenerateQR:', shouldGenerateQR)
          console.error('   - hasQR:', !!qrCodeAtual)
          console.error('❌ [WhatsApp WebSocket] Isso pode explicar por que o QR não foi gerado!')
          console.error('❌ [WhatsApp WebSocket] ==========================================')
          
          // Se estava esperando QR e o socket fechou, é um problema crítico
          if (shouldGenerateQR && !qrCodeAtual) {
            console.error('🚨 [WhatsApp WebSocket] PROBLEMA CRÍTICO: Socket fechou ANTES do QR ser gerado!')
            console.error('🚨 [WhatsApp WebSocket] Possíveis causas:')
            console.error('   1. Servidores WhatsApp rejeitaram a conexão')
            console.error('   2. Problema de rede/firewall')
            console.error('   3. Problema com versão do Baileys')
            console.error('💡 [WhatsApp WebSocket] Verifique conexão com internet e tente novamente')
          }
        })
        
        console.log('✅ [WhatsApp] Listeners do WebSocket configurados!')
        // Removido: readyState não existe no tipo WebSocketClient
        console.log('   (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)')
      } catch (wsError: any) {
        console.warn('⚠️ [WhatsApp] Erro ao configurar listeners do WebSocket:', wsError.message)
        console.warn('⚠️ [WhatsApp] Continuando sem listeners diretos do WebSocket...')
      }
    } else {
      console.warn('⚠️ [WhatsApp] WebSocket não encontrado diretamente no socket')
      console.warn('⚠️ [WhatsApp] Propriedades do socket:', Object.keys(sock || {}).slice(0, 10).join(', '))
      console.warn('⚠️ [WhatsApp] Isso é normal no Baileys 6.x - eventos serão capturados via sock.ev')
    }

    sock.ev.on('creds.update', saveCreds)
    
    // Listener para erros críticos - usando verificação de tipo segura
    // Nota: 'error' pode não estar no BaileysEventMap, então usamos any
    ;(sock.ev as any).on('error', (error: any) => {
      console.error('❌ [WhatsApp] ==========================================')
      console.error('❌ [WhatsApp] ERRO CRÍTICO recebido do Baileys:')
      console.error('❌ [WhatsApp] - Erro:', error)
      console.error('❌ [WhatsApp] - Tipo:', typeof error)
      console.error('❌ [WhatsApp] - Message:', error?.message || 'N/A')
      console.error('❌ [WhatsApp] - Code:', error?.code || 'N/A')
      console.error('❌ [WhatsApp] - Stack:', error?.stack || 'N/A')
      // Removido: readyState não existe no tipo WebSocketClient
      console.error('❌ [WhatsApp] - Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      console.error('❌ [WhatsApp] ==========================================')
      
      // Salvar erro no banco
      ;(async () => {
        try {
          const { createClient } = await import('@/lib/supabase/server')
          const supabase = await createClient()
          
          await supabase
            .from('whatsapp_instances')
            .update({
              status: 'error',
              updated_at: new Date().toISOString(),
            })
            .eq('instance_name', 'plenipay')
        } catch (e) {
          // Ignorar erro ao salvar
        }
      })()
    })
    
    // Listener para quando o socket está conectando
    sock.ev.on('connection.update', (update: any) => {
      // Log inicial quando socket está se conectando (antes do QR)
      if (update.connection === 'connecting' && !update.qr && !update.qrCode) {
        console.log('⏳ [WhatsApp] Socket está CONECTANDO ao servidor WhatsApp...')
        // Removido: readyState não existe no tipo WebSocketClient
      }
    })

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, isOnline } = update

      // O Baileys pode enviar qr em diferentes formatos
      // Tentar múltiplas propriedades possíveis
      const qrCodeFinal = qr || (update as any).qr || (update as any).qrCode || 
                         (update as any).qrcode || (update as any).QR || (update as any).QRCode ||
                         // Tentar encontrar em qualquer propriedade string
                         Object.values(update).find((v: any) => 
                           typeof v === 'string' && 
                           v.length > 50 && 
                           v.length < 500 && 
                           (v.includes('@') || v.includes('web.whatsapp.com') || v.includes('http') || v.match(/^[A-Z0-9@\-_\.:\/]+$/))
                         )

      // Log MUITO detalhado para debug (apenas se não tiver QR ou for importante)
      if (qrCodeFinal || connection === 'connecting' || connection === 'close') {
        console.log('🔍 [WhatsApp] ==========================================')
        console.log('🔍 [WhatsApp] Connection update recebido:')
        console.log('🔍 [WhatsApp] - connection:', connection)
        console.log('🔍 [WhatsApp] - hasQR (qr):', !!qr, typeof qr, qr ? `(${qr.length} chars)` : '')
        // Removido: qrCode não existe no tipo ConnectionState
        console.log('🔍 [WhatsApp] - qrCodeFinal:', !!qrCodeFinal, typeof qrCodeFinal, qrCodeFinal ? `(${qrCodeFinal.length} chars)` : '')
        if (qrCodeFinal) {
          console.log('🔍 [WhatsApp] - qrPreview:', qrCodeFinal.substring(0, 100) + '...')
        }
        console.log('🔍 [WhatsApp] - isNewLogin:', isNewLogin)
        console.log('🔍 [WhatsApp] - isOnline:', isOnline)
        console.log('🔍 [WhatsApp] - lastDisconnect:', !!lastDisconnect)
        console.log('🔍 [WhatsApp] - updateKeys:', Object.keys(update))
        // Removido: readyState não existe no tipo WebSocketClient
        console.log('🔍 [WhatsApp] - WebSocket URL:', (sock?.ws as any)?.url || 'N/A')
        
        // Se não encontrou QR mas deveria ter, mostrar todo o update
        if (shouldGenerateQR && !qrCodeFinal && connection !== 'close') {
          console.log('⚠️ [WhatsApp] QR Code NÃO encontrado no update!')
          console.log('⚠️ [WhatsApp] Update completo:', JSON.stringify(update, null, 2))
        } else if (connection !== 'connecting') {
          console.log('🔍 [WhatsApp] - update resumo:', JSON.stringify(update).substring(0, 500))
        }
        console.log('🔍 [WhatsApp] ==========================================')
      }

      // Se tem QR Code, armazenar imediatamente
      // CRÍTICO: Validar que o QR Code recebido do Baileys não está truncado
      if (qrCodeFinal && typeof qrCodeFinal === 'string' && qrCodeFinal.length > 0) {
        // O Baileys retorna uma string que representa o conteúdo do QR Code (não a imagem)
        // Esta string geralmente tem 100-300 caracteres (é uma URL/string do WhatsApp)
        // NÃO é uma imagem base64 ainda - precisa ser convertida
        console.log('✅ [WhatsApp] QR Code recebido do Baileys')
        console.log('   - Tipo:', typeof qrCodeFinal)
        console.log('   - Tamanho da string:', qrCodeFinal.length)
        console.log('   - Preview (primeiros 100 chars):', qrCodeFinal.substring(0, 100))
        
        // Validar que a string não está vazia ou muito curta
        if (qrCodeFinal.length < 10) {
          console.error('❌ [WhatsApp] QR Code recebido muito curto, pode estar inválido')
        } else {
          qrCodeAtual = qrCodeFinal // Armazenar QR Code globalmente
        }
        
        console.log('\n\n')
        console.log('═══════════════════════════════════════════')
        console.log('✅  QR CODE GERADO COM SUCESSO!')
        console.log('✅  QR Code String (primeiros 100 chars):', qrCodeFinal.substring(0, 100))
        console.log('✅  Tamanho do QR Code:', qrCodeFinal.length)
        console.log('✅  QR Code armazenado em qrCodeAtual:', !!qrCodeAtual)
        console.log('═══════════════════════════════════════════')
        console.log('\n')
        
        // CRÍTICO: Salvar QR Code no banco IMEDIATAMENTE
        ;(async () => {
          try {
            const { createClient } = await import('@/lib/supabase/server')
            const supabase = await createClient()
            
            // Converter QR Code string para base64
            // O Baileys retorna uma string que precisa ser convertida para imagem QR Code
            let qrCodeBase64 = qrCodeFinal
            
            console.log('🔄 [WhatsApp] ==========================================')
            console.log('🔄 [WhatsApp] Convertendo QR Code string para imagem...')
            console.log('   - Tamanho da string original:', qrCodeFinal.length)
            console.log('   - Primeiros 100 chars:', qrCodeFinal.substring(0, 100))
            console.log('   - Últimos 50 chars:', qrCodeFinal.substring(Math.max(0, qrCodeFinal.length - 50)))
            
            // Validar que a string não está vazia e tem tamanho razoável
            // O Baileys retorna uma string que representa o conteúdo do QR Code (URL/string)
            // Esta string geralmente tem 100-300 caracteres - NÃO é uma imagem base64 ainda
            if (!qrCodeFinal || qrCodeFinal.length < 10) {
              throw new Error(`QR Code string inválida ou muito curta: ${qrCodeFinal?.length || 0} caracteres`)
            }
            
            // Validar que não parece ser base64 truncado (que seria muito maior)
            if (qrCodeFinal.length > 50 && qrCodeFinal.length < 1000 && /^[A-Za-z0-9+\/]/.test(qrCodeFinal.substring(0, 10))) {
              console.log('✅ [WhatsApp] String parece ser conteúdo do QR Code (não base64), vai converter...')
            }
            
            // Verificar se contém caracteres especiais que indicam que é uma URL/string válida
            if (!qrCodeFinal.match(/[A-Za-z0-9@\-_\.:\/]+/)) {
              console.warn('⚠️ [WhatsApp] QR Code string pode estar em formato inválido')
            }
            
            // CRÍTICO: Verificar o formato da string do QR Code
            // O Baileys retorna uma string que pode ser:
            // 1. Uma URL/string simples que precisa ser codificada em QR Code
            // 2. Uma string base64 de imagem (improvável)
            // 3. Uma string que representa o conteúdo do QR Code
            
            // Validar se parece ser uma URL/string do WhatsApp
            const pareceUrlWhatsApp = qrCodeFinal.includes('web.whatsapp.com') || 
                                     qrCodeFinal.includes('@') || 
                                     qrCodeFinal.startsWith('http') ||
                                     qrCodeFinal.length > 50 && qrCodeFinal.length < 500
            
            if (!qrCodeBase64.startsWith('data:image')) {
              try {
                const qrcode = await import('qrcode')
                
                console.log('🔄 [WhatsApp] Gerando imagem QR Code a partir da string...')
                console.log('   - String parece URL WhatsApp:', pareceUrlWhatsApp)
                console.log('   - Tamanho da string original:', qrCodeFinal.length)
                
                // Gerar imagem QR Code com configurações otimizadas para WhatsApp
                qrCodeBase64 = await qrcode.toDataURL(qrCodeFinal, {
                  errorCorrectionLevel: 'H', // Nível H (High) para melhor correção de erros
                  type: 'image/png',
                  // Removido: quality não é válido para PNG
                  margin: 4, // Margem maior para melhor leitura
                  width: 512, // Tamanho grande para garantir qualidade
                  color: {
                    dark: '#000000', // Preto absoluto
                    light: '#FFFFFF', // Branco absoluto
                  },
                })
                
                console.log('✅ [WhatsApp] QR Code convertido para imagem base64!')
                const convertedBase64 = qrCodeBase64.includes(',') ? qrCodeBase64.split(',')[1] : qrCodeBase64.replace(/^data:image\/[^;]+;base64,?/, '')
                console.log('   - Tamanho total da imagem:', qrCodeBase64.length)
                console.log('   - Tamanho do base64:', convertedBase64.length)
                console.log('   - Primeiros 100 chars da imagem:', qrCodeBase64.substring(0, 100))
                
                // CRÍTICO: Validar que a conversão gerou uma imagem válida
                if (convertedBase64.length < 5000) {
                  console.error(`❌ [WhatsApp] ERRO: Imagem gerada muito pequena (${convertedBase64.length} chars)!`)
                  console.error('   - Isso indica que a conversão falhou ou o QR Code original estava inválido')
                  throw new Error(`Conversão do QR Code gerou imagem muito pequena: ${convertedBase64.length} chars (mínimo 5000)`)
                }
                console.log('✅ [WhatsApp] Imagem QR Code válida gerada com sucesso!')
                console.log('🔄 [WhatsApp] ==========================================')
              } catch (e: any) {
                console.error('❌ [WhatsApp] Erro ao converter QR Code:', e.message)
                console.error('   - Stack:', e.stack)
                throw new Error(`Erro ao gerar imagem do QR Code: ${e.message}`)
              }
            } else {
              console.log('✅ [WhatsApp] QR Code já está em formato de imagem base64!')
            }
            
            // CRÍTICO: Validar QR Code - deve ter pelo menos 5000 caracteres de base64
            // Extrair apenas o base64 para validar tamanho real
            let base64Only = qrCodeBase64
            if (qrCodeBase64.startsWith('data:image')) {
              base64Only = qrCodeBase64.includes(',') ? qrCodeBase64.split(',')[1] : qrCodeBase64.replace(/^data:image\/[^;]+;base64,?/, '')
            }
            const base64Limpo = base64Only.trim().replace(/\s/g, '')
            const TAMANHO_MINIMO = 5000
            
            if (!qrCodeBase64 || base64Limpo.length < TAMANHO_MINIMO) {
              console.error(`❌ [WhatsApp] QR Code INVÁLIDO ou TRUNCADO!`)
              console.error(`   - Tamanho do base64: ${base64Limpo.length} caracteres`)
              console.error(`   - Tamanho mínimo esperado: ${TAMANHO_MINIMO} caracteres`)
              throw new Error(`QR Code inválido ou truncado (${base64Limpo.length} chars, mínimo ${TAMANHO_MINIMO})`)
            }
            
            // CRÍTICO: Garantir que QR Code sempre começa com data:image/png;base64,
            if (!qrCodeBase64.startsWith('data:image/png;base64,')) {
              console.warn('⚠️ [WhatsApp] QR Code não tem prefixo correto, corrigindo...')
              // Remover espaços e quebras de linha
              let qrLimpo = qrCodeBase64.trim().replace(/\s/g, '')
              
              // Se já começa com data: mas não é png, tentar corrigir
              if (qrLimpo.startsWith('data:image')) {
                // Extrair apenas o base64 (depois da vírgula)
                const base64Part = qrLimpo.includes(',') ? qrLimpo.split(',')[1] : qrLimpo.replace(/^data:image\/[^;]+;base64,?/, '')
                qrLimpo = base64Part
              }
              
              // CRÍTICO: Validar e limpar o base64
              // Remover caracteres inválidos do base64 (apenas A-Z, a-z, 0-9, +, /, =)
              const base64Limpo = qrLimpo.replace(/[^A-Za-z0-9+\/=]/g, '')
              
              // CRÍTICO: Validar tamanho mínimo - QR Code base64 deve ter pelo menos 5000 caracteres
              const TAMANHO_MINIMO = 5000
              if (base64Limpo.length < TAMANHO_MINIMO) {
                console.error(`❌ [WhatsApp] Base64 TRUNCADO após limpeza!`)
                console.error(`   - Tamanho: ${base64Limpo.length} caracteres`)
                console.error(`   - Mínimo esperado: ${TAMANHO_MINIMO} caracteres`)
                throw new Error(`Base64 muito curto/truncado após limpeza: ${base64Limpo.length} caracteres (mínimo ${TAMANHO_MINIMO})`)
              }
              
              // Verificar se começa com caracteres válidos de base64
              if (!/^[A-Za-z0-9+\/]/.test(base64Limpo)) {
                console.error('❌ [WhatsApp] Base64 começa com caractere inválido!')
                console.error('   - Primeiros 10 chars:', base64Limpo.substring(0, 10))
                throw new Error('Base64 inválido: começa com caractere não-base64')
              }
              
              qrCodeBase64 = `data:image/png;base64,${base64Limpo}`
              console.log('✅ [WhatsApp] QR Code corrigido e validado')
              console.log('   - Base64 length após limpeza:', base64Limpo.length)
              console.log('   - Primeiros 20 chars do base64:', base64Limpo.substring(0, 20))
            } else {
              // Mesmo se já começa com data:image/png;base64,, validar o base64
              const base64Part = qrCodeBase64.split(',')[1]
              if (base64Part) {
                // Validar que o base64 não tem caracteres inválidos
                const base64Limpo = base64Part.replace(/[^A-Za-z0-9+\/=]/g, '')
                if (base64Limpo !== base64Part) {
                  console.warn('⚠️ [WhatsApp] Base64 tinha caracteres inválidos, limpando...')
                  qrCodeBase64 = `data:image/png;base64,${base64Limpo}`
                }
                
                // Verificar se começa com caracteres válidos
                if (!/^[A-Za-z0-9+\/]/.test(base64Limpo)) {
                  console.error('❌ [WhatsApp] Base64 inválido mesmo após limpeza!')
                  throw new Error('Base64 inválido: contém caracteres não-base64')
                }
              }
            }
            
            // Salvar no banco
            const base64Part = qrCodeBase64.includes(',') ? qrCodeBase64.split(',')[1] : qrCodeBase64.replace(/^data:image\/[^;]+;base64,?/, '')
            console.log('💾 [WhatsApp] ==========================================')
            console.log('💾 [WhatsApp] Salvando QR Code no banco...')
            console.log('   - QR Code formatado corretamente:', qrCodeBase64.startsWith('data:image/png;base64,'))
            console.log('   - QR Code length total:', qrCodeBase64.length)
            console.log('   - Base64 part length:', base64Part.length)
            console.log('   - Base64 preview (primeiros 50):', base64Part.substring(0, 50))
            console.log('   - Base64 preview (últimos 50):', base64Part.substring(Math.max(0, base64Part.length - 50)))
            
            const { error: updateError, data: updateData } = await supabase
              .from('whatsapp_instances')
              .update({
                qr_code: qrCodeBase64,
                status: 'connecting',
                updated_at: new Date().toISOString(),
              })
              .eq('instance_name', 'plenipay')
              .select()
            
            if (updateError) {
              console.error('❌ [WhatsApp] Erro ao salvar QR Code no banco:', updateError)
            } else {
              // Verificar se foi salvo corretamente lendo de volta
              const { data: verifyData } = await supabase
                .from('whatsapp_instances')
                .select('qr_code')
                .eq('instance_name', 'plenipay')
                .single()
              
              if (verifyData?.qr_code) {
                const savedBase64 = verifyData.qr_code.includes(',') ? verifyData.qr_code.split(',')[1] : verifyData.qr_code.replace(/^data:image\/[^;]+;base64,?/, '')
                console.log('✅ [WhatsApp] QR Code salvo no banco!')
                console.log('   - Tamanho salvo:', verifyData.qr_code.length)
                console.log('   - Base64 salvo:', savedBase64.length)
                if (savedBase64.length !== base64Part.length) {
                  console.error(`⚠️ [WhatsApp] ATENÇÃO: QR Code pode ter sido TRUNCADO!`)
                  console.error(`   - Tamanho original: ${base64Part.length}`)
                  console.error(`   - Tamanho salvo: ${savedBase64.length}`)
                  console.error(`   - Diferença: ${base64Part.length - savedBase64.length} caracteres perdidos`)
                } else {
                  console.log('✅ [WhatsApp] QR Code salvo completo, sem truncamento!')
                }
              } else {
                console.warn('⚠️ [WhatsApp] Não foi possível verificar QR Code salvo')
              }
            }
            console.log('💾 [WhatsApp] ==========================================')
          } catch (e: any) {
            console.error('❌ [WhatsApp] Erro ao salvar QR Code no banco:', e.message)
            console.error('   - Stack:', e?.stack)
          }
        })()
        
        // Disparar evento customizado
        // Removido: process.emit não aceita eventos customizados com string
        // if (typeof process !== 'undefined' && process.emit) {
        //   try {
        //     (process as any).emit('qr-generated', qrCodeFinal)
        //   } catch (e) {
        //     // Ignorar erro
        //   }
        // }
      } else if (connection === 'connecting') {
        console.log('⏳ [WhatsApp] Status: connecting - aguardando QR Code...')
        console.log('⏳ [WhatsApp] Isso pode levar 10-60 segundos. Aguarde...')
        
        // Se deveria gerar QR mas não recebeu ainda, log detalhado
        if (shouldGenerateQR && !qrCodeFinal) {
          console.log('⏳ [WhatsApp] Aguardando QR Code ser gerado pelo Baileys...')
          console.log('⏳ [WhatsApp] Debug: connection=connecting, hasQR=false, hasCreds=' + !!state.creds.me)
        }
      } else if (connection === 'open' || ((connection as any) === 'connecting' && isOnline === true)) {
        // CRÍTICO: Verificar se realmente está conectado
        // O Baileys pode enviar connection='open' mas ainda não ter user definido
        const hasUser = !!sock?.user
        const hasConnection = connection === 'open' || isOnline === true
        const isRealmenteConectado = hasUser && hasConnection
        
        console.log('🔍 [WhatsApp] Verificando conexão...')
        console.log('   - connection:', connection)
        console.log('   - isOnline:', isOnline)
        console.log('   - hasUser:', hasUser)
        console.log('   - hasConnection:', hasConnection)
        console.log('   - isRealmenteConectado:', isRealmenteConectado)
        console.log('   - user ID:', sock?.user?.id || 'N/A')
        
        if (isRealmenteConectado) {
          console.log('\n\n')
          console.log('═══════════════════════════════════════════')
          console.log('✅  WHATSAPP CONECTADO COM SUCESSO!')
          console.log('✅  Connection:', connection)
          console.log('✅  isOnline:', isOnline)
          console.log('✅  isNewLogin:', isNewLogin)
          console.log('✅  User ID:', sock?.user?.id || 'N/A')
          console.log('═══════════════════════════════════════════')
          console.log('\n')
          
          isConnecting = false
          qrCodeAtual = null // Limpar QR Code quando conectado
          
          // CRÍTICO: Notificar instance manager sobre conexão IMEDIATAMENTE
          ;(async () => {
            try {
              const { atualizarStatusInstanciaConectada } = await import('./whatsapp-instance-manager')
              const phoneNumber = sock?.user?.id?.split(':')[0] || null
              
              console.log('📞 [WhatsApp] Atualizando status no banco...')
              console.log('   - Phone Number:', phoneNumber)
              
              if (phoneNumber) {
                await atualizarStatusInstanciaConectada('plenipay', phoneNumber)
                console.log('✅ [WhatsApp] Status atualizado no banco com sucesso!')
              } else {
                console.warn('⚠️ [WhatsApp] Phone number não disponível ainda, aguardando...')
                // Tentar novamente após 2 segundos
                setTimeout(async () => {
                  const phoneNumberRetry = sock?.user?.id?.split(':')[0] || null
                  if (phoneNumberRetry) {
                    await atualizarStatusInstanciaConectada('plenipay', phoneNumberRetry)
                    console.log('✅ [WhatsApp] Status atualizado no banco (retry)!')
                  }
                }, 2000)
              }
            } catch (e: any) {
              console.error('❌ [WhatsApp] Erro ao atualizar status no banco:', e.message)
              console.error('   - Stack:', e?.stack)
            }
          })()
        } else {
          console.log('⏳ [WhatsApp] Connection=open mas ainda não tem user definido, aguardando...')
          console.log('   - Vou aguardar até 30 segundos para user ser definido...')
          
          // Aguardar até 30 segundos para o user ser definido
          let tentativasUser = 0
          const maxTentativasUser = 30
          
          // Verificar imediatamente
          const checkUser = async () => {
            if (sock?.user) {
              console.log(`✅ [WhatsApp] User definido após ${tentativasUser} verificações!`)
              console.log('✅ [WhatsApp] User ID:', sock.user.id)
              
              // Agora sim, está conectado
              const phoneNumber = sock.user.id?.split(':')[0] || null
              if (phoneNumber) {
                console.log('📞 [WhatsApp] Atualizando status no banco (após aguardar user)...')
                try {
                  const { atualizarStatusInstanciaConectada } = await import('./whatsapp-instance-manager')
                  await atualizarStatusInstanciaConectada('plenipay', phoneNumber)
                  console.log('✅ [WhatsApp] Status atualizado no banco com sucesso!')
                  isConnecting = false
                  qrCodeAtual = null
                  return true // Parar verificações
                } catch (e: any) {
                  console.error('❌ [WhatsApp] Erro ao atualizar status:', e.message)
                }
              }
              return true
            }
            return false
          }
          
          // Verificar imediatamente primeiro (sem await - verificação síncrona)
          if (sock?.user) {
            // User já está definido, processar conexão
            const phoneNumber = sock.user.id?.split(':')[0] || null
            if (phoneNumber) {
              console.log('📞 [WhatsApp] Atualizando status no banco (user já definido)...')
              ;(async () => {
                try {
                  const { atualizarStatusInstanciaConectada } = await import('./whatsapp-instance-manager')
                  await atualizarStatusInstanciaConectada('plenipay', phoneNumber)
                  console.log('✅ [WhatsApp] Status atualizado no banco com sucesso!')
                  isConnecting = false
                  qrCodeAtual = null
                } catch (e: any) {
                  console.error('❌ [WhatsApp] Erro ao atualizar status:', e.message)
                }
              })()
              return // Já conectado
            }
          }
          
          const checkUserInterval = setInterval(async () => {
            tentativasUser++
            
            if (await checkUser()) {
              clearInterval(checkUserInterval)
              return
            }
            
            // Log a cada 5 verificações
            if (tentativasUser % 5 === 0) {
              console.log(`⏳ [WhatsApp] Ainda aguardando user... (${tentativasUser}/${maxTentativasUser})`)
              console.log('   - connection:', connection)
              console.log('   - isOnline:', isOnline)
              console.log('   - hasUser:', !!sock?.user)
            }
            
            if (tentativasUser >= maxTentativasUser) {
              console.warn(`⚠️ [WhatsApp] User não foi definido após ${maxTentativasUser} verificações`)
              console.warn('⚠️ [WhatsApp] Isso pode indicar que o QR Code não foi escaneado ou houve um problema na autenticação')
              clearInterval(checkUserInterval)
            }
          }, 1000) // Verificar a cada 1 segundo
        }
      } else if (connection === 'close') {
        console.log('❌ [WhatsApp] ==========================================')
        console.log('❌ [WhatsApp] Status: close - conexão fechada!')
        console.log('❌ [WhatsApp] ==========================================')
        
        if (lastDisconnect?.error) {
          const error = lastDisconnect.error as Boom
          const statusCode = error?.output?.statusCode
          const errorMessage = error?.message
          const errorPayload = error?.output?.payload as any
          
          console.log('❌ [WhatsApp] ==========================================')
          console.log('❌ [WhatsApp] ERRO DE DESCONEXÃO DETALHADO:')
          console.log('❌ [WhatsApp] - Status Code:', statusCode)
          console.log('❌ [WhatsApp] - Message:', errorMessage)
          console.log('❌ [WhatsApp] - Output Status:', error?.output?.statusCode)
          console.log('❌ [WhatsApp] - Output Payload:', JSON.stringify(errorPayload, null, 2))
          console.log('❌ [WhatsApp] - Error Type:', error?.name || typeof error)
          console.log('❌ [WhatsApp] - Error Data:', error?.data || 'N/A')
          console.log('❌ [WhatsApp] ==========================================')
          
          // Mapear códigos de erro do Baileys para mensagens amigáveis
          let mensagemErro = 'Erro desconhecido ao conectar'
          
          if (statusCode === DisconnectReason.loggedOut) {
            console.log('⚠️ [WhatsApp] Foi feito logout - credenciais foram removidas')
            mensagemErro = 'Sessão expirada. Gere um novo QR Code.'
            qrCodeAtual = null
          } else if (statusCode === DisconnectReason.badSession) {
            console.log('⚠️ [WhatsApp] Sessão inválida ou corrompida')
            mensagemErro = 'Sessão inválida. Limpe as credenciais e gere um novo QR Code.'
            qrCodeAtual = null
          } else if (statusCode === DisconnectReason.connectionClosed) {
            console.log('⚠️ [WhatsApp] Conexão fechada pelo servidor')
            mensagemErro = 'Conexão fechada pelo servidor. Verifique sua internet e tente novamente.'
          } else if (statusCode === DisconnectReason.connectionLost) {
            console.log('⚠️ [WhatsApp] Conexão perdida')
            mensagemErro = 'Conexão perdida. Verifique sua internet e tente novamente.'
          } else if (statusCode === DisconnectReason.restartRequired) {
            console.log('⚠️ [WhatsApp] Reinício necessário')
            mensagemErro = 'Reinício necessário. Tente conectar novamente.'
          } else if (statusCode === DisconnectReason.timedOut) {
            console.log('⚠️ [WhatsApp] Timeout na conexão')
            mensagemErro = 'Timeout na conexão. Verifique sua internet e tente novamente.'
          } else if (errorMessage?.includes('401') || errorMessage?.includes('Unauthorized')) {
            console.log('⚠️ [WhatsApp] Não autorizado')
            mensagemErro = 'Não autorizado. Limpe as credenciais e gere um novo QR Code.'
            qrCodeAtual = null
          } else if (errorMessage?.includes('403') || errorMessage?.includes('Forbidden')) {
            console.log('⚠️ [WhatsApp] Acesso negado')
            mensagemErro = 'Acesso negado. Limpe as credenciais e gere um novo QR Code.'
            qrCodeAtual = null
          } else if (errorMessage?.includes('429') || errorMessage?.includes('Too Many Requests')) {
            console.log('⚠️ [WhatsApp] Muitas requisições')
            mensagemErro = 'Muitas requisições. Aguarde alguns minutos e tente novamente.'
          } else {
            // Outros erros de desconexão - pode ser temporário
            console.log('⚠️ [WhatsApp] Desconexão por outro motivo:', statusCode)
            console.log('⚠️ [WhatsApp] Isso pode ser temporário - aguardando reconexão...')
            mensagemErro = `Erro de conexão (código: ${statusCode || 'desconhecido'}). ${errorMessage || 'Tente novamente.'}`
          }
          
          // Salvar erro no banco para debug
          ;(async () => {
            try {
              const { createClient } = await import('@/lib/supabase/server')
              const supabase = await createClient()
              
              await supabase
                .from('whatsapp_instances')
                .update({
                  status: 'error',
                  updated_at: new Date().toISOString(),
                })
                .eq('instance_name', 'plenipay')
              
              console.log('💾 [WhatsApp] Erro salvo no banco para debug')
            } catch (e) {
              // Ignorar erro ao salvar
            }
          })()
          
          // Disparar erro para o frontend
          console.error('🚨 [WhatsApp] ERRO QUE DEVE SER MOSTRADO AO USUÁRIO:', mensagemErro)
        } else {
          console.log('⚠️ [WhatsApp] Conexão fechada sem erro específico')
          console.log('⚠️ [WhatsApp] lastDisconnect:', lastDisconnect)
        }
        
        // NÃO limpar socket imediatamente se estamos aguardando QR Code
        // O socket pode tentar reconectar ou o Baileys pode gerar novo QR
        if (shouldGenerateQR && !qrCodeAtual) {
          console.log('⏳ [WhatsApp] Socket fechado mas ainda aguardando QR Code...')
          console.log('⏳ [WhatsApp] Não limpando socket ainda - pode ser temporário')
        } else {
          // Se já tem QR ou não deveria gerar, limpar normalmente
          console.log('🧹 [WhatsApp] Limpando socket após desconexão')
          sock = null
          isConnecting = false
          qrCodeAtual = null
        }
        
        console.log('💡 [WhatsApp] Para reconectar, use o botão "Conectar WhatsApp" no painel admin')
      } else if (connection) {
        console.log('🔍 [WhatsApp] Status:', connection)
      } else {
        // Log detalhado quando não há connection definido
        console.log('🔍 [WhatsApp] Update sem connection definido. Chaves:', Object.keys(update))
        console.log('🔍 [WhatsApp] Conteúdo do update:', JSON.stringify(update, null, 2))
        
        // IMPORTANTE: Se tem QR no update mas não está na propriedade connection
        // Pode estar em outra propriedade
        const todasAsPropriedades = JSON.stringify(update)
        if (todasAsPropriedades.includes('qr') || todasAsPropriedades.includes('QR')) {
          console.log('⚠️ [WhatsApp] ATENÇÃO: Parece ter QR Code no update mas não foi capturado!')
          console.log('⚠️ [WhatsApp] Verificando propriedades manualmente...')
          
          // Tentar extrair QR de qualquer lugar no objeto
          const qrEncontrado = (update as any).qr || 
                              (update as any).qrCode || 
                              (update as any).QR || 
                              (update as any).QRCode ||
                              Object.values(update).find((v: any) => typeof v === 'string' && v.length > 100 && (v.includes('@') || v.includes('http')))
          
          if (qrEncontrado && typeof qrEncontrado === 'string') {
            console.log('✅ [WhatsApp] QR Code encontrado em propriedade alternativa!')
            qrCodeAtual = qrEncontrado
          }
        }
      }

      // Processar close apenas se não estivermos aguardando QR Code
      if (connection === 'close' && !(shouldGenerateQR && !qrCodeAtual)) {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut

        console.log(
          '❌ [WhatsApp] Conexão fechada definitivamente.',
          lastDisconnect?.error
        )

        // Limpar socket e estado apenas se não estiver aguardando QR
        sock = null
        isConnecting = false
        qrCodeAtual = null
      }
      
      // CRÍTICO: Verificar conexão também quando isOnline muda para true
      // Isso pode acontecer após connection='open' mas antes de user estar definido
      if (isOnline === true && sock?.user && connection !== 'close') {
        console.log('✅ [WhatsApp] ==========================================')
        console.log('✅ [WhatsApp] isOnline=true e user definido - conexão completa!')
        console.log('✅ [WhatsApp] Phone Number:', sock?.user?.id?.split(':')[0] || 'N/A')
        console.log('✅ [WhatsApp] ==========================================')
        isConnecting = false
        qrCodeAtual = null
        
        // Atualizar status no banco
        ;(async () => {
          try {
            const { atualizarStatusInstanciaConectada } = await import('./whatsapp-instance-manager')
            const phoneNumber = sock?.user?.id?.split(':')[0] || null
            if (phoneNumber) {
              console.log('📞 [WhatsApp] Atualizando status no banco (via isOnline)...')
              await atualizarStatusInstanciaConectada('plenipay', phoneNumber)
              console.log('✅ [WhatsApp] Status atualizado com sucesso!')
            } else {
              console.warn('⚠️ [WhatsApp] Phone number não disponível ainda')
              // Aguardar e tentar novamente
              setTimeout(async () => {
                const retryPhone = sock?.user?.id?.split(':')[0] || null
                if (retryPhone) {
                  await atualizarStatusInstanciaConectada('plenipay', retryPhone)
                  console.log('✅ [WhatsApp] Status atualizado (retry)!')
                }
              }, 3000)
            }
          } catch (e: any) {
            console.error('❌ [WhatsApp] Erro ao atualizar status:', e.message)
          }
        })()
      }
      
      // ADICIONAL: Verificar periodicamente se user foi definido após connection='open'
      // Isso garante que mesmo se o evento não disparar, vamos detectar a conexão
      if (connection === 'open' && !sock?.user) {
        console.log('⏳ [WhatsApp] Connection=open mas user ainda não definido, verificando periodicamente...')
        
        let tentativasVerificacao = 0
        const maxVerificacoes = 20 // 20 segundos
        
        const intervalVerificacao = setInterval(() => {
          tentativasVerificacao++
          
          if (sock?.user) {
            console.log(`✅ [WhatsApp] User detectado após ${tentativasVerificacao} verificações!`)
            clearInterval(intervalVerificacao)
            
            const phoneNumber = sock.user.id?.split(':')[0] || null
            if (phoneNumber) {
              isConnecting = false
              qrCodeAtual = null
              
              ;(async () => {
                try {
                  const { atualizarStatusInstanciaConectada } = await import('./whatsapp-instance-manager')
                  await atualizarStatusInstanciaConectada('plenipay', phoneNumber)
                  console.log('✅ [WhatsApp] Status atualizado após verificação periódica!')
                } catch (e: any) {
                  console.error('❌ [WhatsApp] Erro ao atualizar status:', e.message)
                }
              })()
            }
          } else if (tentativasVerificacao >= maxVerificacoes) {
            console.warn(`⚠️ [WhatsApp] User não foi definido após ${maxVerificacoes} verificações`)
            clearInterval(intervalVerificacao)
          }
        }, 1000) // Verificar a cada 1 segundo
      }
    })

    sock.ev.on('messages.upsert', async (m) => {
      const messages = m.messages
      if (!messages || messages.length === 0) return

      const message = messages[0]
      if (!message.message) return

      // Processar mensagem recebida
      await processarMensagemRecebida(message)
    })
    
    console.log('✅ [WhatsApp] Socket criado e listeners configurados!')
    console.log('⏳ [WhatsApp] Aguardando eventos de conexão...')
    console.log('💡 [WhatsApp] Se shouldGenerateQR=true, o QR Code deve aparecer em até 30 segundos')
    console.log('💡 [WhatsApp] Observe os logs "Connection update recebido" no terminal para ver o progresso')
    
    // CRÍTICO: Aguardar mais tempo para garantir que o socket se conecte e receba eventos
    console.log('⏳ [WhatsApp] Aguardando 10 segundos para socket estabilizar...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    // Verificar se recebeu QR Code durante a espera
    if (qrCodeAtual) {
      console.log('✅ [WhatsApp] QR Code recebido durante espera inicial!')
      return { success: true, connected: false, qrCode: qrCodeAtual, socket: sock }
    }
    
    // Verificar status após aguardar
    if (sock?.user) {
      console.log('✅ [WhatsApp] Já conectado após criar socket')
      isConnecting = false
      qrCodeAtual = null
      return { success: true, connected: true, qrCode: null, socket: sock }
    }
    
    if (qrCodeAtual) {
      console.log('✅ [WhatsApp] QR Code gerado imediatamente!')
      return { success: true, connected: false, qrCode: qrCodeAtual, socket: sock }
    }
    
    // Se deveria gerar QR mas não gerou ainda, aguardar mais
    if (shouldGenerateQR && !qrCodeAtual) {
      console.log('⏳ [WhatsApp] Aguardando QR Code ser gerado... (pode levar até 60 segundos)')
      console.log('💡 [WhatsApp] Se não aparecer, pode ser um problema com o Baileys 7.0.0-rc.9')
      console.log('💡 [WhatsApp] Verifique os logs acima para ver se o evento connection.update foi recebido')
    }
    
    // Aguardar mais tempo para QR Code ser gerado (até 90 segundos)
    for (let i = 0; i < 90; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verificar QR Code
      if (qrCodeAtual && typeof qrCodeAtual === 'string' && qrCodeAtual.length > 0) {
        console.log(`✅ [WhatsApp] QR Code gerado após ${i + 1} segundos!`)
        return { success: true, connected: false, qrCode: qrCodeAtual, socket: sock }
      }
      
      // Verificar se conectou
      if (sock?.user) {
        console.log(`✅ [WhatsApp] Conectado após ${i + 1} segundos!`)
        isConnecting = false
        qrCodeAtual = null
        return { success: true, connected: true, qrCode: null, socket: sock }
      }
      
      // Verificar se socket ainda existe
      if (!sock) {
        console.error('❌ [WhatsApp] ==========================================')
        console.error('❌ [WhatsApp] Socket foi fechado enquanto aguardava QR Code!')
        console.error('❌ [WhatsApp] Isso pode ser causado por:')
        console.error('   1. Erro no Baileys ao conectar com servidores WhatsApp')
        console.error('   2. Problema de rede/firewall')
        console.error('   3. Versão do Baileys com bugs (7.0.0-rc.9)')
        console.error('❌ [WhatsApp] ==========================================')
        
        // Tentar criar novo socket se ainda não tentamos várias vezes
        if (i < 10) {
          console.log('🔄 [WhatsApp] Tentando criar novo socket...')
          // Não criar novo socket aqui - deixa o usuário tentar novamente
        }
        break
      }
      
      // Verificar se o WebSocket está realmente conectado
      // No Baileys 6.x, pode estar em diferentes lugares
      const ws = (sock as any)?.ws || (sock as any)?.socket || null
      // Removido: readyState não existe no tipo WebSocketClient
      const wsReadyState = undefined // ws?.readyState
      if (wsReadyState !== undefined && wsReadyState !== 1) {
        // WebSocket não está aberto (1 = OPEN)
        // 0 = CONNECTING, 2 = CLOSING, 3 = CLOSED
        if (wsReadyState === 3) {
          console.error('❌ [WhatsApp] WebSocket está CLOSED!')
          if (i < 10) {
            console.log('⏳ [WhatsApp] Aguardando mais um pouco... pode ser temporário')
          } else {
            console.error('❌ [WhatsApp] WebSocket permanece fechado após 10 segundos')
            break
          }
        } else if (wsReadyState === 2) {
          console.warn('⚠️ [WhatsApp] WebSocket está CLOSING...')
        } else if (wsReadyState === 0) {
          console.log('⏳ [WhatsApp] WebSocket ainda está CONNECTING...')
        }
      }
      
      // Log a cada 10 segundos
      if ((i + 1) % 10 === 0) {
        console.log(`⏳ [WhatsApp] Aguardando QR Code... (${i + 1}/90 segundos)`)
        console.log(`🔍 [WhatsApp] Debug:`)
        console.log(`   - hasQR: ${!!qrCodeAtual}`)
        console.log(`   - hasCreds: ${!!state.creds.me}`)
        console.log(`   - socketExists: ${!!sock}`)
        const wsDebug = (sock as any)?.ws || (sock as any)?.socket || null
        // Removido: readyState não existe no tipo WebSocketClient
        console.log(`   - shouldGenerateQR: ${shouldGenerateQR}`)
        
        // Se deveria gerar QR mas não está gerando, pode ser problema com Baileys
        if (shouldGenerateQR && !state.creds.me && i >= 30) {
          console.warn('⚠️ [WhatsApp] QR Code não foi gerado após 30 segundos!')
          console.warn('⚠️ [WhatsApp] Pode ser um problema com Baileys 7.0.0-rc.9 (release candidate)')
          console.warn('💡 [WhatsApp] Tente: npm install @whiskeysockets/baileys@latest')
        }
      }
    }
    
    console.log('❌ [WhatsApp] QR Code não foi gerado após 90 segundos!')
    console.log('🔍 [WhatsApp] Estado final:', {
      hasQR: !!qrCodeAtual,
      hasCreds: !!state.creds.me,
      shouldGenerateQR,
      isConnecting,
      socketExists: !!sock,
      // Removido: readyState não existe no tipo WebSocketClient
      socketReadyState: 'N/A' // ((sock as any)?.ws || (sock as any)?.socket)?.readyState || 'N/A'
    })
    
    // Diagnosticar problema
    let errorMessage = 'QR Code não foi gerado após 90 segundos. '
    
    if (state.creds.me) {
      errorMessage += 'PROBLEMA: Credenciais ainda existem! Delete a pasta whatsapp_auth manualmente.'
    } else if (!shouldGenerateQR) {
      errorMessage += 'PROBLEMA: shouldGenerateQR está false. Isso não deveria acontecer.'
    } else if (!sock) {
      errorMessage += 'PROBLEMA: Socket foi fechado durante a conexão.'
    } else {
      errorMessage += 'POSSÍVEL CAUSA: Baileys 7.0.0-rc.9 (release candidate) pode ter bugs. Tente atualizar: npm install @whiskeysockets/baileys@latest'
    }
    
    // Limpar estado se falhou
    isConnecting = false
    
    return { 
      success: false, 
      connected: false, 
      qrCode: null, 
      error: errorMessage,
      socket: sock 
    }
  } catch (error: any) {
    console.error('❌ [WhatsApp] Erro ao conectar:', error)
    console.error('❌ [WhatsApp] Stack:', error?.stack)
    isConnecting = false
    sock = null
    return { success: false, connected: false, qrCode: null, error: error.message || 'Erro ao conectar', socket: null }
  }
}

async function processarMensagemRecebida(message: any) {
  try {
    const texto = message.message?.conversation || 
                  message.message?.extendedTextMessage?.text || 
                  ''
    
    if (!texto) return

    const numeroRemetente = message.key.remoteJid?.replace('@s.whatsapp.net', '') || ''
    
    if (!numeroRemetente) return

    console.log('📱 [WhatsApp] Mensagem recebida:', { numeroRemetente, texto })

    // Chamar webhook interno (mesma lógica do Evolution API)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: {
            remoteJid: message.key.remoteJid,
          },
          message: {
            conversation: texto,
          },
        }),
      }
    )

    const data = await response.json()
    console.log('✅ [WhatsApp] Mensagem processada:', data)
  } catch (error) {
    console.error('❌ [WhatsApp] Erro ao processar mensagem:', error)
  }
}

export async function enviarMensagemWhatsApp(numero: string, mensagem: string) {
  if (!sock || !sock.user) {
    console.error('❌ [WhatsApp] Não está conectado!')
    return false
  }

  try {
    const numeroFormatado = numero.includes('@') 
      ? numero 
      : `${numero}@s.whatsapp.net`

    await sock.sendMessage(numeroFormatado, { text: mensagem })
    console.log('✅ [WhatsApp] Mensagem enviada para:', numeroFormatado)
    return true
  } catch (error) {
    console.error('❌ [WhatsApp] Erro ao enviar mensagem:', error)
    return false
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

/**
 * Desconectar WhatsApp completamente
 * Faz logout se conectado e limpa o socket
 */
export async function disconnectWhatsApp() {
  try {
    console.log('🔄 [WhatsApp] Desconectando WhatsApp...')
    
    if (sock) {
      try {
        // Se está conectado, fazer logout primeiro
        if (sock.user) {
          console.log('🔄 [WhatsApp] Fazendo logout...')
          try {
            await sock.logout()
            console.log('✅ [WhatsApp] Logout realizado com sucesso')
          } catch (logoutError: any) {
            console.warn('⚠️ [WhatsApp] Erro ao fazer logout (pode já estar desconectado):', logoutError.message)
          }
        }
        
        // Remover todos os listeners
        try {
          // Remover todos os listeners - usar verificação de tipo segura
          if (sock.ev && typeof sock.ev.removeAllListeners === 'function') {
            (sock.ev.removeAllListeners as any)()
          }
          console.log('✅ [WhatsApp] Listeners removidos')
        } catch (e) {
          console.warn('⚠️ [WhatsApp] Erro ao remover listeners:', e)
        }
        
        // Fechar socket
        try {
          sock.end(undefined)
          console.log('✅ [WhatsApp] Socket fechado')
        } catch (endError: any) {
          console.warn('⚠️ [WhatsApp] Erro ao fechar socket:', endError.message)
        }
      } catch (e: any) {
        console.warn('⚠️ [WhatsApp] Erro ao desconectar socket:', e.message)
      }
    }
    
    // Limpar estado
    sock = null
    isConnecting = false
    qrCodeAtual = null
    
    console.log('✅ [WhatsApp] WhatsApp desconectado completamente')
    return { success: true }
  } catch (error: any) {
    console.error('❌ [WhatsApp] Erro ao desconectar:', error)
    // Limpar estado mesmo se erro
    sock = null
    isConnecting = false
    qrCodeAtual = null
    return { success: false, error: error.message }
  }
}

// Função para conectar via número de telefone (Pairing Code)
export async function connectWhatsAppViaPhone(phoneNumber: string): Promise<{ success: boolean; pairingCode?: string; error?: string }> {
  try {
    console.log('📱 [WhatsApp Phone] ==========================================')
    console.log('📱 [WhatsApp Phone] Iniciando conexão via número de telefone...')
    console.log('📱 [WhatsApp Phone] Número recebido:', phoneNumber)
    
    // Limpar número (remover caracteres especiais, manter apenas números)
    const numeroLimpo = phoneNumber.replace(/\D/g, '')
    
    if (numeroLimpo.length < 10) {
      return {
        success: false,
        error: 'Número de telefone inválido. Use o formato internacional (ex: 5511999999999)'
      }
    }
    
    // Limpar credenciais antigas primeiro
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const authDir = path.join(process.cwd(), 'whatsapp_auth')
      
      try {
        await fs.rm(authDir, { recursive: true, force: true })
        console.log('✅ [WhatsApp Phone] Credenciais antigas removidas')
      } catch (e: any) {
        if (e.code !== 'ENOENT') {
          console.log('⚠️ [WhatsApp Phone] Erro ao limpar credenciais:', e)
        }
      }
    } catch (e) {
      console.log('⚠️ [WhatsApp Phone] Erro ao importar fs:', e)
    }
    
    // Resetar socket
    if (sock) {
      try {
        sock.end(undefined)
      } catch (e) {
        // Ignorar erros
      }
      sock = null
    }
    isConnecting = false
    qrCodeAtual = null
    
    // Criar novo socket sem QR Code
    console.log('📱 [WhatsApp Phone] Criando socket...')
    
    let state: any
    let saveCreds: any
    
    try {
      const authState = await useMultiFileAuthState('whatsapp_auth')
      state = authState.state
      saveCreds = authState.saveCreds
      console.log('✅ [WhatsApp Phone] Auth state carregado')
    } catch (error: any) {
      console.error('❌ [WhatsApp Phone] Erro ao carregar auth state:', error)
      throw new Error(`Erro ao carregar estado de autenticação: ${error.message}`)
    }
    
    let version: any
    try {
      const versionData = await fetchLatestBaileysVersion()
      version = versionData.version || versionData
      console.log('✅ [WhatsApp Phone] Versão Baileys obtida:', version)
    } catch (error: any) {
      console.warn('⚠️ [WhatsApp Phone] Erro ao buscar versão:', error.message)
      console.warn('⚠️ [WhatsApp Phone] Usando versão padrão...')
      version = undefined // Baileys usará a versão padrão
    }
    
    try {
      // Criar logger
      const logger = pino({ level: 'info' }) // Mais logs para debug
      
      sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        printQRInTerminal: false, // Não imprimir QR Code
        generateHighQualityLinkPreview: true,
        logger,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
      })
      
      console.log('✅ [WhatsApp Phone] Socket criado com sucesso')
      
      sock.ev.on('creds.update', saveCreds)
      
    } catch (socketError: any) {
      console.error('❌ [WhatsApp Phone] Erro ao criar socket:', socketError)
      throw new Error(`Erro ao criar socket: ${socketError.message}`)
    }
    
    // Solicitar código de pairing
    // O Baileys v6 pode não ter requestPairingCode diretamente no socket
    // Vamos usar eventos para capturar o pairing code
    console.log('📱 [WhatsApp Phone] Configurando listener para pairing code...')
    
    let pairingCode: string | undefined
    let pairingCodePromiseResolve: ((code: string) => void) | null = null
    let pairingCodePromiseReject: ((error: Error) => void) | null = null
    
    const pairingCodePromise = new Promise<string>((resolve, reject) => {
      pairingCodePromiseResolve = resolve
      pairingCodePromiseReject = reject
      
      // Timeout após 60 segundos
      setTimeout(() => {
        reject(new Error('Timeout aguardando pairing code (60 segundos)'))
      }, 60000)
    })
    
    // Listener para eventos - capturar pairing code
    const connectionHandler = (update: any) => {
      console.log('🔍 [WhatsApp Phone] Connection update recebido:', {
        connection: update.connection,
        hasQR: !!update.qr,
        hasPairingCode: !!update.pairingCode,
        updateKeys: Object.keys(update)
      })
      
      // Verificar se tem pairing code no update
      if (update.pairingCode) {
        pairingCode = update.pairingCode
        console.log('✅ [WhatsApp Phone] Pairing code recebido via evento:', pairingCode)
        if (pairingCodePromiseResolve && pairingCode) {
          pairingCodePromiseResolve(pairingCode)
          // Remover listener após receber
          sock?.ev.off('connection.update', connectionHandler)
        }
        return
      }
      
      if (update.connection === 'open') {
        console.log('✅ [WhatsApp Phone] Conectado!')
        sock?.ev.off('connection.update', connectionHandler)
        if (pairingCodePromiseReject && !pairingCode) {
          pairingCodePromiseReject(new Error('Conectado sem pairing code'))
        }
      }
    }
    
    sock.ev.on('connection.update', connectionHandler)
    
    // Tentar solicitar pairing code
    try {
      // No Baileys v7, o pairing code pode ser solicitado de diferentes formas
      // Vamos tentar múltiplas abordagens
      
      console.log('📱 [WhatsApp Phone] Tentando gerar pairing code...')
      
      // Abordagem 1: Tentar método direto do socket
      const sockAny = sock as any
      
      console.log('🔍 [WhatsApp Phone] Verificando métodos disponíveis no socket...')
      console.log('🔍 [WhatsApp Phone] Métodos do socket:', Object.keys(sockAny).filter(k => k.includes('pair') || k.includes('Pair') || k.includes('request')).join(', '))
      
      try {
        // Verificar se tem método requestPairingCode
        if (sockAny && typeof sockAny.requestPairingCode === 'function') {
          console.log('📱 [WhatsApp Phone] Tentativa 1: Usando método requestPairingCode...')
          pairingCode = await sockAny.requestPairingCode(numeroLimpo)
          console.log('✅ [WhatsApp Phone] Pairing code gerado via método:', pairingCode)
        } else {
          console.log('⚠️ [WhatsApp Phone] Método requestPairingCode não encontrado no socket')
          console.log('⚠️ [WhatsApp Phone] O Baileys v7 pode não ter este método diretamente')
        }
      } catch (methodError: any) {
        console.log('⚠️ [WhatsApp Phone] Erro ao tentar método requestPairingCode:', methodError.message)
      }
      
      // Abordagem 2: Aguardar evento (o Baileys pode gerar automaticamente)
      if (!pairingCode) {
        console.log('📱 [WhatsApp Phone] Tentativa 2: Aguardando pairing code via eventos (até 30s)...')
        
        // Aguardar até 30 segundos por evento
        try {
          pairingCode = await Promise.race([
            pairingCodePromise,
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 30000)
            )
          ]) as string
          console.log('✅ [WhatsApp Phone] Pairing code recebido via evento:', pairingCode)
        } catch (timeoutError: any) {
          if (timeoutError.message !== 'Timeout') {
            throw timeoutError
          }
          console.log('⏳ [WhatsApp Phone] Timeout aguardando pairing code via eventos')
        }
      }
      
      // Se ainda não tem pairing code, o Baileys pode não suportar nesta versão
      if (!pairingCode) {
        console.error('❌ [WhatsApp Phone] Pairing code não foi gerado após todas as tentativas')
        console.error('❌ [WhatsApp Phone] Versão do Baileys:', version)
        console.error('❌ [WhatsApp Phone] O pairing code pode não estar disponível nesta versão')
        sock?.ev.off('connection.update', connectionHandler)
        
        // Limpar socket
        try {
          if (sock) {
            sock.end(undefined)
            sock = null
          }
        } catch (e) {
          // Ignorar
        }
        
        // Limpar socket antes de retornar erro
        try {
          if (sock) {
            sock.end(undefined)
            sock = null
          }
        } catch (e) {
          // Ignorar
        }
        
        return {
          success: false,
          error: 'O método de pairing code não está disponível na versão atual do Baileys. INFORMAÇÃO: A versão 7.0.0-rc.9 (release candidate) pode não ter suporte completo. SOLUÇÕES: 1) Use QR Code (funciona sempre), 2) Atualize o Baileys: npm install @whiskeysockets/baileys@latest'
        }
      }
      
    } catch (error: any) {
      console.error('❌ [WhatsApp Phone] ==========================================')
      console.error('❌ [WhatsApp Phone] ERRO ao solicitar pairing code:')
      console.error('❌ [WhatsApp Phone] Mensagem:', error.message)
      console.error('❌ [WhatsApp Phone] Stack:', error?.stack)
      console.error('❌ [WhatsApp Phone] ==========================================')
      
      // Limpar recursos
      sock?.ev.off('connection.update', connectionHandler)
      
      try {
        if (sock) {
          sock.end(undefined)
          sock = null
        }
      } catch (e) {
        // Ignorar erros ao limpar
      }
      
      return {
        success: false,
        error: `Erro ao gerar código de pairing: ${error.message || 'Erro desconhecido'}. RECOMENDAÇÃO: Use QR Code como alternativa, que funciona sempre.`
      }
    }
    
    // Limpar listener (já temos o pairing code)
    sock?.ev.off('connection.update', connectionHandler)
    
    if (!pairingCode) {
      // Limpar socket
      try {
        if (sock) {
          sock.end(undefined)
          sock = null
        }
      } catch (e) {
        // Ignorar
      }
      
      return {
        success: false,
        error: 'Não foi possível gerar código de pairing. RECOMENDAÇÃO: Use QR Code como alternativa.'
      }
    }
    
    console.log('✅ [WhatsApp Phone] ==========================================')
    console.log('✅ [WhatsApp Phone] Pairing code gerado com sucesso!')
    console.log('✅ [WhatsApp Phone] Código:', pairingCode)
    console.log('✅ [WhatsApp Phone] ==========================================')
    
    // Configurar eventos de conexão para monitorar quando conectar
    const statusHandler = (update: any) => {
      const { connection, lastDisconnect } = update
      
      if (connection === 'open') {
        console.log('✅ [WhatsApp Phone] Conectado com sucesso via número de telefone!')
        isConnecting = false
        sock?.ev.off('connection.update', statusHandler)
      } else if (connection === 'close') {
        console.log('❌ [WhatsApp Phone] Conexão fechada')
        if (lastDisconnect?.error) {
          console.log('❌ [WhatsApp Phone] Erro:', lastDisconnect.error)
        }
        isConnecting = false
        sock?.ev.off('connection.update', statusHandler)
      }
    }
    
    // Adicionar listener apenas para status de conexão
    sock.ev.on('connection.update', statusHandler)
    
    return {
      success: true,
      pairingCode: pairingCode
    }
    
  } catch (error: any) {
    console.error('❌ [WhatsApp Phone] ==========================================')
    console.error('❌ [WhatsApp Phone] ERRO GERAL ao conectar via número:')
    console.error('❌ [WhatsApp Phone] Mensagem:', error.message)
    console.error('❌ [WhatsApp Phone] Stack:', error?.stack)
    console.error('❌ [WhatsApp Phone] ==========================================')
    
    // Limpar socket em caso de erro
    try {
      if (sock) {
        sock.end(undefined)
        sock = null
      }
    } catch (e) {
      // Ignorar
    }
    
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao conectar via número de telefone. RECOMENDAÇÃO: Use QR Code como alternativa.'
    }
  }
}
