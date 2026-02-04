/**
 * Integração com Whapi.Cloud - WhatsApp API simplificada
 * 
 * Documentação: https://docs.whapi.cloud
 */

// Whapi.Cloud usa uma estrutura diferente - vamos usar a API correta
// Base URL pode variar, mas geralmente é: https://gate.whapi.cloud
const WHAPI_BASE_URL = process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud'
const WHAPI_API_KEY = process.env.WHAPI_API_KEY || ''
const WHAPI_INSTANCE_ID = process.env.WHAPI_INSTANCE_ID || 'default'

/**
 * Obter status da conexão WhatsApp
 */
export async function getWhapiStatus() {
  if (!WHAPI_API_KEY) {
    return { error: 'WHAPI_API_KEY não configurada' }
  }

  try {
    // Whapi.Cloud API - verificar status da instância
    const response = await fetch(`${WHAPI_BASE_URL}/instances/${WHAPI_INSTANCE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Se instância não existe, não é erro crítico
      if (response.status === 404) {
        return { connected: false, status: 'not_found', qr: null }
      }
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      return { error: error.message || 'Erro ao buscar status' }
    }

    const data = await response.json()
    
    // Whapi pode retornar status diferente, ajustar conforme documentação
    const isConnected = data.state === 'open' || data.status === 'open' || data.connected === true
    
    return {
      connected: isConnected,
      status: data.state || data.status || 'unknown',
      qr: data.qr?.base64 || data.qr || null,
      instance: data,
    }
  } catch (error: any) {
    return { error: error.message || 'Erro ao conectar com Whapi' }
  }
}

/**
 * Conectar WhatsApp (criar instância se não existir)
 */
export async function connectWhapi() {
  if (!WHAPI_API_KEY) {
    return { error: 'WHAPI_API_KEY não configurada' }
  }

  try {
    // Verificar se instância já existe
    const status = await getWhapiStatus()
    
    if (status.connected) {
      return { success: true, message: 'Já está conectado!', qr: null }
    }

    // Se não existe ou não está conectado, tentar conectar
    if (!status.connected) {
      // Tentar obter QR Code para conectar (endpoint correto: /instance/{id}/qr)
      const qrResponse = await fetch(`${WHAPI_BASE_URL}/instance/${WHAPI_INSTANCE_ID}/qr`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WHAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (!qrResponse.ok) {
        // Se instância não existe, criar primeiro
        if (qrResponse.status === 404) {
          const createResponse = await fetch(`${WHAPI_BASE_URL}/instances`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WHAPI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: WHAPI_INSTANCE_ID,
              type: 'whatsapp',
            }),
          })

          if (!createResponse.ok) {
            const error = await createResponse.json().catch(() => ({ message: 'Erro ao criar instância' }))
            return { error: error.message || 'Erro ao criar instância' }
          }
          
          // Após criar, tentar conectar novamente
          const retryQrResponse = await fetch(`${WHAPI_BASE_URL}/instances/${WHAPI_INSTANCE_ID}/connect`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${WHAPI_API_KEY}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (!retryQrResponse.ok) {
            const error = await retryQrResponse.json().catch(() => ({ message: 'Erro ao obter QR Code' }))
            return { error: error.message || 'Erro ao obter QR Code' }
          }
          
          const qrData = await retryQrResponse.json()
          return {
            success: true,
            qr: qrData.qr?.base64 || qrData.qr || qrData.data?.qr,
            message: 'QR Code gerado! Escaneie com seu WhatsApp.',
          }
        }
        
        const error = await qrResponse.json().catch(() => ({ message: 'Erro ao obter QR Code' }))
        return { error: error.message || 'Erro ao obter QR Code' }
      }

      const qrData = await qrResponse.json()
      
      return {
        success: true,
        qr: qrData.qr?.base64 || qrData.qr || qrData.data?.qr,
        message: 'QR Code gerado! Escaneie com seu WhatsApp.',
      }
    }
    
    // Já está conectado
    return {
      success: true,
      message: 'Já está conectado!',
      qr: null,
    }
  } catch (error: any) {
    return { error: error.message || 'Erro ao conectar' }
  }
}

/**
 * Enviar mensagem via Whapi
 */
export async function enviarMensagemWhapi(numero: string, mensagem: string) {
  if (!WHAPI_API_KEY) {
    console.error('❌ [Whapi] API Key não configurada')
    return false
  }

  // Limpar e formatar número
  const numeroLimpo = numero.replace(/\D/g, '')
  const numeroFormatado = numeroLimpo.includes('@') 
    ? numeroLimpo 
    : `${numeroLimpo}@s.whatsapp.net`

  try {
    const response = await fetch(`${WHAPI_BASE_URL}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: numeroFormatado,
        body: mensagem,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao enviar' }))
      console.error('❌ [Whapi] Erro ao enviar mensagem:', error)
      return false
    }

    console.log('✅ [Whapi] Mensagem enviada com sucesso')
    return true
  } catch (error: any) {
    console.error('❌ [Whapi] Erro ao enviar mensagem:', error)
    return false
  }
}

/**
 * Configurar webhook no Whapi
 * Whapi.Cloud usa o formato: POST /instance/{id}/webhook
 * Body: { url: string, events: string[] }
 */
export async function configurarWebhook(webhookUrl: string) {
  if (!WHAPI_API_KEY) {
    return { error: 'WHAPI_API_KEY não configurada' }
  }

  try {
    // Whapi.Cloud espera o formato correto
    const response = await fetch(`${WHAPI_BASE_URL}/instance/${WHAPI_INSTANCE_ID}/webhook`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ['messages.post', 'statuses.post'], // Eventos que o Whapi envia
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao configurar webhook' }))
      return { error: error.message || 'Erro ao configurar webhook' }
    }

    const data = await response.json()
    return { success: true, message: 'Webhook configurado com sucesso!', data }
  } catch (error: any) {
    return { error: error.message || 'Erro ao configurar webhook' }
  }
}

/**
 * Obter configurações atuais da instância
 */
export async function obterConfiguracoes() {
  if (!WHAPI_API_KEY) {
    return { error: 'WHAPI_API_KEY não configurada' }
  }

  try {
    const response = await fetch(`${WHAPI_BASE_URL}/instance/${WHAPI_INSTANCE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${WHAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao buscar configurações' }))
      return { error: error.message || 'Erro ao buscar configurações' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message || 'Erro ao buscar configurações' }
  }
}













