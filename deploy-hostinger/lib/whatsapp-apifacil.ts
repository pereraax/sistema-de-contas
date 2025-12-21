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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.token,
      },
      body: JSON.stringify({
        telefone: cleanPhone,
        mensagem: message,
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
