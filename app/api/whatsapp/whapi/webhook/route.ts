import { NextRequest, NextResponse } from 'next/server'
import { configurarWebhook } from '@/lib/whatsapp-whapi'

/**
 * Endpoint para configurar webhook no Whapi.Cloud
 * 
 * O Whapi.Cloud precisa saber para onde enviar as mensagens recebidas.
 * Este endpoint configura a URL do webhook no Whapi.Cloud.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, instanceId, webhookUrl } = body
    
    if (!apiKey || !webhookUrl) {
      return NextResponse.json(
        { error: 'apiKey e webhookUrl são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Validar URL
    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json(
        { error: 'URL do webhook inválida' },
        { status: 400 }
      )
    }
    
    // Configurar temporariamente para esta requisição
    if (apiKey) {
      process.env.WHAPI_API_KEY = apiKey
    }
    if (instanceId) {
      process.env.WHAPI_INSTANCE_ID = instanceId
    }
    
    console.log('🔧 [Whapi] Configurando webhook:', { instanceId, webhookUrl })
    
    const result = await configurarWebhook(webhookUrl)
    
    if (result.error) {
      console.error('❌ [Whapi] Erro ao configurar webhook:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    console.log('✅ [Whapi] Webhook configurado com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: result.message || 'Webhook configurado com sucesso!',
      data: result.data,
    })
  } catch (error: any) {
    console.error('❌ [Whapi] Erro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao configurar webhook' },
      { status: 500 }
    )
  }
}










