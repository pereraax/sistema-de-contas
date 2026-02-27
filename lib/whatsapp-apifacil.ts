/**
 * Integração com apifacil.dev para WhatsApp
 */

export interface ApifacilConfig {
  instanceId: string
  token: string
}

/**
 * Obter configuração do apifacil.dev
 */
export function getApifacilConfig(): ApifacilConfig | null {
  const instanceId = process.env.APIFACIL_INSTANCE_ID
  const token = process.env.APIFACIL_TOKEN

  if (!instanceId || !token) {
    return null
  }

  return {
    instanceId,
    token,
  }
}

/**
 * Verificar se apifacil.dev está configurado
 */
export function isApifacilConfigured(): boolean {
  return getApifacilConfig() !== null
}

/**
 * Enviar mensagem com botões de resposta (reply buttons).
 * Usa o endpoint /enviar-botao da API Fácil (confirmado pelo suporte).
 * Fallback: texto com opções em negrito se o endpoint falhar.
 */
export async function sendReplyButtons(
  phoneNumber: string,
  bodyText: string,
  buttons: { id: string; title: string }[]
): Promise<{ success: boolean; messageId?: string; error?: string; usedFallback?: boolean }> {
  const config = getApifacilConfig()
  if (!config) {
    return { success: false, error: 'Apifacil não está configurado' }
  }
  let cleanPhone = phoneNumber.replace(/\D/g, '')
  if (!cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
    cleanPhone = `55${cleanPhone}`
  }
  const baseUrl = 'https://apifacil.dev/api/v1'

  const urlButtons = `${baseUrl}/whatsapp/enviar-botao`
  const cadastroUrl = 'https://plenipay.com'

  // Conforme documentação API Fácil (enviar-botao):
  // - Botão de resposta: { "id": "...", "text": "..." }
  // - Botão URL (cta_url): { "name": "cta_url", "buttonParamsJson": "{\"display_text\":\"...\",\"url\":\"...\"}" }
  // Payload: telefone, text, buttons, instancia; opcional: title, footer
  const buttonsForApi = buttons.slice(0, 3).map((b) => {
    const idLower = (b.id || '').toLowerCase()
    if (idLower === 'cadastrar') {
      return {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: b.title || 'CADASTRAR',
          url: cadastroUrl,
        }),
      }
    }
    return { id: b.id, text: b.title }
  })

  // Igual ao print: só "Escolha abaixo:" + botões (sem título/rodapé extra)
  const payload = {
    telefone: cleanPhone,
    text: bodyText,
    buttons: buttonsForApi,
    instancia: config.instanceId,
  }
  try {
    const res = await fetch(urlButtons, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: config.token },
      body: JSON.stringify(payload),
    })
    let data: any = {}
    try {
      data = await res.json()
    } catch {
      // resposta não é JSON
    }
    if (res.ok && !data?.error) {
      console.log('✅ [Apifacil] enviar-botao OK, botões enviados para', cleanPhone)
      return { success: true, messageId: data?.data?.notificacao_id ?? data?.data?.id ?? data?.messageId }
    }
    console.warn('⚠️ [Apifacil] enviar-botao falhou. Status:', res.status, 'Resposta:', JSON.stringify(data).slice(0, 300))
  } catch (e) {
    console.warn('⚠️ [Apifacil] Erro ao chamar enviar-botao:', e)
  }

  // Fallback: enviar como texto (opções em negrito)
  console.log('📝 [Apifacil] Usando fallback (texto + negrito) para botões em', cleanPhone)
  const hasCadastrar = buttons.some((b) => (b.id || '').toLowerCase() === 'cadastrar')
  const linkLine = hasCadastrar ? `🔗 Cadastro: ${cadastroUrl}` : ''
  const optionsLine = buttons.length ? `${buttons.map((b) => `*${b.title}*`).join('\n')}` : ''
  const textWithOptions = [bodyText, linkLine, optionsLine].filter((s) => !!s && String(s).trim()).join('\n\n')
  const result = await sendTextMessage(phoneNumber, textWithOptions)
  return { ...result, usedFallback: true }
}

/**
 * Enviar mensagem de texto via apifacil.dev
 */
