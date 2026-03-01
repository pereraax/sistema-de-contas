/**
 * POST: envia UMA mensagem customizada (texto + botões opcionais) para um número.
 * Usado pela extensão CRM com mensagens ilimitadas configuráveis.
 * Body: { "phone": "5511999999999", "text": "...", "buttons": [{ "id": "...", "title": "...", "url": "..." }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendCustomMessage, type CustomMessageButton } from '@/lib/whatsapp-enviar-boas-vindas-lib'
import { isBoasVindasConfigured } from '@/lib/whatsapp-enviar-boas-vindas-lib'

const EXTENSION_TOKEN = process.env.EXTENSION_CRM_API_KEY?.trim()

function normalizarPhone(n: string): string {
  const limpo = n.replace(/\D/g, '')
  if (limpo.length >= 10 && !limpo.startsWith('55')) return `55${limpo}`
  return limpo
}

function isAuthorized(request: NextRequest): boolean {
  if (!EXTENSION_TOKEN) return false
  const auth = request.headers.get('authorization')
  const apiKey = request.headers.get('x-api-key')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : apiKey?.trim()
  return token === EXTENSION_TOKEN
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  if (!EXTENSION_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Extensão CRM não configurada (EXTENSION_CRM_API_KEY)' },
      { status: 503, headers: corsHeaders }
    )
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401, headers: corsHeaders })
  }
  if (!isBoasVindasConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Nenhum provedor configurado (Z-API ou API Fácil)' },
      { status: 503, headers: corsHeaders }
    )
  }
  let body: { phone?: string; text?: string; buttons?: CustomMessageButton[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body deve ser JSON com "phone" e "text"' },
      { status: 400, headers: corsHeaders }
    )
  }
  const phone = normalizarPhone(String(body.phone ?? ''))
  if (phone.length < 10) {
    return NextResponse.json(
      { success: false, error: 'Número inválido. Envie { "phone": "5511999999999", "text": "..." }' },
      { status: 400, headers: corsHeaders }
    )
  }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json(
      { success: false, error: 'Campo "text" é obrigatório' },
      { status: 400, headers: corsHeaders }
    )
  }
  const buttons = Array.isArray(body.buttons)
    ? body.buttons
        .filter((b) => b && typeof b.title === 'string')
        .map((b) => ({
          id: String((b as any).id ?? (b as any).title ?? ''),
          title: String((b as any).title),
          url: typeof (b as any).url === 'string' ? (b as any).url.trim() : undefined,
        }))
    : undefined

  // Resposta imediata: extensão recebe 200 na hora; envio ao WhatsApp roda em background
  sendCustomMessage(phone, text, buttons && buttons.length > 0 ? buttons : undefined).catch((err) => {
    console.error('[send-custom-extension] envio em background falhou:', err?.message || err)
  })
  return NextResponse.json({ success: true, phone }, { headers: corsHeaders })
}
