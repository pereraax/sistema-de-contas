/**
 * Diagnóstico completo e correção automática do sistema
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApifacilConfig, isApifacilConfigured, checkInstanceStatus, sendTextMessage } from '@/lib/whatsapp-apifacil'
import { getWebhookLogs } from '@/lib/webhook-logs'
import { getSendLogs } from '@/lib/send-logs'

export async function GET() {
  try {
    const config = getApifacilConfig()
    const configured = isApifacilConfigured()
    
    // Verificar status da instância
    let instanceStatus: { success: boolean; connected?: boolean; error?: string } | null = null
    if (configured) {
      instanceStatus = await checkInstanceStatus()
    }
    
    // Verificar logs
    const webhookLogs = getWebhookLogs()
    const sendLogs = getSendLogs()
    
    // Últimos logs
    const lastWebhookLog = webhookLogs[0]
    const lastSendLog = sendLogs[0]
    
    // Análise de problemas
    const problemas: string[] = []
    const solucoes: string[] = []
    
    if (!configured) {
      problemas.push('❌ Apifacil não está configurado')
      solucoes.push('Configure APIFACIL_INSTANCE_ID e APIFACIL_TOKEN nas variáveis de ambiente')
    }
    
    if (configured && instanceStatus && !instanceStatus.connected) {
      problemas.push('⚠️ Instância não está conectada')
      solucoes.push('Verifique se o WhatsApp está conectado no painel do apifacil.dev')
    }
    
    if (webhookLogs.length === 0) {
      problemas.push('⚠️ Nenhum webhook recebido')
      solucoes.push('Verifique se o túnel está rodando e a URL está correta no apifacil.dev')
    }
    
    if (sendLogs.length === 0) {
      problemas.push('⚠️ Nenhuma tentativa de envio registrada')
      solucoes.push('O processamento pode não estar gerando resposta ou o envio não está sendo chamado')
    }
    
    if (lastSendLog && !lastSendLog.success) {
      problemas.push(`❌ Último envio falhou: ${lastSendLog.error || 'Erro desconhecido'}`)
      solucoes.push('Verifique o endpoint de envio do apifacil.dev ou as credenciais')
    }
    
    return NextResponse.json({
      success: true,
      diagnostico: {
        configurado: configured,
        instanciaConectada: instanceStatus?.connected || false,
        totalWebhookLogs: webhookLogs.length,
        totalSendLogs: sendLogs.length,
        ultimoWebhook: lastWebhookLog ? {
          timestamp: lastWebhookLog.timestamp,
          hasBody: !!lastWebhookLog.body,
          bodyKeys: lastWebhookLog.body ? Object.keys(lastWebhookLog.body) : [],
        } : null,
        ultimoEnvio: lastSendLog ? {
          timestamp: lastSendLog.timestamp,
          success: lastSendLog.success,
          error: lastSendLog.error,
          status: lastSendLog.status,
        } : null,
      },
      problemas,
      solucoes,
      config: config ? {
        instanceId: config.instanceId,
        hasToken: !!config.token,
      } : null,
      testeEnvio: {
        instrucoes: 'Para testar o envio, use:',
        endpoint: '/api/whatsapp/apifacil/test-envio-direto',
        exemplo: {
          phoneNumber: '553194467805',
          message: 'Teste de envio direto',
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}








