/**
 * Rota de debug para verificar o que está sendo recebido no webhook
 */

import { NextResponse } from 'next/server'
import { getWebhookLogs } from '@/lib/webhook-logs'

export async function GET() {
  const logs = getWebhookLogs()
  
  // Analisar os logs para encontrar padrões
  const analysis = {
    total: logs.length,
    withMedia: logs.filter(log => {
      const body = log.body || {}
      return !!(
        body.tipo_mensagem === 'image' ||
        body.type === 'image' ||
        body.mimetype?.startsWith('image/') ||
        body.url_media ||
        body.media_url ||
        body.image ||
        body.media_id
      )
    }).length,
    withText: logs.filter(log => {
      const body = log.body || {}
      return !!(body.mensagem || body.message || body.text)
    }).length,
    recent: logs.slice(0, 5).map(log => ({
      timestamp: log.timestamp,
      hasMedia: !!(
        (log.body?.tipo_mensagem === 'image') ||
        (log.body?.type === 'image') ||
        (log.body?.mimetype?.startsWith('image/')) ||
        (log.body?.url_media) ||
        (log.body?.media_url) ||
        (log.body?.image) ||
        (log.body?.media_id)
      ),
      hasText: !!(log.body?.mensagem || log.body?.message || log.body?.text),
      keys: Object.keys(log.body || {}),
      bodyPreview: JSON.stringify(log.body).substring(0, 500),
    })),
  }
  
  return NextResponse.json({
    success: true,
    analysis,
    allLogs: logs,
    info: {
      message: 'Use esta rota para verificar o que está sendo recebido no webhook',
      endpoint: '/api/whatsapp/apifacil/webhook',
    }
  })
}










