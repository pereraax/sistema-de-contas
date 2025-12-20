/**
 * Diagnóstico completo do sistema WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWebhookLogs } from '@/lib/webhook-logs'
import { getSendLogs } from '@/lib/send-logs'
import { getApifacilConfig, checkInstanceStatus } from '@/lib/whatsapp-apifacil'

export async function GET() {
  const webhookLogs = getWebhookLogs()
  const sendLogs = getSendLogs()
  const config = getApifacilConfig()
  
  // Verificar status da instância
  let instanceStatus: { success: boolean; connected?: boolean; error?: string } | null = null
  if (config) {
    try {
      instanceStatus = await checkInstanceStatus()
    } catch (error: any) {
      instanceStatus = { success: false, error: error.message }
    }
  }
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    sistema: {
      servidor: 'Online',
      webhookEndpoint: '/api/whatsapp/apifacil/webhook',
    },
    configuracao: {
      apifacilConfigurado: !!config,
      instanceId: config?.instanceId || 'Não configurado',
      token: config?.token ? `${config.token.substring(0, 10)}...` : 'Não configurado',
    },
    statusInstancia: instanceStatus,
    logs: {
      webhook: {
        total: webhookLogs.length,
        ultimos: webhookLogs.slice(0, 3),
      },
      envio: {
        total: sendLogs.length,
        ultimos: sendLogs.slice(0, 3),
      },
    },
    diagnosticos: {
      webhookNaoRecebeu: webhookLogs.length === 0 ? 'Webhook não recebeu nenhuma mensagem ainda' : 'Webhook está recebendo mensagens',
      envioNaoTentou: sendLogs.length === 0 ? 'Nenhuma tentativa de envio registrada' : 'Tentativas de envio registradas',
      configuracaoOk: config ? 'Apifacil configurado' : 'Apifacil NÃO configurado - configure APIFACIL_INSTANCE_ID e APIFACIL_TOKEN',
    },
    instrucoes: {
      passo1: 'Verifique se o túnel está rodando: npm run tunnel',
      passo2: 'Verifique se o servidor está rodando: npm run dev',
      passo3: 'Verifique a URL no painel apifacil.dev: https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook',
      passo4: 'Envie "oi" pelo WhatsApp e verifique os logs novamente',
    }
  })
}








