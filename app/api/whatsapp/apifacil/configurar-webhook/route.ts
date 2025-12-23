/**
 * API Route para configurar webhook no apifacil.dev via API
 */

import { NextRequest, NextResponse } from 'next/server'
import { configurarWebhookApifacil } from '@/lib/whatsapp-apifacil-config'

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json()
    
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'webhookUrl é obrigatório' },
        { status: 400 }
      )
    }
    
    // Validar URL
    try {
      new URL(webhookUrl)
    } catch {
      return NextResponse.json(
        { success: false, error: 'URL do webhook inválida' },
        { status: 400 }
      )
    }
    
    console.log('🔧 [Apifacil Config Webhook] Configurando webhook:', webhookUrl)
    
    const result = await configurarWebhookApifacil(webhookUrl)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || 'Webhook configurado com sucesso!',
        data: result.data,
        endpoint: result.endpoint,
      })
    }
    
    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Erro ao configurar webhook',
        instrucoes: result.instrucoes,
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [Apifacil Config Webhook] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao configurar webhook',
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Obter configuração atual do webhook
 */
export async function GET() {
  try {
    const { obterConfiguracaoWebhook } = await import('@/lib/whatsapp-apifacil-config')
    
    const result = await obterConfiguracaoWebhook()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      })
    }
    
    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Erro ao obter configuração',
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [Apifacil Config Webhook] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao obter configuração',
      },
      { status: 500 }
    )
  }
}











