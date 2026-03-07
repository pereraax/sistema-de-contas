import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'

/**
 * Sincronização WhatsApp: com Z-API as mensagens chegam apenas via webhook.
 * Não há API de histórico como na Evolution; use o webhook configurado na Z-API.
 */
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    return NextResponse.json({
      ok: false,
      error: 'Com Z-API as conversas e mensagens são registradas automaticamente pelo webhook. Não há sincronização de histórico. Configure o webhook na Z-API: Ao receber → https://SEU_DOMINIO/api/whatsapp/zapi/webhook',
    }, { status: 400 })
  } catch (e: unknown) {
    const err = e as Error
    console.error('[crm/sync-whatsapp] POST:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp está integrado via Z-API. Mensagens entram pelo webhook. Use POST para ver instruções.',
  })
}
