/**
 * Handler para processar mensagens WhatsApp e integrar com PLEN
 */

// Armazenar emails pendentes temporariamente (em memória)
// Formato: phoneNumber -> email
const pendingEmails = new Map<string, string>()

interface WhatsAppMessage {
  key: {
    remoteJid: string
    id: string
  }
  message: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
  }
  messageTimestamp: number
  pushName?: string
}

interface UserContext {
  userId?: string
  phoneNumber: string
  nome?: string
  email?: string
  registered: boolean
  whatsappAuthenticated: boolean
}

// Cache de mensagens enviadas recentemente (evitar processar nossas próprias mensagens)
const sentMessages = new Map<string, number>()
const SENT_MESSAGE_CACHE_TTL = 120000 // 2 minutos

// Limpar cache antigo
setInterval(() => {
  const now = Date.now()
  // Usar Array.from para compatibilidade com TypeScript
  Array.from(sentMessages.entries()).forEach(([key, timestamp]) => {
    if (now - timestamp > SENT_MESSAGE_CACHE_TTL) {
      sentMessages.delete(key)
    }
  })
}, 60000) // Limpar a cada 1 minuto

/**
 * Registrar mensagem enviada (para evitar processar nossas próprias mensagens)
 */
export function registerSentMessage(phoneNumber: string, message: string) {
  const key = `${phoneNumber}-${message.substring(0, 100)}`
  sentMessages.set(key, Date.now())
  console.log('📝 [WhatsApp PLEN] Mensagem enviada registrada:', key.substring(0, 50))
}

/**
 * Verificar se mensagem foi enviada por nós recentemente
 */
function isRecentlySentMessage(phoneNumber: string, text: string): boolean {
  const key = `${phoneNumber}-${text.substring(0, 100)}`
  const sentTime = sentMessages.get(key)
  
  if (sentTime) {
    const timeSinceSent = Date.now() - sentTime
    if (timeSinceSent < SENT_MESSAGE_CACHE_TTL) {
      console.log('⚠️ [WhatsApp PLEN] Mensagem foi enviada por nós recentemente, ignorando')
      return true
    }
  }
  
  return false
}

/**
 * Processar mensagem recebida do WhatsApp
 */
