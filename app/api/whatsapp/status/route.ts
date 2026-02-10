import { NextResponse } from 'next/server'
import { getApifacilConfig, checkInstanceStatus } from '@/lib/whatsapp-apifacil'

export const dynamic = 'force-dynamic'

/**
 * Status do WhatsApp (Apifacil). A página do admin "WhatsApp - Assistente PLEN" chama esta rota.
 * Sem ela ocorre 404 ao verificar status.
 */
export async function GET() {
  try {
    const config = getApifacilConfig()
    if (!config) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        phoneNumber: null,
        qrCode: null,
        message: 'Apifacil não configurado. Defina APIFACIL_INSTANCE_ID e APIFACIL_TOKEN.',
        error: 'Apifacil não configurado',
      })
    }

    const result = await checkInstanceStatus()
    if (!result.success) {
      return NextResponse.json({
        connected: false,
        status: 'error',
        phoneNumber: null,
        qrCode: null,
        message: result.error || 'Erro ao verificar status',
        error: result.error,
      })
    }

    return NextResponse.json({
      connected: result.connected ?? false,
      status: result.connected ? 'connected' : 'disconnected',
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
      phoneNumber: null,
      qrCode: null,
      message: error?.message || 'Erro ao verificar status',
      error: error?.message || 'Erro desconhecido',
    })
  }
}
