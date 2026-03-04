/**
 * API do PLEN para WhatsApp.
 * Também usada por clientes externos; o handler usa processPlenWhatsAppMessage direto (sem fetch).
 */

import { NextRequest, NextResponse } from 'next/server'
import { processPlenWhatsAppMessage, delayRespostaPlen } from '@/lib/plen-whatsapp-chat'

export async function GET() {
  return NextResponse.json({ ok: true, route: 'plen/whatsapp-chat' })
}

export async function POST(request: NextRequest) {
  try {
    let body: { userId?: string; message?: string; imageBase64?: string } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ response: 'Requisição inválida.' }, { status: 200 })
    }

    const userId = typeof body.userId === 'string' ? body.userId.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    const result = await processPlenWhatsAppMessage(userId, message)
    await delayRespostaPlen()
    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[PLEN whatsapp-chat] Erro:', err)
    return NextResponse.json(
      { response: `Erro ao processar: ${msg}. Tente de novo ou acesse o site para registrar.` },
      { status: 200 }
    )
  }
}