export async function processWhatsAppMessage(message: WhatsAppMessage) {
  try {
    console.log('🔄 [WhatsApp PLEN] ==========================================')
    console.log('🔄 [WhatsApp PLEN] PROCESSANDO MENSAGEM WHATSAPP')
    console.log('🔄 [WhatsApp PLEN] Message:', JSON.stringify(message, null, 2).substring(0, 500))
    console.log('🔄 [WhatsApp PLEN] ==========================================')
    
    const phoneNumber = extractPhoneNumber(message.key.remoteJid)
    let text = extractMessageText(message)
    
    console.log('📱 [WhatsApp PLEN] Phone Number:', phoneNumber)
    console.log('📱 [WhatsApp PLEN] Text extraído:', text ? text.substring(0, 100) : 'null')
    
    // Garantir que text é string
    if (text && typeof text !== 'string') {
      text = String(text)
    }
    
    if (!text || (typeof text === 'string' && text.trim() === '')) {
      console.log('⚠️ [WhatsApp PLEN] Mensagem sem texto - retornando null')
      return null
    }

    // CRÍTICO: Verificar se esta mensagem foi enviada por nós recentemente
    const isSentByUs = isRecentlySentMessage(phoneNumber, text)
    console.log('🔍 [WhatsApp PLEN] Verificando se mensagem foi enviada por nós:', {
      phoneNumber,
      textPreview: typeof text === 'string' ? text.substring(0, 50) : String(text).substring(0, 50),
      isSentByUs,
      cacheSize: sentMessages.size,
    })
    
    if (isSentByUs) {
      console.log('⚠️ [WhatsApp PLEN] Ignorando mensagem que foi enviada por nós')
      return null
    }

    console.log('📨 [WhatsApp PLEN] ==========================================')
    console.log('📨 [WhatsApp PLEN] MENSAGEM RECEBIDA PARA PROCESSAR')
    console.log('📨 [WhatsApp PLEN] From:', phoneNumber)
    console.log('📨 [WhatsApp PLEN] Text:', typeof text === 'string' ? text.substring(0, 200) : String(text).substring(0, 200))
    console.log('📨 [WhatsApp PLEN] ==========================================')

    // Verificar se usuário está autenticado via WhatsApp
    console.log('🔍 [WhatsApp PLEN] Buscando contexto do usuário...')
    const userContext = await getUserContext(phoneNumber)
    console.log('👤 [WhatsApp PLEN] ==========================================')
    console.log('👤 [WhatsApp PLEN] CONTEXTO DO USUÁRIO')
    console.log('👤 [WhatsApp PLEN] Registered:', userContext.registered)
    console.log('👤 [WhatsApp PLEN] WhatsApp Authenticated:', userContext.whatsappAuthenticated)
    console.log('👤 [WhatsApp PLEN] User ID:', userContext.userId)
    console.log('👤 [WhatsApp PLEN] Phone Number:', phoneNumber)
    console.log('👤 [WhatsApp PLEN] ==========================================')

    // Se não está autenticado via WhatsApp, pedir email e key
    if (!userContext.whatsappAuthenticated) {
      console.log('⚠️ [WhatsApp PLEN] Usuário não autenticado via WhatsApp, iniciando autenticação...')
      
      // MODO TESTE: Se a mensagem é "oi" ou similar, sempre responder mesmo sem autenticação
      // Isso permite testar se o problema é autenticação ou envio
      const lowerText = text.toLowerCase().trim()
      const isGreeting = lowerText === 'oi' || lowerText === 'olá' || lowerText === 'ola' || lowerText === 'hello' || lowerText === 'hi'
      
      if (isGreeting) {
        console.log('🧪 [WhatsApp PLEN] MODO TESTE: Respondendo "oi" mesmo sem autenticação para diagnóstico')
        const authResult = await handleWhatsAppAuthentication(phoneNumber, text, userContext)
        console.log('📤 [WhatsApp PLEN] Resultado da autenticação:', authResult ? `success: ${authResult.success}` : 'null')
        
        // CRÍTICO: Se a autenticação retornou resposta, usar ela
        // Se não retornou, criar resposta padrão para teste
        if (authResult && authResult.success && authResult.message) {
          return authResult
        }
        
        // Se não retornou resposta, criar uma para teste
        console.log('🧪 [WhatsApp PLEN] Criando resposta de teste (autenticação não retornou resposta)')
        return {
          success: true,
          message: `Olá! 👋 Bem-vindo ao assistente PLEN!\n\nPara usar o assistente, preciso identificar sua conta.\n\n📧 Me envie seu email de cadastro...`,
        }
      }
      
      const authResult = await handleWhatsAppAuthentication(phoneNumber, text, userContext)
      console.log('📤 [WhatsApp PLEN] Resultado da autenticação:', authResult ? `success: ${authResult.success}` : 'null')
      return authResult
    }

    // Se está autenticado, processar com assistente PLEN
    console.log('✅ [WhatsApp PLEN] ==========================================')
    console.log('✅ [WhatsApp PLEN] USUÁRIO AUTENTICADO, PROCESSANDO COM PLEN')
    console.log('✅ [WhatsApp PLEN] User ID:', userContext.userId)
    console.log('✅ [WhatsApp PLEN] Text:', text.substring(0, 100))
    console.log('✅ [WhatsApp PLEN] ==========================================')
    
    // Verificar se há imagem no texto (marcador especial)
    let imageBase64: string | undefined = undefined
    if (text.includes('[IMAGEM_BASE64:')) {
      const match = text.match(/\[IMAGEM_BASE64:(.+?)\]/)
      if (match && match[1]) {
        imageBase64 = match[1]
        text = '' // Limpar texto, a imagem será processada
        console.log('🖼️ [WhatsApp PLEN] Imagem detectada no texto, enviando para API PLEN')
      }
    }
    
    const plenResult = await processWithPLEN(userContext.userId!, text, imageBase64)
    
    console.log('📤 [WhatsApp PLEN] ==========================================')
    console.log('📤 [WhatsApp PLEN] RESULTADO DO PLEN')
    console.log('📤 [WhatsApp PLEN] Result é null?', plenResult === null)
    console.log('📤 [WhatsApp PLEN] Success:', plenResult?.success)
    console.log('📤 [WhatsApp PLEN] Message:', plenResult?.message ? plenResult.message.substring(0, 200) : 'null')
    console.log('📤 [WhatsApp PLEN] Result completo:', plenResult ? JSON.stringify(plenResult, null, 2).substring(0, 500) : 'null')
    console.log('📤 [WhatsApp PLEN] ==========================================')
    
    // CRÍTICO: Se não retornou resultado válido, retornar mensagem padrão
    if (!plenResult || !plenResult.success || !plenResult.message) {
      console.error('❌ [WhatsApp PLEN] ==========================================')
      console.error('❌ [WhatsApp PLEN] RESULTADO INVÁLIDO DO PLEN')
      console.error('❌ [WhatsApp PLEN] Result é null?', plenResult === null)
      console.error('❌ [WhatsApp PLEN] Result tem success?', plenResult?.success)
      console.error('❌ [WhatsApp PLEN] Result tem message?', !!plenResult?.message)
      console.error('❌ [WhatsApp PLEN] Result completo:', plenResult ? JSON.stringify(plenResult, null, 2).substring(0, 500) : 'null')
      console.error('❌ [WhatsApp PLEN] Retornando mensagem padrão')
      console.error('❌ [WhatsApp PLEN] ==========================================')
      
      return {
        success: true,
        message: 'Desculpe, não consegui processar sua mensagem. Por favor, tente novamente.',
      }
    }
    
    console.log('✅ [WhatsApp PLEN] Resultado válido, retornando resposta')
    return plenResult
  } catch (error: any) {
    console.error('❌ [WhatsApp PLEN] ==========================================')
    console.error('❌ [WhatsApp PLEN] ERRO AO PROCESSAR MENSAGEM')
    console.error('❌ [WhatsApp PLEN] Error:', error.message)
    console.error('❌ [WhatsApp PLEN] Stack:', error.stack?.substring(0, 500))
    console.error('❌ [WhatsApp PLEN] ==========================================')
    
    // CRÍTICO: Sempre retornar uma resposta, mesmo em caso de erro
    return {
      success: true,
      message: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
    }
  }
}

