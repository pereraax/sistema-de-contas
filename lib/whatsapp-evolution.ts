/**
 * Cliente Evolution API - WhatsApp Assistant PLEN
 * Conecta com Evolution API para gerenciar WhatsApp
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'PLEN_SECRET_KEY_2024'
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'plen-assistant'

interface EvolutionResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * Criar instância no Evolution API
 */
export async function createInstance() {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName: INSTANCE_NAME,
        token: EVOLUTION_API_KEY,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: {
          url: process.env.EVOLUTION_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/api/whatsapp/webhook`,
          webhook_by_events: false,
          webhook_base64: false,
          events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
        },
      }),
    })

    const data = await response.json()
    
    if (response.ok && data.instance) {
      return {
        success: true,
        qrCode: data.instance.qrcode?.base64 || null,
        instance: data.instance,
      }
    }

    return {
      success: false,
      error: data.message || 'Erro ao criar instância',
    }
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao criar instância:', error)
    return {
      success: false,
      error: error.message || 'Erro ao criar instância',
    }
  }
}

/**
 * Conectar instância (gerar QR Code)
 */
export async function connectInstance() {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    })

    const data = await response.json()
    
    if (response.ok) {
      return {
        success: true,
        qrCode: data.qrcode?.base64 || data.qrcode?.code || null,
        status: data.instance?.state || 'unknown',
      }
    }

    return {
      success: false,
      error: data.message || 'Erro ao conectar instância',
    }
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao conectar instância:', error)
    return {
      success: false,
      error: error.message || 'Erro ao conectar instância',
    }
  }
}

/**
 * Verificar status da instância
 */
export async function getInstanceStatus() {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    })

    const data = await response.json()
    
    if (response.ok && Array.isArray(data)) {
      const instance = data.find((inst: any) => inst.instanceName === INSTANCE_NAME)
      
      if (instance) {
        return {
          success: true,
          connected: instance.state === 'open',
          status: instance.state || 'unknown',
          phoneNumber: instance.owner || null,
        }
      }
    }

    return {
      success: false,
      connected: false,
      status: 'not_found',
      phoneNumber: null,
    }
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao verificar status:', error)
    return {
      success: false,
      connected: false,
      status: 'error',
      phoneNumber: null,
    }
  }
}

/**
 * Enviar mensagem de texto
 */
export async function sendTextMessage(to: string, message: string) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: to, // Formato: 5511999999999@c.us
        textMessage: {
          text: message,
        },
      }),
    })

    const data = await response.json()
    
    if (response.ok) {
      return {
        success: true,
        messageId: data.key?.id || null,
      }
    }

    return {
      success: false,
      error: data.message || 'Erro ao enviar mensagem',
    }
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao enviar mensagem:', error)
    return {
      success: false,
      error: error.message || 'Erro ao enviar mensagem',
    }
  }
}

/**
 * Desconectar instância
 */
export async function disconnectInstance() {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${INSTANCE_NAME}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    })

    if (response.ok) {
      return { success: true }
    }

    const data = await response.json()
    return {
      success: false,
      error: data.message || 'Erro ao desconectar',
    }
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao desconectar:', error)
    return {
      success: false,
      error: error.message || 'Erro ao desconectar',
    }
  }
}

/**
 * Deletar instância
 */
export async function deleteInstance() {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${INSTANCE_NAME}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    })

    if (response.ok) {
      return { success: true }
    }

    const data = await response.json()
    return {
      success: false,
      error: data.message || 'Erro ao deletar instância',
    }
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao deletar instância:', error)
    return {
      success: false,
      error: error.message || 'Erro ao deletar instância',
    }
  }
}












