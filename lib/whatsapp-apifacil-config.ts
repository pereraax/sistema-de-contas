/**
 * Funções para configurar webhook no apifacil.dev via API
 */

import { getApifacilConfig } from './whatsapp-apifacil'

const APIFACIL_BASE_URL = 'https://apifacil.dev/api/v1'

/**
 * Configurar webhook no apifacil.dev via API
 */
export async function configurarWebhookApifacil(webhookUrl: string) {
  const config = getApifacilConfig()
  
  if (!config) {
    return {
      success: false,
      error: 'Apifacil não está configurado. Configure APIFACIL_INSTANCE_ID e APIFACIL_TOKEN primeiro.',
    }
  }
  
  try {
    console.log('🔧 [Apifacil Config] Configurando webhook:', {
      instanceId: config.instanceId,
      webhookUrl,
    })
    
    // Tentar diferentes endpoints para configurar webhook
    const endpoints = [
      {
        name: 'PUT /whatsapp/instancia/{id}/webhook',
        url: `${APIFACIL_BASE_URL}/whatsapp/instancia/${config.instanceId}/webhook`,
        method: 'PUT',
        payload: {
          webhook_url: webhookUrl,
          webhook_ativo: true,
        },
      },
      {
        name: 'POST /whatsapp/instancia/{id}/webhook',
        url: `${APIFACIL_BASE_URL}/whatsapp/instancia/${config.instanceId}/webhook`,
        method: 'POST',
        payload: {
          webhook_url: webhookUrl,
          webhook_ativo: true,
        },
      },
      {
        name: 'PUT /whatsapp/configuracao/{id}',
        url: `${APIFACIL_BASE_URL}/whatsapp/configuracao/${config.instanceId}`,
        method: 'PUT',
        payload: {
          webhook_url: webhookUrl,
          webhook_ativo: true,
        },
      },
      {
        name: 'POST /whatsapp/configuracao/{id}/webhook',
        url: `${APIFACIL_BASE_URL}/whatsapp/configuracao/${config.instanceId}/webhook`,
        method: 'POST',
        payload: {
          url: webhookUrl,
          ativo: true,
        },
      },
    ]
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 [Apifacil Config] Tentando endpoint: ${endpoint.name}`)
        
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Authorization': config.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(endpoint.payload),
        })
        
        const responseText = await response.text()
        let responseData: any = {}
        
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText.substring(0, 500) }
        }
        
        console.log(`📡 [Apifacil Config] ${endpoint.name} - Status: ${response.status}`)
        
        if (response.ok) {
          console.log(`✅ [Apifacil Config] Webhook configurado com sucesso via ${endpoint.name}!`)
          return {
            success: true,
            message: 'Webhook configurado com sucesso!',
            data: responseData,
            endpoint: endpoint.name,
          }
        }
        
        // Se não foi sucesso, continuar tentando próximo endpoint
        console.log(`⚠️ [Apifacil Config] ${endpoint.name} falhou: ${response.status}`)
      } catch (endpointError: any) {
        console.error(`❌ [Apifacil Config] Erro ao tentar ${endpoint.name}:`, endpointError.message)
        // Continuar tentando próximo endpoint
      }
    }
    
    // Se nenhum endpoint funcionou
    console.error('❌ [Apifacil Config] Todos os endpoints falharam')
    return {
      success: false,
      error: 'Não foi possível configurar o webhook. Tente configurar manualmente no painel do apifacil.dev',
      instrucoes: {
        passo1: 'Acesse: https://apifacil.dev',
        passo2: `Vá na instância ${config.instanceId}`,
        passo3: 'Clique em "Config. Webhook"',
        passo4: `Cole a URL: ${webhookUrl}`,
        passo5: 'Salve a configuração',
      },
    }
  } catch (error: any) {
    console.error('❌ [Apifacil Config] Erro ao configurar webhook:', error)
    return {
      success: false,
      error: error.message || 'Erro ao configurar webhook',
    }
  }
}

/**
 * Obter configuração atual do webhook
 */
export async function obterConfiguracaoWebhook() {
  const config = getApifacilConfig()
  
  if (!config) {
    return {
      success: false,
      error: 'Apifacil não está configurado',
    }
  }
  
  try {
    // Tentar obter configuração atual
    const url = `${APIFACIL_BASE_URL}/whatsapp/instancia/${config.instanceId}/status`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': config.token,
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const data = await response.json()
      return {
        success: true,
        data,
      }
    }
    
    return {
      success: false,
      error: `Erro ${response.status}: ${response.statusText}`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro ao obter configuração',
    }
  }
}











