import { NextResponse } from 'next/server'
import { isZapiConfigured, getZapiConfig } from '@/lib/whatsapp-zapi'

export const dynamic = 'force-dynamic'

/**
 * Verifica se a Z-API está configurada (para diagnóstico).
 * GET /api/whatsapp/zapi/status
 */
export async function GET() {
  try {
    const config = getZapiConfig()
    if (!config) {
      return NextResponse.json({
        configured: false,
        message: 'Z-API não configurada. Defina ZAPI_INSTANCE_ID e ZAPI_TOKEN no ambiente (Railway ou .env.local).',
        webhookUrl: 'https://plenipay.com/api/whatsapp/zapi/webhook',
      })
    }
    return NextResponse.json({
      configured: true,
      message: 'Z-API configurada. Webhook deve estar em "Ao receber".',
      instanceId: config.instanceId ? `${config.instanceId.slice(0, 8)}...` : null,
      webhookUrl: 'https://plenipay.com/api/whatsapp/zapi/webhook',
    })
  } catch (e: any) {
    return NextResponse.json({
      configured: false,
      message: e?.message || 'Erro ao verificar Z-API',
    }, { status: 500 })
  }
}
