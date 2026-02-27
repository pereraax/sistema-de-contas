/**
 * Handler para processar mensagens WhatsApp e integrar com PLEN
 */

// Armazenar emails pendentes temporariamente (em memória)
// Formato: phoneNumber -> email
const pendingEmails = new Map<string, string>()

// Armazenar assistentes PLEN ativados por número de telefone
// Formato: phoneNumber -> true (se ativado)
const plenActivated = new Map<string, boolean>()

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
  
  // Adicionar log ao sistema
  try {
    const { addLog } = require('@/lib/server-logs')
    addLog('info', `📝 [WhatsApp PLEN] Mensagem enviada registrada: ${phoneNumber}-${message.substring(0, 50)}`)
  } catch (e) {
    // Ignorar erro
  }
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
 * Verificar se a mensagem contém chamada para ativar o assistente PLEN
 */
function isActivationMessage(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  
  const lowerText = text.toLowerCase().trim()
  
  // Palavras-chave para ativar o assistente
  const activationKeywords = [
    'assistente plen',
    'chamar assistente plen',
    'ativar assistente plen',
    'assistente plenipay',
    'chamar plen',
    'ativar plen',
    'plen assistente',
    'quero falar com o assistente',
    'quero falar com plen',
    'preciso do assistente',
    'preciso do plen',
  ]
  
  // Verificar se contém alguma palavra-chave
  for (const keyword of activationKeywords) {
    if (lowerText.includes(keyword)) {
      console.log(`✅ [WhatsApp PLEN] Mensagem de ativação detectada: "${keyword}"`)
      return true
    }
  }
  
  return false
}

/**
 * Verificar se a mensagem contém chamada para desativar o assistente PLEN
 */
async function isDeactivationMessage(text: string): Promise<boolean> {
  if (!text || typeof text !== 'string') {
    console.log('❌ [WhatsApp PLEN] isDeactivationMessage: text inválido')
    process.stdout.write(`\n❌ isDeactivationMessage: text inválido\n`)
    return false
  }
  
  const lowerText = text.toLowerCase().trim()
  console.log(`🔍 [WhatsApp PLEN] isDeactivationMessage: verificando "${lowerText}"`)
  process.stdout.write(`\n🔍 isDeactivationMessage: verificando "${lowerText}"\n`)
  
  // Importar addLog dinamicamente
  const { addLog } = await import('@/lib/server-logs')
  addLog('info', `🔍 [PLEN WhatsApp] Verificando desativação: "${lowerText}"`)
  
  // CRÍTICO: Verificação SIMPLES e DIRETA primeiro (mais comum)
  // "parar assistente plen" - formato exato mais comum
  // Verificar EXATAMENTE primeiro (sem espaços extras)
  const exactMatches = [
    'parar assistente plen',
    'para assistente plen',
    'pare assistente plen',
    'parar assistente plenipay',
    'para assistente plenipay',
    'pare assistente plenipay',
  ]
  
  if (exactMatches.includes(lowerText)) {
    console.log(`🛑 [WhatsApp PLEN] ✅ DESATIVAÇÃO DETECTADA (exato): "${lowerText}"`)
    process.stdout.write(`\n🛑✅ DESATIVAÇÃO DETECTADA (exato): "${lowerText}"\n`)
    addLog('info', `🛑 [PLEN WhatsApp] ✅ DESATIVAÇÃO DETECTADA (exato): "${lowerText}"`)
    return true
  }
  
  // Verificar se CONTÉM a frase (mesmo com texto adicional)
  if (lowerText.includes('parar assistente plen') || 
      lowerText.includes('para assistente plen') ||
      lowerText.includes('pare assistente plen') ||
      lowerText.includes('desativar assistente plen')) {
    console.log(`🛑 [WhatsApp PLEN] ✅ DESATIVAÇÃO DETECTADA (contém): "${lowerText}"`)
    process.stdout.write(`\n🛑✅ DESATIVAÇÃO DETECTADA (contém): "${lowerText}"\n`)
    addLog('info', `🛑 [PLEN WhatsApp] ✅ DESATIVAÇÃO DETECTADA (contém): "${lowerText}"`)
    return true
  }
  
  // Palavras-chave para desativar o assistente (ordem de prioridade: mais específicas primeiro)
  const deactivationKeywords = [
    'parar assistente plen',
    'para assistente plen',
    'desativar assistente plen',
    'parar plen',
    'desativar plen',
    'para plen',
    'silenciar assistente',
    'silenciar plen',
    'pare assistente',
    'pare plen',
    'stop assistente',
    'stop plen',
  ]
  
  // Verificar se contém alguma palavra-chave (busca exata ou parcial)
  for (const keyword of deactivationKeywords) {
    // Verificar se a mensagem contém a palavra-chave completa
    if (lowerText.includes(keyword)) {
      console.log(`🛑 [WhatsApp PLEN] ✅ DESATIVAÇÃO DETECTADA: "${keyword}" na mensagem "${lowerText}"`)
      process.stdout.write(`\n🛑✅ DESATIVAÇÃO DETECTADA: "${keyword}"\n`)
      addLog('info', `🛑 [PLEN WhatsApp] ✅ DESATIVAÇÃO DETECTADA: "${keyword}" na mensagem "${lowerText}"`)
      return true
    }
    
    // Verificar também variações com espaços extras ou sem acentos
    const keywordNormalized = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const textNormalized = lowerText.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    
    if (textNormalized.includes(keywordNormalized)) {
      console.log(`🛑 [WhatsApp PLEN] ✅ DESATIVAÇÃO DETECTADA (normalizada): "${keyword}" na mensagem "${lowerText}"`)
      process.stdout.write(`\n🛑✅ DESATIVAÇÃO DETECTADA (normalizada): "${keyword}"\n`)
      addLog('info', `🛑 [PLEN WhatsApp] ✅ DESATIVAÇÃO DETECTADA (normalizada): "${keyword}" na mensagem "${lowerText}"`)
      return true
    }
  }
  
  // Verificação adicional: procurar por "parar" + "assistente" + "plen" em qualquer ordem
  const hasParar = lowerText.includes('parar') || lowerText.includes('para') || lowerText.includes('pare')
  const hasAssistente = lowerText.includes('assistente')
  const hasPlen = lowerText.includes('plen')

  if (hasParar && hasAssistente && hasPlen) {
    console.log(`🛑 [WhatsApp PLEN] ✅ DESATIVAÇÃO DETECTADA (combinação): "parar assistente plen" na mensagem "${lowerText}"`)
    process.stdout.write(`\n🛑✅ DESATIVAÇÃO DETECTADA (combinação): parar + assistente + plen\n`)
    addLog('info', `🛑 [PLEN WhatsApp] ✅ DESATIVAÇÃO DETECTADA (combinação): "parar assistente plen" na mensagem "${lowerText}"`)
    return true
  }
  // Só logar quando a mensagem parecia poder ser desativação (evita poluir log com "paguei 2.00" etc.)
  if (hasParar || hasAssistente || hasPlen) {
    console.log(`🔍 [WhatsApp PLEN] Não é comando de desativação: "${lowerText}"`)
  }
  return false
}

