import { NextResponse } from 'next/server'
import { isZapiConfigured, getZapiConfig } from '@/lib/whatsapp-zapi'
import { getApifacilConfig, checkInstanceStatus } from '@/lib/whatsapp-apifacil'

export const dynamic = 'force-dynamic'

/**
 * Status do WhatsApp. Prioridade: Z-API (em uso); fallback Apifacil (legado).
 * A página do admin "WhatsApp - Assistente PLEN" chama esta rota.
 */
export async function GET() {
  try {
    if (isZapiConfigured()) {
      const config = getZapiConfig()
      return NextResponse.json({
        connected: true,
        status: 'connected',
        provider: 'zapi',
        phoneNumber: null,
        qrCode: null,
        message: 'Conectado via Z-API (Assistente PLEN ativo). Webhook: /api/whatsapp/zapi/webhook',
        instanceId: config?.instanceId ? `${config.instanceId.slice(0, 8)}...` : null,
      })
    }

    const config = getApifacilConfig()
    if (!config) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        provider: null,
        phoneNumber: null,
        qrCode: null,
        message: 'Nenhum provedor configurado. Use Z-API: ZAPI_INSTANCE_ID e ZAPI_TOKEN.',
        error: 'Nenhum provedor configurado',
      })
    }

    const result = await checkInstanceStatus()
    if (!result.success) {
      return NextResponse.json({
        connected: false,
        status: 'error',
        provider: 'apifacil',
        phoneNumber: null,
        qrCode: null,
        message: result.error || 'Erro ao verificar status',
        error: result.error,
      })
    }

    return NextResponse.json({
      connected: result.connected ?? false,
      status: result.connected ? 'connected' : 'disconnected',
      provider: 'apifacil',
      phoneNumber: null,
      qrCode: null,
      message: result.connected
        ? 'Conectado via Apifacil (Assistente PLEN ativo)'
        : 'Desconectado. Verifique o painel Apifacil.',
    })
  } catch (error: any) {
    console.error('❌ [API /api/whatsapp/status]', error?.message || error)
    return NextResponse.json({
      connected: false,
      status: 'error',
      provider: null,
      phoneNumber: null,
      qrCode: null,
      message: error?.message || 'Erro ao verificar status',
      error: error?.message || 'Erro desconhecido',
    })
  }
}