/**
 * Extrair número de telefone do JID
 */
function extractPhoneNumber(remoteJid: string): string {
  // Formato: 5511999999999@s.whatsapp.net
  return remoteJid.split('@')[0]
}

/**
 * Extrair texto da mensagem
 */
function extractMessageText(message: WhatsAppMessage): string {
  if (message.message.conversation) {
    return message.message.conversation
  }
  
  if (message.message.extendedTextMessage?.text) {
    return message.message.extendedTextMessage.text
  }
  
  return ''
}

/**
 * Obter contexto do usuário (verificar se está autenticado via WhatsApp)
 */
async function getUserContext(phoneNumber: string): Promise<UserContext> {
  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()

    if (!supabaseAdmin) {
      console.error('❌ [WhatsApp PLEN] Erro ao criar Admin Client')
      return {
        phoneNumber,
        registered: false,
        whatsappAuthenticated: false,
      }
    }

    // Primeiro, verificar se há sessão WhatsApp ativa
    try {
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('user_id, expires_at')
        .eq('phone_number', phoneNumber)
        .maybeSingle() // Usar maybeSingle para não dar erro se não existir

      // Se a tabela não existe, continuar sem erro (usuário precisa executar SQL)
      if (sessionError && !sessionError.message.includes('does not exist')) {
        console.warn('⚠️ [WhatsApp PLEN] Erro ao buscar sessão (tabela pode não existir):', sessionError.message)
      }

      if (session && (!session.expires_at || new Date(session.expires_at) > new Date())) {
        // Sessão ativa encontrada, buscar dados do usuário
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, nome, email, whatsapp')
          .eq('id', session.user_id)
          .single()

        if (profile) {
          console.log('✅ [WhatsApp PLEN] Usuário autenticado via WhatsApp:', {
            userId: profile.id,
            phoneNumber,
          })
          return {
            userId: profile.id,
            phoneNumber,
            nome: profile.nome,
            email: profile.email,
            registered: true,
            whatsappAuthenticated: true,
          }
        }
      }
    } catch (sessionErr: any) {
      // Se a tabela não existe, continuar normalmente (pedir autenticação)
      if (sessionErr.message?.includes('does not exist') || sessionErr.message?.includes('relation') || sessionErr.code === '42P01') {
        console.log('ℹ️ [WhatsApp PLEN] Tabela whatsapp_sessions não existe ainda. Execute o SQL ADICIONAR-WHATSAPP-KEY.sql')
      } else {
        console.error('❌ [WhatsApp PLEN] Erro ao verificar sessão:', sessionErr)
      }
    }

    // Não há sessão ativa, retornar não autenticado
    console.log('⚠️ [WhatsApp PLEN] Usuário não autenticado via WhatsApp:', phoneNumber)
    return {
      phoneNumber,
      registered: false,
      whatsappAuthenticated: false,
    }
  } catch (error) {
    console.error('❌ [WhatsApp PLEN] Erro ao buscar contexto do usuário:', error)
    return {
      phoneNumber,
      registered: false,
      whatsappAuthenticated: false,
    }
  }
}