/**
 * Verificar se o assistente PLEN está ativado para este número
 * Verifica primeiro na memória, depois no banco de dados
 */
async function isPlenActivated(phoneNumber: string): Promise<boolean> {
  // Verificar primeiro na memória (mais rápido)
  const memoryStatus = plenActivated.get(phoneNumber)
  if (memoryStatus !== undefined) {
    return memoryStatus === true
  }

  // Se não está na memória, verificar no banco de dados
  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()

    if (!supabaseAdmin) {
      return false
    }

    const { data: session, error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('plen_activated')
      .eq('phone_number', phoneNumber)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('⚠️ [WhatsApp PLEN] Erro ao buscar status do assistente no banco:', error.message)
      return false
    }

    const dbStatus = session?.plen_activated === true
    
    // Atualizar memória com o status do banco
    plenActivated.set(phoneNumber, dbStatus)
    
    return dbStatus
  } catch (error) {
    console.error('❌ [WhatsApp PLEN] Erro ao verificar status do assistente no banco:', error)
    return false
  }
}

/**
 * Ativar assistente PLEN para este número
 * Atualiza memória e banco de dados
 */
async function activatePlen(phoneNumber: string) {
  plenActivated.set(phoneNumber, true)
  console.log(`✅ [WhatsApp PLEN] Assistente PLEN ativado na memória para: ${phoneNumber}`)
  
  // Atualizar também no banco de dados
  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .update({ 
          plen_activated: true,
          updated_at: new Date().toISOString(),
        })
        .eq('phone_number', phoneNumber)

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ [WhatsApp PLEN] Erro ao atualizar status no banco:', error.message)
      } else {
        console.log(`✅ [WhatsApp PLEN] Assistente PLEN ativado no banco para: ${phoneNumber}`)
      }
    }
  } catch (error) {
    console.error('❌ [WhatsApp PLEN] Erro ao ativar assistente no banco:', error)
  }
}

/**
 * Desativar assistente PLEN para este número
 * Atualiza memória e banco de dados
 */
async function deactivatePlen(phoneNumber: string) {
  plenActivated.set(phoneNumber, false)
  console.log(`🛑 [WhatsApp PLEN] Assistente PLEN desativado na memória para: ${phoneNumber}`)
  
  // Atualizar também no banco de dados
  try {
    const { createAdminClient } = await import('./supabase/server')
    const supabaseAdmin = createAdminClient()

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .update({ 
          plen_activated: false,
          updated_at: new Date().toISOString(),
        })
        .eq('phone_number', phoneNumber)

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ [WhatsApp PLEN] Erro ao atualizar status no banco:', error.message)
      } else {
        console.log(`🛑 [WhatsApp PLEN] Assistente PLEN desativado no banco para: ${phoneNumber}`)
      }
    }
  } catch (error) {
    console.error('❌ [WhatsApp PLEN] Erro ao desativar assistente no banco:', error)
  }
}

/**
 * Processar mensagem recebida do WhatsApp
 */
