/**
 * Cliente Evolution API para Admin PleniPay
 * Gerencia conexões WhatsApp via Evolution API
 */

async function getConfig() {
  // Tentar buscar do banco de dados primeiro
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    const { data } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      return {
        apiUrl: data.evolution_api_url,
        apiKey: data.evolution_api_key,
        instanceName: data.evolution_instance_name,
      }
    }
  } catch (error) {
    // Se não encontrou ou erro, usar variáveis de ambiente
    console.log('⚠️ [WhatsApp Admin] Usando variáveis de ambiente (fallback)')
  }

  // Fallback: variáveis de ambiente
  return {
    apiUrl: process.env.EVOLUTION_API_URL || '',
    apiKey: process.env.EVOLUTION_API_KEY || '',
    instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'plenipay',
  }
}

/**
 * Verificar status da instância
 */
export async function verificarStatusInstancia() {
  const config = await getConfig()
  
  if (!config.apiUrl || !config.apiKey) {
    return {
      error: 'Configuração não encontrada. Configure a Evolution API nas configurações.',
    }
  }

  try {
    const response = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': config.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return {
        error: `Erro ao verificar status: ${error}`,
      }
    }

    const instances = await response.json()
    const instance = instances?.find(
      (inst: any) => inst.instance.instanceName === config.instanceName
    )

    if (!instance) {
      return {
        connected: false,
        status: 'not_found',
        message: 'Instância não encontrada',
      }
    }

    return {
      connected: instance.instance.status === 'open',
      status: instance.instance.status,
      qrCode: instance.instance.qrcode?.base64 || null,
      phoneNumber: instance.instance.phoneNumber || null,
      message: instance.instance.status === 'open' ? 'Conectado' : 'Desconectado',
    }
  } catch (error: any) {
    return {
      error: `Erro ao verificar status: ${error.message}`,
    }
  }
}

/**
 * Criar instância
 */
export async function criarInstancia() {
  const config = await getConfig()
  
  if (!config.apiUrl || !config.apiKey) {
    return {
      error: 'Configuração não encontrada',
    }
  }

  try {
    const response = await fetch(`${config.apiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: config.instanceName,
        token: config.apiKey,
        qrcode: false, // Usar pairing code
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao criar instância' }))
      return {
        error: error.message || 'Erro ao criar instância',
      }
    }

    const data = await response.json()
    return {
      success: true,
      message: 'Instância criada com sucesso!',
      data,
    }
  } catch (error: any) {
    return {
      error: `Erro ao criar instância: ${error.message}`,
    }
  }
}

/**
 * Solicitar pairing code
 */
export async function solicitarPairingCode(phoneNumber: string) {
  const config = await getConfig()
  
  if (!config.apiUrl || !config.apiKey) {
    return {
      error: 'Configuração não encontrada',
    }
  }

  try {
    const response = await fetch(`${config.apiUrl}/instance/pairingCode/${config.instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phoneNumber.replace(/\D/g, ''), // Apenas números
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao solicitar pairing code' }))
      return {
        error: error.message || 'Erro ao solicitar pairing code',
      }
    }

    const data = await response.json()
    return {
      success: true,
      pairingCode: data.pairingCode || data.code,
      message: 'Pairing code solicitado. Verifique seu SMS.',
    }
  } catch (error: any) {
    return {
      error: `Erro ao solicitar pairing code: ${error.message}`,
    }
  }
}

/**
 * Confirmar pairing code
 */
export async function confirmarPairingCode(pairingCode: string) {
  const config = await getConfig()
  
  if (!config.apiUrl || !config.apiKey) {
    return {
      error: 'Configuração não encontrada',
    }
  }

  try {
    const response = await fetch(`${config.apiUrl}/instance/pairingCode/${config.instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: pairingCode,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao confirmar pairing code' }))
      return {
        error: error.message || 'Erro ao confirmar pairing code',
      }
    }

    // Aguardar um pouco e verificar se conectou
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const status = await verificarStatusInstancia()
    
    return {
      success: status.connected || false,
      connected: status.connected || false,
      message: status.connected ? 'WhatsApp conectado com sucesso!' : 'Aguardando conexão...',
    }
  } catch (error: any) {
    return {
      error: `Erro ao confirmar pairing code: ${error.message}`,
    }
  }
}

/**
 * Desconectar/Deletar instância
 */
export async function desconectarInstancia() {
  const config = await getConfig()
  
  if (!config.apiUrl || !config.apiKey) {
    return {
      error: 'Configuração não encontrada',
    }
  }

  try {
    const response = await fetch(`${config.apiUrl}/instance/delete/${config.instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao desconectar' }))
      return {
        error: error.message || 'Erro ao desconectar',
      }
    }

    return {
      success: true,
      message: 'WhatsApp desconectado com sucesso!',
    }
  } catch (error: any) {
    return {
      error: `Erro ao desconectar: ${error.message}`,
    }
  }
}

/**
 * Enviar mensagem via Evolution API
 */
export async function enviarMensagemEvolution(numero: string, mensagem: string) {
  const config = await getConfig()
  
  if (!config.apiUrl || !config.apiKey) {
    return false
  }

  try {
    const response = await fetch(`${config.apiUrl}/message/sendText/${config.instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: numero.replace(/\D/g, ''),
        text: mensagem,
      }),
    })

    if (!response.ok) {
      console.error('❌ [Evolution] Erro ao enviar mensagem:', await response.text())
      return false
    }

    return true
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao enviar mensagem:', error)
    return false
  }
}