/**
 * Processar autenticação via WhatsApp
 * Fluxo: Pedir email primeiro, depois pedir key
 */
async function handleWhatsAppAuthentication(
  phoneNumber: string,
  text: string,
  context: UserContext
) {
  const lowerText = text.toLowerCase().trim()
  const trimmedText = text.trim()

  // Verificar se é primeira mensagem (oi, olá, etc)
  if (lowerText === 'oi' || lowerText === 'olá' || lowerText === 'ola' || lowerText === 'hello' || lowerText === 'hi') {
    // Limpar qualquer email pendente anterior
    pendingEmails.delete(phoneNumber)
    return {
      success: true,
      message: `Olá! 👋 Bem-vindo ao assistente PLEN!\n\nPara usar o assistente, preciso identificar sua conta.\n\n📧 Me envie seu email de cadastro...`,
    }
  }

  // Verificar se já tem email pendente (esperando key)
  const pendingEmail = pendingEmails.get(phoneNumber)

  if (pendingEmail) {
    // Já tem email, agora está esperando a key
    // Tentar extrair key da mensagem
    let key: string | null = null

    // Tentar extrair key de diferentes formatos
    const keyMatch = trimmedText.match(/(?:key|código|codigo|chave)[\s:]*([a-zA-Z0-9-]+)/i)
    if (keyMatch) {
      key = keyMatch[1].trim()
    } else {
      // Se não encontrou no formato, usar o texto inteiro como key (se não tiver espaços)
      const cleanText = trimmedText.replace(/^(?:key|código|codigo|chave)[\s:]*/i, '').trim()
      if (cleanText && !cleanText.includes(' ') && cleanText.length > 5) {
        key = cleanText
      } else if (cleanText && cleanText.length > 5) {
        // Se tem espaços, pegar primeira palavra
        key = cleanText.split(/\s+/)[0]
      }
    }

    if (key && key.length > 5) {
      // Tem key, tentar autenticar
      console.log('🔐 [WhatsApp PLEN] Tentando autenticar:', { email: pendingEmail, key: key.substring(0, 5) + '...' })
      const authResult = await authenticateWhatsAppUser(phoneNumber, pendingEmail, key)
      
      // Limpar email pendente (sucesso ou falha)
      pendingEmails.delete(phoneNumber)
      
      if (authResult.success) {
        return {
          success: true,
          message: `✅ Autenticação realizada com sucesso!\n\nOlá, ${authResult.nome || 'usuário'}! 👋\n\nAgora você pode usar o assistente PLEN. Como posso ajudá-lo hoje?`,
        }
      } else {
        return {
          success: true,
          message: `❌ Email ou código key inválidos.\n\nVerifique se:\n• O email está correto\n• O código key está correto (encontrado em https://plenipay.com/configuracoes)\n• Sua conta está ativa\n\nVamos tentar novamente:\n\n📧 Me envie seu email de cadastro...`,
        }
      }
    } else {
      // Não tem key válida, pedir novamente
      return {
        success: true,
        message: `🔑 Me envie sua chave key agora:\n\n(Encontre seu código key em: https://plenipay.com/configuracoes)`,
      }
    }
  } else {
    // Não tem email pendente, está esperando email
    // Tentar extrair email da mensagem
    let email: string | null = null

    // Tentar extrair email de diferentes formatos
    const emailMatch = trimmedText.match(/(?:email|e-mail|e mail)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (emailMatch) {
      email = emailMatch[1].toLowerCase().trim()
    } else {
      // Se não encontrou no formato, procurar por @ na mensagem
      const atIndex = trimmedText.indexOf('@')
      if (atIndex > 0) {
        // Encontrar início e fim do email
        const beforeAt = trimmedText.substring(0, atIndex).trim()
        const afterAt = trimmedText.substring(atIndex + 1).trim()
        const emailCandidate = `${beforeAt.split(/\s+/).pop()}@${afterAt.split(/\s+/)[0]}`
        
        // Validar formato básico de email
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailCandidate)) {
          email = emailCandidate.toLowerCase()
        }
      }
    }

    if (email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      // Email válido encontrado, salvar e pedir key
      pendingEmails.set(phoneNumber, email)
      console.log('📧 [WhatsApp PLEN] Email recebido, aguardando key:', email)
      return {
        success: true,
        message: `✅ Email recebido: ${email}\n\n🔑 Me envie sua chave key agora:\n\n(Encontre seu código key em: https://plenipay.com/configuracoes)`,
      }
    } else {
      // Não tem email válido, pedir novamente
      return {
        success: true,
        message: `📧 Me envie seu email de cadastro...`,
      }
    }
  }
}