export async function sendTextMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getApifacilConfig()
    if (!config) {
      return {
        success: false,
        error: 'Apifacil não está configurado',
      }
    }

    // Limpar número de telefone
    let cleanPhone = phoneNumber.replace(/\D/g, '')
    if (!cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
      cleanPhone = `55${cleanPhone}`
    }

    const baseUrl = 'https://apifacil.dev/api/v1'
    const url = `${baseUrl}/whatsapp/enviar-mensagem`

    console.log('📤 [Apifacil] Enviando mensagem:', {
      url,
      phoneNumber: cleanPhone,
      messageLength: message.length,
    })
    
    // Adicionar log ao sistema
    try {
      const { addLog } = await import('@/lib/server-logs')
      addLog('info', `📤 [Apifacil] Enviando mensagem para ${cleanPhone}, Tamanho: ${message.length} caracteres`)
    } catch (e) {
      // Ignorar erro
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.token,
      },
      body: JSON.stringify({
        para: cleanPhone,
        telefone: cleanPhone,
        mensagem: message,
        instancia: config.instanceId,
      }),
    })

    const responseText = await response.text()
    let responseData: any = {}

    try {
      responseData = JSON.parse(responseText)
    } catch {
      // Se não for JSON, usar texto como resposta
      responseData = { text: responseText }
    }

    if (!response.ok) {
      console.error('❌ [Apifacil] Erro ao enviar mensagem:', {
        status: response.status,
        statusText: response.statusText,
        response: responseData,
      })
      return {
        success: false,
        error: responseData.error || responseData.message || `Erro ${response.status}: ${response.statusText}`,
      }
    }

    console.log('✅ [Apifacil] Mensagem enviada com sucesso:', {
      status: response.status,
      response: responseData,
    })
    
    // Adicionar log ao sistema
    try {
      const { addLog } = await import('@/lib/server-logs')
      addLog('info', `✅ [Apifacil] Mensagem enviada com sucesso! Status: ${response.status}, MessageID: ${responseData.id || responseData.messageId || 'N/A'}`)
    } catch (e) {
      // Ignorar erro
    }

    return {
      success: true,
      messageId: responseData.id || responseData.messageId || responseData.message_id,
    }
  } catch (error: any) {
    console.error('❌ [Apifacil] Erro ao enviar mensagem:', error.message)
    return {
      success: false,
      error: error.message || 'Erro ao enviar mensagem',
    }
  }
}

/**
 * Verificar status da instância
 */
export async function checkInstanceStatus(): Promise<{
  success: boolean
  connected?: boolean
  error?: string
}> {
  try {
    const config = getApifacilConfig()
    if (!config) {
      return {
        success: false,
        error: 'Apifacil não está configurado',
      }
    }

    const baseUrl = 'https://apifacil.dev/api/v1'
    const url = `${baseUrl}/whatsapp/instancia/${config.instanceId}/status`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': config.token,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Erro ${response.status}`,
      }
    }

    // Verificar se está conectado
    const connected = 
      data.data?.status_banco === 'connected' || 
      data.data?.tem_qrcode === 0 ||
      data.status === 'connected' ||
      data.connected === true

    return {
      success: true,
      connected,
    }
  } catch (error: any) {
    console.error('❌ [Apifacil] Erro ao verificar status:', error.message)
    return {
      success: false,
      error: error.message || 'Erro ao verificar status',
    }
  }
}

/**
 * Obter URL de mídia
 */
export async function getMediaUrl(
  mediaId: string,
  messageId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const config = getApifacilConfig()
    if (!config) {
      return {
        success: false,
        error: 'Apifacil não está configurado',
      }
    }

    const baseUrl = 'https://apifacil.dev/api/v1'
    const url = `${baseUrl}/whatsapp/media/${mediaId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': config.token,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Erro ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    const mediaUrl = data.url || data.media_url || data.mediaUrl

    if (!mediaUrl) {
      return {
        success: false,
        error: 'URL de mídia não encontrada na resposta',
      }
    }

    return {
      success: true,
      url: mediaUrl,
    }
  } catch (error: any) {
    console.error('❌ [Apifacil] Erro ao obter URL de mídia:', error.message)
    return {
      success: false,
      error: error.message || 'Erro ao obter URL de mídia',
    }
  }
}