export async function processWhatsAppMessage(message: WhatsAppMessage) {
  try {
    // Importar addLog dinamicamente
    const { addLog } = await import('@/lib/server-logs')
    
    console.log('🔄 [WhatsApp PLEN] ==========================================')
    console.log('🔄 [WhatsApp PLEN] PROCESSANDO MENSAGEM WHATSAPP')
    console.log('🔄 [WhatsApp PLEN] Message:', JSON.stringify(message, null, 2).substring(0, 500))
    console.log('🔄 [WhatsApp PLEN] ==========================================')
    
    // CRÍTICO: Usar addLog para garantir que aparece no Render
    addLog('info', '🔄 [PLEN WhatsApp] PROCESSANDO MENSAGEM WHATSAPP')
    addLog('info', `🔄 [PLEN WhatsApp] Message: ${JSON.stringify(message, null, 2).substring(0, 200)}`)
    
    const phoneNumber = normalizePhoneNumber(extractPhoneNumber(message.key.remoteJid))
    let text = extractMessageText(message)
    
    console.log('📱 [WhatsApp PLEN] Phone Number (normalizado):', phoneNumber)
    console.log('📱 [WhatsApp PLEN] Text extraído:', text ? text.substring(0, 100) : 'null')
    
    // CRÍTICO: Logar no sistema de logs também
    addLog('info', `📱 [PLEN WhatsApp] Phone Number: ${phoneNumber}`)
    addLog('info', `📱 [PLEN WhatsApp] Text extraído: ${text ? text.substring(0, 100) : 'null'}`)
    
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

    // CRÍTICO: Verificar desativação PRIMEIRO, antes de qualquer outra coisa
    // Isso garante que mesmo usuários autenticados possam desativar
    // VERIFICAÇÃO ULTRA SIMPLES E DIRETA PRIMEIRO (sem await para ser mais rápido)
    const lowerTextForCheck = text.toLowerCase().trim()
    
    // Lista de todas as variações possíveis (exatas e parciais)
    const deactivationPhrases = [
      'parar assistente plen',
      'para assistente plen',
      'pare assistente plen',
      'parar assistente plenipay',
      'para assistente plenipay',
      'pare assistente plenipay',
      'desativar assistente plen',
      'desativar assistente plenipay',
    ]
    
    // Verificar EXATO primeiro
    const exactMatch = deactivationPhrases.includes(lowerTextForCheck)
    
    // Verificar se CONTÉM alguma frase
    const containsMatch = deactivationPhrases.some(phrase => lowerTextForCheck.includes(phrase))
    
    // Verificar combinação de palavras (parar + assistente + plen)
    const hasParar = lowerTextForCheck.includes('parar') || lowerTextForCheck.includes('para') || lowerTextForCheck.includes('pare')
    const hasAssistente = lowerTextForCheck.includes('assistente')
    const hasPlen = lowerTextForCheck.includes('plen')
    const combinationMatch = hasParar && hasAssistente && hasPlen
    
    const quickCheck = exactMatch || containsMatch || combinationMatch
    
    console.log('🔍 [WhatsApp PLEN] ==========================================')
    console.log('🔍 [WhatsApp PLEN] VERIFICANDO DESATIVAÇÃO')
    console.log('🔍 [WhatsApp PLEN] Text original:', text)
    console.log('🔍 [WhatsApp PLEN] Text lower:', lowerTextForCheck)
    console.log('🔍 [WhatsApp PLEN] Exact match:', exactMatch)
    console.log('🔍 [WhatsApp PLEN] Contains match:', containsMatch)
    console.log('🔍 [WhatsApp PLEN] Combination match:', combinationMatch, `(parar: ${hasParar}, assistente: ${hasAssistente}, plen: ${hasPlen})`)
    console.log('🔍 [WhatsApp PLEN] Quick check final:', quickCheck)
    console.log('🔍 [WhatsApp PLEN] ==========================================')
    
    // CRÍTICO: Logar no stdout também
    process.stdout.write('\n')
    process.stdout.write('='.repeat(80) + '\n')
    process.stdout.write('[WhatsApp PLEN] VERIFICANDO DESATIVAÇÃO\n')
    process.stdout.write('[WhatsApp PLEN] Text: ' + text + '\n')
    process.stdout.write('[WhatsApp PLEN] Text lower: ' + lowerTextForCheck + '\n')
    process.stdout.write('[WhatsApp PLEN] Exact match: ' + exactMatch + '\n')
    process.stdout.write('[WhatsApp PLEN] Contains match: ' + containsMatch + '\n')
    process.stdout.write('[WhatsApp PLEN] Combination match: ' + combinationMatch + '\n')
    process.stdout.write('[WhatsApp PLEN] Quick check: ' + quickCheck + '\n')
    process.stdout.write('='.repeat(80) + '\n')
    
    // Se a verificação rápida detectou, desativar IMEDIATAMENTE
    if (quickCheck) {
      await deactivatePlen(phoneNumber)
      console.log('🛑 [WhatsApp PLEN] ==========================================')
      console.log('🛑 [WhatsApp PLEN] ASSISTENTE DESATIVADO (QUICK CHECK) - RETORNANDO IMEDIATAMENTE')
      console.log('🛑 [WhatsApp PLEN] Phone Number:', phoneNumber)
      console.log('🛑 [WhatsApp PLEN] Message:', text)
      console.log('🛑 [WhatsApp PLEN] ==========================================')
      
      // CRÍTICO: Logar no sistema de logs também
      addLog('info', `🛑 [PLEN WhatsApp] ASSISTENTE DESATIVADO (QUICK CHECK) - Phone: ${phoneNumber}, Message: ${text}`)
      
      // CRÍTICO: Logar no stdout também
      process.stdout.write('\n')
      process.stdout.write('='.repeat(80) + '\n')
      process.stdout.write('[WhatsApp PLEN] ✅✅✅ ASSISTENTE DESATIVADO (QUICK CHECK)! ✅✅✅\n')
      process.stdout.write('[WhatsApp PLEN] Phone: ' + phoneNumber + '\n')
      process.stdout.write('[WhatsApp PLEN] Message: ' + text + '\n')
      process.stdout.write('='.repeat(80) + '\n')
      
      return {
        success: true,
        message: `☕ Ok, vou beber um cafezinho enquanto isso! 😊\n\nQuando precisar, é só mandar "chamar assistente plen" que eu já volto! 👋\n\n💤 Estou descansando... zzz`,
      }
    }
    
    // Verificação completa (para outras variações)
    const isDeactivation = await isDeactivationMessage(text)
    console.log('🔍 [WhatsApp PLEN] isDeactivation (completo):', isDeactivation)
    process.stdout.write(`\n🔍 isDeactivation (completo): ${isDeactivation}\n`)
    
    if (isDeactivation) {
      await deactivatePlen(phoneNumber)
      console.log('🛑 [WhatsApp PLEN] ==========================================')
      console.log('🛑 [WhatsApp PLEN] ASSISTENTE DESATIVADO (VERIFICAÇÃO COMPLETA) - RETORNANDO IMEDIATAMENTE')
      console.log('🛑 [WhatsApp PLEN] Phone Number:', phoneNumber)
      console.log('🛑 [WhatsApp PLEN] ==========================================')
      
      // CRÍTICO: Logar no sistema de logs também
      addLog('info', `🛑 [PLEN WhatsApp] ASSISTENTE DESATIVADO (VERIFICAÇÃO COMPLETA) - Phone: ${phoneNumber}, Message: ${text}`)
      
      // CRÍTICO: Logar no stdout também
      process.stdout.write('\n')
      process.stdout.write('='.repeat(80) + '\n')
      process.stdout.write('[WhatsApp PLEN] ✅✅✅ ASSISTENTE DESATIVADO (VERIFICAÇÃO COMPLETA)! ✅✅✅\n')
      process.stdout.write('[WhatsApp PLEN] Phone: ' + phoneNumber + '\n')
      process.stdout.write('[WhatsApp PLEN] Message: ' + text + '\n')
      process.stdout.write('='.repeat(80) + '\n')
      
      return {
        success: true,
        message: `☕ Ok, vou beber um cafezinho enquanto isso! 😊\n\nQuando precisar, é só mandar "chamar assistente plen" que eu já volto! 👋\n\n💤 Estou descansando... zzz`,
      }
    }

    // PRIORIDADE 2a: "Olá! Quero utilizar a Plenipay" — resposta com link completo para cadastro
    const msgUtilizar = text.toLowerCase().trim().replace(/\s+/g, ' ')
    const isQueroUtilizarPlenipay =
      msgUtilizar.includes('quero utilizar a plenipay') ||
      msgUtilizar === 'olá! quero utilizar a plenipay' ||
      msgUtilizar === 'olá quero utilizar a plenipay' ||
      msgUtilizar === 'ola! quero utilizar a plenipay' ||
      msgUtilizar === 'ola quero utilizar a plenipay'

    if (isQueroUtilizarPlenipay) {
      console.log('👋 [WhatsApp PLEN] ==========================================')
      console.log('👋 [WhatsApp PLEN] MENSAGEM "QUERO UTILIZAR A PLENIPAY" DETECTADA!')
      console.log('👋 [WhatsApp PLEN] Text:', text)
      console.log('👋 [WhatsApp PLEN] ==========================================')
      addLog('info', `👋 [PLEN WhatsApp] QUERO UTILIZAR PLENIPAY: ${text}`)

      // Resposta exata: 3 mensagens (como no print).
      // 1) Boas-vindas | 2) Escolha abaixo + botões CADASTRAR / JÁ CADASTREI | 3) Instrução do e-mail.
      return {
        success: true,
        messages: [
          `Oiii 👋💙\nEu sou a Plen, sua assistente financeira 🤖✨\nE eu já estou prontinha pra começar a te ajudar a organizar tudo por aqui!\n\nAntes da gente começar, cria sua conta rapidinho lá no site 🌐\nÉ bem rápido mesmo, prometo! ⏱️💙`,
          {
            type: 'buttons' as const,
            body: 'Escolha abaixo:',
            buttons: [
              { id: 'cadastrar', title: 'CADASTRAR' },
              { id: 'ja_cadastrei', title: 'JÁ CADASTREI' },
            ],
          },
          `Assim que finalizar o cadastro, me envia seu e-mail aqui 📩\nVou verificar tudo certinho e já te liberar pra começar a registrar seus gastos e colocar suas economias em ordem 💸📊✨\n\nEu fico responsável por anotar tudo pra você direto pelo WhatsApp, combinado? 😉`,
        ],
      }
    }

    // PRIORIDADE 2b: Verificar mensagem de boas-vindas "quero começar a usar"
    const welcomeMessage = text.toLowerCase().trim()
    const isWelcomeMessage = 
      welcomeMessage === 'olá! quero começar a usar a plenipay, pode me explicar?' ||
      welcomeMessage === 'olá quero começar a usar a plenipay, pode me explicar?' ||
      welcomeMessage === 'ola! quero começar a usar a plenipay, pode me explicar?' ||
      welcomeMessage === 'ola quero começar a usar a plenipay, pode me explicar?' ||
      welcomeMessage.includes('quero começar a usar a plenipay') ||
      welcomeMessage.includes('quero começar a usar plenipay') ||
      (welcomeMessage.includes('quero começar') && welcomeMessage.includes('plenipay'))
    
    if (isWelcomeMessage) {
      console.log('👋 [WhatsApp PLEN] ==========================================')
      console.log('👋 [WhatsApp PLEN] MENSAGEM DE BOAS-VINDAS DETECTADA!')
      console.log('👋 [WhatsApp PLEN] Text:', text)
      console.log('👋 [WhatsApp PLEN] ==========================================')
      
      addLog('info', `👋 [PLEN WhatsApp] MENSAGEM DE BOAS-VINDAS DETECTADA: ${text}`)
      process.stdout.write(`\n👋 MENSAGEM DE BOAS-VINDAS DETECTADA: ${text}\n`)
      
      // Sem link na mensagem para não mostrar preview. Usuário digita CADASTRAR para receber o link.
      return {
        success: true,
        message: `👋 Oi! Seja bem-vindo(a) à PleniPay

Eu sou a Plen, sua assistente financeira 🤖💙
Estou aqui pra te ajudar a registrar seus gastos e ganhos de forma simples e acompanhar como está o seu controle financeiro no dia a dia, sem planilhas e sem complicação.

✨ Você pode começar gratuitamente agora mesmo
👉 Digite *CADASTRAR* que eu te mando o link do site

Depois do cadastro, é só me mandar mensagens pelo WhatsApp que eu te ajudo a registrar tudo de forma rápida e organizada 📊💬

Se tiver qualquer dúvida, pode falar comigo por aqui. E, se precisar, eu chamo nosso suporte humano pra te ajudar 😉

Pronto(a) pra começar? Digite *CADASTRAR* ou *JÁ CADASTREI* se já criou a conta. 🚀`,
      }
    }
    
    // CRÍTICO: Verificar contexto do usuário PRIMEIRO para que qualquer contato novo receba resposta
    // (pedindo email/key). Antes checávamos isPlenActivated antes de getUserContext, e novos
    // contatos nunca chegavam ao fluxo de autenticação.
    console.log('🔍 [WhatsApp PLEN] Buscando contexto do usuário...')
    const userContext = await getUserContext(phoneNumber)
    console.log('👤 [WhatsApp PLEN] ==========================================')
    console.log('👤 [WhatsApp PLEN] CONTEXTO DO USUÁRIO')
    console.log('👤 [WhatsApp PLEN] Registered:', userContext.registered)
    console.log('👤 [WhatsApp PLEN] WhatsApp Authenticated:', userContext.whatsappAuthenticated)
    console.log('👤 [WhatsApp PLEN] User ID:', userContext.userId)
    console.log('👤 [WhatsApp PLEN] Phone Number:', phoneNumber)
    console.log('👤 [WhatsApp PLEN] ==========================================')

    // Contato novo ou não autenticado: responder sempre com fluxo de email/key
    if (!userContext.whatsappAuthenticated) {
      console.log('📧 [WhatsApp PLEN] Contato não autenticado - iniciando fluxo de email/key')
      const authResult = await handleWhatsAppAuthentication(phoneNumber, text, userContext)
      console.log('📤 [WhatsApp PLEN] Resultado da autenticação:', authResult ? `success: ${authResult.success}` : 'null')
      return authResult
    }

    // A partir daqui: usuário já está autenticado via WhatsApp
    const isActivated = await isPlenActivated(phoneNumber)
    const isActivation = isActivationMessage(text)
    
    console.log('🔍 [WhatsApp PLEN] Verificando status do assistente (usuário autenticado):', {
      phoneNumber,
      isActivated,
      isActivation,
    })
    
    // Se é mensagem de ativação, ativar o assistente e dar boas-vindas
    if (isActivation) {
      await activatePlen(phoneNumber)
      console.log('✅ [WhatsApp PLEN] Assistente ativado! Respondendo com mensagem de boas-vindas')
      return {
        success: true,
        message: `👋 Olá! Eu sou o PLEN, seu assistente financeiro pessoal! 😊\n\nEstou aqui para tornar o controle das suas finanças mais simples e organizado. Você pode falar comigo de forma natural, como se estivesse conversando com um amigo!\n\n💼 O que eu posso fazer por você:\n\n📝 REGISTRAR:\n• Gastos: "paguei 50 reais no mercado"\n• Entradas: "recebi 1000 reais"\n• Dívidas: "tenho uma dívida de 200 reais"\n• Salários: "meu salário é 3000 reais"\n\n📊 CONSULTAR:\n• "quais são minhas dívidas?"\n• "quanto gastei na semana?"\n• "quanto gastei no mês?"\n• "quanto tenho de saldo?"\n• "quanto recebi este mês?"\n\n📈 RELATÓRIOS:\n• "me mostre o relatório"\n• "quero ver meu relatório financeiro"\n• "mostre meu resumo do mês"\n• "como estão minhas finanças?"\n\n💡 Como eu entendo você:\n\nVocê pode falar de forma natural! Por exemplo:\n• "gastei 30 reais de ônibus hoje"\n• "paguei 150 reais de conta de luz"\n• "recebi 500 reais do cliente"\n• "tenho uma dívida de 2000 no cartão"\n\nEu entendo diferentes formas de falar e vou organizar tudo para você! 🎯\n\nPronto para começar! Envie algo como "gastei 50 reais no mercado" ou "quanto gastei no mês?"`,
      }
    }
    
    // Autenticado mas assistente não ativado: pedir "Assistente PLEN"
    if (!isActivated) {
      console.log('⚠️ [WhatsApp PLEN] Assistente não está ativado (usuário autenticado) - enviando instrução')
      return {
        success: true,
        message: '👋 Você já está autenticado! Para usar o assistente financeiro, envie:\n\n**Assistente PLEN**\n\nAssim você poderá registrar gastos, consultar saldo e muito mais!',
      }
    }

    // Se está autenticado e assistente ativado, verificar se assistente continua ativado (redundante mas seguro)
    // NOTA: Não ativamos automaticamente aqui porque o usuário pode ter desativado explicitamente
    // A ativação automática só acontece após autenticação bem-sucedida (no handleWhatsAppAuthentication)
    if (!(await isPlenActivated(phoneNumber))) {
      console.log('⚠️ [WhatsApp PLEN] Assistente não está ativado para usuário autenticado - enviando instrução')
      return {
        success: true,
        message: '👋 Você já está autenticado! Para usar o assistente financeiro, envie:\n\n**Assistente PLEN**\n\nAssim você poderá registrar gastos, consultar saldo e muito mais.',
      }
    }
    
    // Processar com assistente PLEN
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
    
    // Se não retornou resultado válido, devolver mensagem útil (nunca genérica)
    if (!plenResult || !plenResult.success || !plenResult.message) {
      console.error('❌ [WhatsApp PLEN] RESULTADO INVÁLIDO DO PLEN:', plenResult === null ? 'null' : JSON.stringify(plenResult).slice(0, 300))
      try {
        const { plenWhatsAppLog } = await import('@/lib/plen-whatsapp-logs')
        plenWhatsAppLog({
          step: 'invalid_result',
          userId: userContext.userId ?? undefined,
          message: text.substring(0, 200),
          plenResult: plenResult ?? undefined,
          error: 'Resultado null ou sem success/message',
        })
      } catch (_) {}
      const fallback = (plenResult?.message && String(plenResult.message).trim()) || 'Erro: resultado inválido do assistente (sem mensagem).'
      return { success: true, message: fallback }
    }
    
    console.log('✅ [WhatsApp PLEN] Resultado válido, retornando resposta')
    
    // Adicionar log ao sistema
    try {
      const { addLog } = await import('@/lib/server-logs')
      addLog('info', `✅ [WhatsApp PLEN] Resultado válido, retornando resposta - Success: ${plenResult?.success}, HasMessage: ${!!plenResult?.message}`)
    } catch (e) {
      // Ignorar erro de importação
    }
    
    return plenResult
  } catch (error: any) {
    const errMsg = error?.message ?? String(error)
    console.error('❌ [WhatsApp PLEN] ERRO AO PROCESSAR MENSAGEM:', errMsg)
    console.error('❌ [WhatsApp PLEN] Stack:', error?.stack?.substring(0, 400))
    return {
      success: true,
      message: `Erro: ${errMsg}`,
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
 * Normalizar número para formato único (DDI 55 + DDD + número).
 * Garante que 11999999999 e 5511999999999 sejam tratados como o mesmo contato.
 */
function normalizePhoneNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits.length) return phone
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits
  return digits
}

/**
 * Extrair texto da mensagem
 */
function extractMessageText(message: WhatsAppMessage): string {
  // CRÍTICO: Logar para debug
  console.log('🔍 [WhatsApp PLEN] Extraindo texto da mensagem:', {
    hasConversation: !!message.message?.conversation,
    hasExtendedText: !!message.message?.extendedTextMessage?.text,
    messageKeys: message.message ? Object.keys(message.message) : [],
  })
  
  if (message.message?.conversation) {
    const text = message.message.conversation
    console.log('✅ [WhatsApp PLEN] Texto extraído de conversation:', text.substring(0, 100))
    return text
  }
  
  if (message.message?.extendedTextMessage?.text) {
    const text = message.message.extendedTextMessage.text
    console.log('✅ [WhatsApp PLEN] Texto extraído de extendedTextMessage:', text.substring(0, 100))
    return text
  }
  
  // Tentar extrair de outros campos possíveis
  const messageObj = message.message as any
  if (messageObj?.text) {
    console.log('✅ [WhatsApp PLEN] Texto extraído de text:', messageObj.text.substring(0, 100))
    return messageObj.text
  }
  
  if (messageObj?.body) {
    console.log('✅ [WhatsApp PLEN] Texto extraído de body:', messageObj.body.substring(0, 100))
    return messageObj.body
  }
  
  console.log('⚠️ [WhatsApp PLEN] Nenhum texto encontrado na mensagem')
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

    // Sem sessão: verificar se o número pertence a um usuário com PLEN ativado pelo admin
    try {
      const { data: profilesWithPlenAdmin } = await supabaseAdmin
        .from('profiles')
        .select('id, nome, email, telefone, whatsapp, plen_activated_by_admin')
        .eq('plen_activated_by_admin', true)

      if (profilesWithPlenAdmin && profilesWithPlenAdmin.length > 0) {
        const normalizedIncoming = normalizePhoneNumber(phoneNumber)
        const digitsIncoming = (normalizedIncoming || '').replace(/\D/g, '')
        for (const p of profilesWithPlenAdmin as any[]) {
          const tel = (p.telefone || '').replace(/\D/g, '')
          const wa = (p.whatsapp || '').replace(/\D/g, '')
          const matchTel = tel.length >= 10 && (digitsIncoming === tel || digitsIncoming === `55${tel}` || tel === digitsIncoming || tel === digitsIncoming.slice(-10) || tel === digitsIncoming.slice(-11))
          const matchWa = wa.length >= 10 && (digitsIncoming === wa || digitsIncoming === `55${wa}` || wa === digitsIncoming || wa === digitsIncoming.slice(-10) || wa === digitsIncoming.slice(-11))
          if (matchTel || matchWa) {
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 365)
            await supabaseAdmin.from('whatsapp_sessions').upsert({
              phone_number: phoneNumber,
              user_id: p.id,
              plen_activated: true,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'phone_number' })
            plenActivated.set(phoneNumber, true)
            console.log('✅ [WhatsApp PLEN] Usuário identificado por cadastro (PLEN ativado pelo admin):', { userId: p.id, phoneNumber })
            return {
              userId: p.id,
              phoneNumber,
              nome: p.nome,
              email: p.email,
              registered: true,
              whatsappAuthenticated: true,
            }
          }
        }
      }
    } catch (adminPlenErr: any) {
      if (adminPlenErr?.message?.includes('plen_activated_by_admin') || adminPlenErr?.code === '42703') {
        // Coluna não existe, ignorar
      } else {
        console.warn('⚠️ [WhatsApp PLEN] Erro ao verificar PLEN ativado por admin:', adminPlenErr?.message)
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

  // Botão "JÁ CADASTREI" — usuário avisou que já se cadastrou; pedir e-mail
  if (lowerText === 'já cadastrei' || lowerText === 'ja cadastrei' || lowerText === 'já cadastrei.' || lowerText === 'ja cadastrei.' || lowerText.includes('já cadastrei') || lowerText.includes('ja cadastrei')) {
    return {
      success: true,
      message: `📩 Beleza! Agora me envia seu *e-mail* de cadastro aqui que eu verifico e já te libero pra usar tudo pelo WhatsApp. 💙`,
    }
  }

  // Botão "CADASTRAR" — enviar como botão que abre o link (Z-API) ou texto com link (fallback)
  if (lowerText === 'cadastrar') {
    return {
      success: true,
      messages: [
        {
          type: 'button_actions' as const,
          body: '👉 Abra o site para cadastro abaixo. Depois que criar a conta, digite *JÁ CADASTREI* aqui que eu peço seu e-mail pra liberar. 🚀',
          buttonActions: [{ type: 'URL' as const, url: 'https://plenipay.com', label: 'Abrir site de cadastro' }],
        },
      ],
    }
  }

  // Verificar se é primeira mensagem (oi, olá, etc)
  if (lowerText === 'oi' || lowerText === 'olá' || lowerText === 'ola' || lowerText === 'hello' || lowerText === 'hi' || lowerText === 'bom dia' || lowerText === 'boa tarde' || lowerText === 'boa noite') {
    // Limpar qualquer email pendente anterior
    pendingEmails.delete(phoneNumber)
    return {
      success: true,
      message: `👋 Olá! Eu sou o PLEN, seu assistente financeiro pessoal! 😊\n\nEstou aqui para tornar o controle das suas finanças mais simples e organizado. Você pode falar comigo de forma natural, como se estivesse conversando com um amigo!\n\n💼 O que eu posso fazer por você:\n\n📝 REGISTRAR:\n• Gastos: "paguei 50 reais no mercado"\n• Entradas: "recebi 1000 reais"\n• Dívidas: "tenho uma dívida de 200 reais"\n• Salários: "meu salário é 3000 reais"\n\n📊 CONSULTAR:\n• "quais são minhas dívidas?"\n• "quanto gastei na semana?"\n• "quanto gastei no mês?"\n• "quanto tenho de saldo?"\n• "quanto recebi este mês?"\n\n📈 RELATÓRIOS:\n• "me mostre o relatório"\n• "quero ver meu relatório financeiro"\n• "mostre meu resumo do mês"\n• "como estão minhas finanças?"\n\n💡 Como eu entendo você:\n\nVocê pode falar de forma natural! Por exemplo:\n• "gastei 30 reais de ônibus hoje"\n• "paguei 150 reais de conta de luz"\n• "recebi 500 reais do cliente"\n• "tenho uma dívida de 2000 no cartão"\n\nEu entendo diferentes formas de falar e vou organizar tudo para você! 🎯\n\n📧 Para começar, me envie seu email de cadastro para eu identificar sua conta...`,
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
        // Ativar assistente automaticamente após autenticação bem-sucedida
        await activatePlen(phoneNumber)
        console.log('✅ [WhatsApp PLEN] Assistente ativado automaticamente após autenticação')
        
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
    }

    // Parece pergunta sobre o produto (preço, como funciona, etc.) — responder com IA
    const parecePergunta =
      trimmedText.includes('?') ||
      /quanto|qual valor|como funciona|custa|paga|preço|preco|valor|planos|assinatura|grátis|gratis|cadastr|fulano|me deve|vai me pagar/i.test(trimmedText) ||
      (trimmedText.length > 15 && !trimmedText.includes('@'))
    if (parecePergunta) {
      try {
        const { getPlenLLMResponse } = await import('@/lib/plen-llm-fallback')
        const llmReply = await getPlenLLMResponse({
          userMessage: trimmedText,
          context: 'O usuário ainda não está logado. Está perguntando sobre a PleniPay (preços, como funciona, etc.).',
          productMode: true,
        })
        if (llmReply && llmReply.trim()) {
          return { success: true, message: llmReply.trim() }
        }
      } catch (_) {}
    }

    return {
      success: true,
      message: `📧 Me envie seu email de cadastro para eu te liberar aqui no WhatsApp. Se tiver dúvidas sobre planos ou como funciona, pode perguntar! 💙`,
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
          plen_activated: true, // Ativar automaticamente após autenticação bem-sucedida
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
 * Chamada direta à lógica (sem fetch), para não depender de URL ou rede.
 */
async function processWithPLEN(userId: string, text: string, imageBase64?: string) {
  try {
    const { addLog } = await import('@/lib/server-logs')
    
    // Verificar desativação antes de processar
    if (text && typeof text === 'string') {
      const msgLower = text.toLowerCase().trim()
      const isDeactivation = 
        msgLower === 'parar assistente plen' ||
        msgLower === 'para assistente plen' ||
        msgLower === 'pare assistente plen' ||
        msgLower.includes('parar assistente plen') ||
        msgLower.includes('para assistente plen') ||
        msgLower.includes('desativar assistente plen') ||
        (msgLower.includes('parar') && msgLower.includes('assistente') && msgLower.includes('plen')) ||
        (msgLower.includes('para') && msgLower.includes('assistente') && msgLower.includes('plen'))
      
      if (isDeactivation) {
        console.log('🛑 [WhatsApp PLEN] DESATIVAÇÃO DETECTADA')
        addLog('info', `🛑 [PLEN WhatsApp] DESATIVAÇÃO: ${text}`)
        return {
          success: true,
          message: `☕ Ok, vou beber um cafezinho enquanto isso! 😊\n\nQuando precisar, é só mandar "chamar assistente plen" que eu já volto! 👋\n\n💤 Estou descansando... zzz`,
        }
      }
    }
    
    // Chamada direta (sem HTTP): não depende de NEXT_PUBLIC_SITE_URL nem da rota estar acessível
    const { processPlenWhatsAppMessage } = await import('@/lib/plen-whatsapp-chat')
    const result = await processPlenWhatsAppMessage(userId, text)
    
    console.log('✅ [WhatsApp PLEN] Resposta direta:', result.response?.substring(0, 80))
    addLog('info', `✅ [PLEN WhatsApp] Resposta: ${result.response?.substring(0, 100)}`)
    
    return {
      success: true,
      message: result.response,
    }
  } catch (error: any) {
    const errMsg = error?.message ?? String(error)
    console.error('❌ [WhatsApp PLEN] ERRO:', errMsg)
    console.error('❌ [WhatsApp PLEN] Stack:', error?.stack?.substring(0, 400))
    
    try {
      const { plenWhatsAppLog } = await import('@/lib/plen-whatsapp-logs')
      plenWhatsAppLog({
        step: 'error',
        userId,
        message: text?.substring(0, 200),
        error: errMsg,
      })
    } catch (_) {}
    
    // Sempre devolver o erro REAL para o usuário ver no WhatsApp e descobrirmos a causa
    return {
      success: true,
      message: `Erro: ${errMsg}`,
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