/**
 * Autenticar usuário via WhatsApp usando email e key
 */
async function authenticateWhatsAppUser(
  phoneNumber: string,
  email: string,
  key: string
): Promise<{ success: boolean; nome?: string; userId?: string; error?: string }> {
  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()

    if (!supabaseAdmin) {
      return { success: false, error: 'Erro ao conectar com o banco de dados' }
    }

    // Buscar usuário pelo email e whatsapp_key
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nome, email, whatsapp_key, plano_status')
      .eq('email', email.toLowerCase().trim())
      .eq('whatsapp_key', key.trim())
      .single()

    if (error || !profile) {
      console.log('❌ [WhatsApp PLEN] Autenticação falhou:', error?.message || 'Usuário não encontrado')
      return { success: false, error: 'Email ou código key inválidos' }
    }

    // Verificar se a conta está ativa
    if (profile.plano_status !== 'ativo' && profile.plano_status !== 'trial') {
      return { success: false, error: 'Sua conta não está ativa. Verifique seu plano.' }
    }

    // CRÍTICO: Verificar se já existe outra sessão ativa para este número
    // Se existir, remover a sessão anterior (apenas 1 usuário por número)
    try {
      const { data: existingSession, error: checkError } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('user_id, phone_number')
        .eq('phone_number', phoneNumber)
        .maybeSingle()

      if (existingSession && existingSession.user_id !== profile.id) {
        // Existe sessão de outro usuário, remover antes de criar nova
        console.log('⚠️ [WhatsApp PLEN] Removendo sessão anterior de outro usuário:', {
          phoneNumber,
          oldUserId: existingSession.user_id,
          newUserId: profile.id,
        })
        
        await supabaseAdmin
          .from('whatsapp_sessions')
          .delete()
          .eq('phone_number', phoneNumber)
      }
    } catch (checkErr: any) {
      // Se a tabela não existe, continuar
      if (!checkErr.message?.includes('does not exist') && !checkErr.message?.includes('relation') && checkErr.code !== '42P01') {
        console.error('❌ [WhatsApp PLEN] Erro ao verificar sessão existente:', checkErr)
      }
    }

    // Criar ou atualizar sessão WhatsApp (apenas 1 usuário por número)
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // Sessão válida por 30 dias

      const { error: sessionError } = await supabaseAdmin
        .from('whatsapp_sessions')
        .upsert({
          phone_number: phoneNumber,
          user_id: profile.id,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'phone_number',
        })

      if (sessionError) {
        // Se a tabela não existe, ainda assim autenticar (usuário pode executar SQL depois)
        if (sessionError.message?.includes('does not exist') || sessionError.message?.includes('relation') || sessionError.code === '42P01') {
          console.warn('⚠️ [WhatsApp PLEN] Tabela whatsapp_sessions não existe. Autenticação funcionará, mas sessão não será salva. Execute o SQL ADICIONAR-WHATSAPP-KEY.sql')
          // Continuar mesmo sem salvar sessão
        } else {
          console.error('❌ [WhatsApp PLEN] Erro ao criar sessão:', sessionError)
          return { success: false, error: 'Erro ao criar sessão' }
        }
      }
    } catch (sessionErr: any) {
      // Se a tabela não existe, continuar mesmo assim
      if (sessionErr.message?.includes('does not exist') || sessionErr.message?.includes('relation') || sessionErr.code === '42P01') {
        console.warn('⚠️ [WhatsApp PLEN] Tabela whatsapp_sessions não existe. Execute o SQL ADICIONAR-WHATSAPP-KEY.sql')
      } else {
        console.error('❌ [WhatsApp PLEN] Erro ao criar sessão:', sessionErr)
        return { success: false, error: 'Erro ao criar sessão' }
      }
    }

    console.log('✅ [WhatsApp PLEN] Usuário autenticado com sucesso:', {
      userId: profile.id,
      email: profile.email,
      phoneNumber,
    })

    return {
      success: true,
      nome: profile.nome,
      userId: profile.id,
    }
  } catch (error: any) {
    console.error('❌ [WhatsApp PLEN] Erro ao autenticar:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Processar mensagem com assistente PLEN
 * 
 * IMPORTANTE: Para integrar com PLEN, precisamos chamar a API interna
 * Como estamos em um webhook, vamos fazer uma chamada HTTP interna
 */
async function processWithPLEN(userId: string, text: string, imageBase64?: string) {
  try {
    // Chamar API especial do PLEN para WhatsApp (não precisa autenticação)
    // CRÍTICO: Em ambiente server-side, usar URL absoluta baseada no host da requisição
    // Se não tiver, usar localhost como fallback
    let apiUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    
    // Garantir que tem protocolo
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `http://${apiUrl}`
    }
    
    const url = `${apiUrl}/api/plen/whatsapp-chat`
    
    console.log('📞 [WhatsApp PLEN] ==========================================')
    console.log('📞 [WhatsApp PLEN] CHAMANDO API PLEN WHATSAPP')
    console.log('📞 [WhatsApp PLEN] URL:', url)
    console.log('📞 [WhatsApp PLEN] API URL Base:', apiUrl)
    console.log('📞 [WhatsApp PLEN] User ID:', userId)
    console.log('📞 [WhatsApp PLEN] Text Length:', text.length)
    console.log('📞 [WhatsApp PLEN] Text Preview:', typeof text === 'string' ? text.substring(0, 100) : String(text).substring(0, 100))
    console.log('📞 [WhatsApp PLEN] Has Image:', !!imageBase64)
    console.log('📞 [WhatsApp PLEN] Image Size:', imageBase64 ? imageBase64.length : 0)
    console.log('📞 [WhatsApp PLEN] ==========================================')
    
    // CRÍTICO: Adicionar timeout e melhor tratamento de erros
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: text,
          imageBase64: imageBase64, // Enviar imagem se disponível
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      console.log('📡 [WhatsApp PLEN] Status da resposta:', response.status, response.statusText)

      // Ler resposta como texto primeiro para debug
      const responseText = await response.text()
      console.log('📡 [WhatsApp PLEN] Resposta bruta (primeiros 500 chars):', responseText.substring(0, 500))
      
      let data: any = {}
      try {
        data = JSON.parse(responseText)
        console.log('✅ [WhatsApp PLEN] JSON parseado com sucesso')
      } catch (parseError) {
        console.error('❌ [WhatsApp PLEN] Erro ao fazer parse do JSON:', parseError)
        console.error('❌ [WhatsApp PLEN] Resposta completa:', responseText)
        
        // Se não conseguiu fazer parse mas status é OK, tentar usar texto como resposta
        if (response.ok && responseText.trim()) {
          return {
            success: true,
            message: responseText.substring(0, 1000), // Limitar tamanho
          }
        }
        
        throw new Error(`Resposta inválida da API: ${responseText.substring(0, 200)}`)
      }

      if (!response.ok) {
        console.error('❌ [WhatsApp PLEN] Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          errorData: data,
        })
        
        // CRÍTICO: Mesmo com erro, se tem campo "response", usar ele
        // A API pode retornar status 500 mas ainda ter uma mensagem útil
        if (data.response) {
          console.log('✅ [WhatsApp PLEN] Usando campo response mesmo com erro HTTP')
          return {
            success: true,
            message: data.response,
          }
        }
        
        throw new Error(`API retornou ${response.status}: ${data.error || data.details || 'Erro desconhecido'}`)
      }

      console.log('✅ [WhatsApp PLEN] Resposta recebida:', { 
        hasResponse: !!data.response,
        responseLength: data.response?.length || 0,
        error: data.error || null,
        dataKeys: Object.keys(data),
      })

      // CRÍTICO: Sempre verificar campo "response" primeiro
      if (data.response) {
        console.log('✅ [WhatsApp PLEN] Retornando resposta do campo response')
        return {
          success: true,
          message: data.response,
        }
      }

      // Se veio erro na resposta mas não tem response
      if (data.error) {
        console.error('❌ [WhatsApp PLEN] Erro na resposta:', data.error)
        return {
          success: true,
          message: `❌ Erro: ${data.error}. ${data.details || ''}`,
        }
      }

      // Se não tem response nem error, retornar mensagem padrão
      console.warn('⚠️ [WhatsApp PLEN] Resposta sem campo response nem error')
      return {
        success: true,
        message: 'Desculpe, não consegui processar sua mensagem. Tente novamente.',
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ [WhatsApp PLEN] Timeout ao chamar API PLEN (30 segundos)')
        return {
          success: true,
          message: '⏱️ A requisição demorou muito. Tente novamente em alguns instantes.',
        }
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error('❌ [WhatsApp PLEN] ==========================================')
    console.error('❌ [WhatsApp PLEN] ERRO AO CHAMAR PLEN')
    console.error('❌ [WhatsApp PLEN] Error:', error.message)
    console.error('❌ [WhatsApp PLEN] Stack:', error.stack?.substring(0, 500))
    console.error('❌ [WhatsApp PLEN] Name:', error.name)
    console.error('❌ [WhatsApp PLEN] Code:', error.code)
    console.error('❌ [WhatsApp PLEN] ==========================================')
    
    // CRÍTICO: Sempre retornar uma resposta, mesmo em caso de erro
    return {
      success: true,
      message: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
    }
    
    // Mensagem de erro mais específica
    let errorMessage = 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.'
    
    if (error.message?.includes('usuário') || error.message?.includes('user')) {
      errorMessage = '❌ Para registrar transações, você precisa criar pelo menos um usuário/pessoa primeiro.\n\n📱 Acesse: https://plenipay.com/configuracoes\n\nVá em "Usuários/Pessoas" e clique em "+ Novo Usuário".'
    } else if (error.message?.includes('plano') || error.message?.includes('limite')) {
      errorMessage = `❌ ${error.message}`
    } else if (error.message?.includes('permission') || error.message?.includes('permissão')) {
      errorMessage = '❌ Erro de permissão. Verifique se sua conta está ativa.'
    } else if (error.message) {
      errorMessage = `❌ Erro: ${error.message}`
    }
    
    return {
      success: true,
      message: errorMessage,
    }
  }
}

/**
 * Registrar novo usuário via WhatsApp (se necessário)
 */
export async function registerUserFromWhatsApp(
  phoneNumber: string,
  nome: string,
  email: string
) {
  try {
    const { createClient } = await import('./supabase/server')
    const supabase = await createClient()

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('whatsapp', phoneNumber)
      .single()

    if (existing) {
      return {
        success: true,
        userId: existing.id,
        message: 'Usuário já está cadastrado!',
      }
    }

    // Criar usuário (isso deve ser feito via cadastro normal, mas aqui é só para referência)
    return {
      success: false,
      message: 'Cadastro deve ser feito através do site.',
    }
  } catch (error: any) {
    console.error('❌ [WhatsApp PLEN] Erro ao registrar usuário:', error)
    return {
      success: false,
      message: 'Erro ao processar cadastro.',
    }
  }
}

