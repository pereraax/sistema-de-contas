/**
 * Rota de teste para verificar se apifacil.dev está configurado e funcionando
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getApifacilConfig, 
  isApifacilConfigured, 
  checkInstanceStatus,
  sendTextMessage 
} from '@/lib/whatsapp-apifacil'

export async function GET() {
  try {
    console.log('🧪 [Apifacil Test] Iniciando teste...')

    // 1. Verificar se está configurado
    const configured = isApifacilConfigured()
    const config = getApifacilConfig()

    console.log('🔍 [Apifacil Test] Configuração:', {
      configured,
      hasInstanceId: !!config?.instanceId,
      hasToken: !!config?.token,
      instanceId: config?.instanceId,
    })

    if (!configured || !config) {
      return NextResponse.json({
        success: false,
        error: 'Apifacil não está configurado',
        details: {
          hasInstanceId: !!process.env.APIFACIL_INSTANCE_ID,
          hasToken: !!process.env.APIFACIL_TOKEN,
          instanceIdFromEnv: process.env.APIFACIL_INSTANCE_ID || null,
        },
        message: 'Configure APIFACIL_INSTANCE_ID e APIFACIL_TOKEN no .env.local'
      }, { status: 400 })
    }

    // 2. Verificar status da instância
    console.log('📡 [Apifacil Test] Verificando status da instância...')
    const status = await checkInstanceStatus()

    console.log('📡 [Apifacil Test] Status recebido:', status)

    if (!status.success) {
      return NextResponse.json({
        success: false,
        configured: true,
        error: status.error || 'Erro ao verificar status',
        details: {
          instanceId: config.instanceId,
          apiCall: 'checkInstanceStatus',
        }
      }, { status: 500 })
    }

    // 3. Retornar resultado
    return NextResponse.json({
      success: true,
      configured: true,
      connected: status.connected || false,
      message: status.connected 
        ? '✅ Apifacil.dev está configurado e conectado!' 
        : '⚠️ Apifacil.dev está configurado mas não está conectado. Escaneie o QR Code no painel.',
      details: {
        instanceId: config.instanceId,
        tokenLength: config.token.length,
        connected: status.connected,
        apiUrl: 'https://apifacil.dev/api/v1',
      }
    })

  } catch (error: any) {
    console.error('❌ [Apifacil Test] Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao testar apifacil.dev',
      details: {
        errorType: error.constructor.name,
        stack: error.stack?.substring(0, 300),
      }
    }, { status: 500 })
  }
}

/**
 * POST para testar envio de mensagem (opcional, requer número de teste)
 */
export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros "to" e "message" são obrigatórios para teste de envio'
      }, { status: 400 })
    }

    console.log('🧪 [Apifacil Test] Testando envio de mensagem...', { to })

    const result = await sendTextMessage(to, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Mensagem de teste enviada com sucesso!',
        messageId: result.messageId,
        details: {
          to,
          messageLength: message.length,
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'Erro ao enviar mensagem de teste',
      details: {
        to,
        configured: isApifacilConfigured(),
      }
    }, { status: 500 })

  } catch (error: any) {
    console.error('❌ [Apifacil Test] Erro ao testar envio:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao testar envio',
    }, { status: 500 })
  }
}











