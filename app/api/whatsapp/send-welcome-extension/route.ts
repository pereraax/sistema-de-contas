/**
 * POST: envia as 3 mensagens de boas-vindas para um número.
 * Usado pela extensão Chrome CRM (WhatsApp Web).
 * Autenticação: header Authorization: Bearer <EXTENSION_CRM_API_KEY> ou X-API-Key: <token>
 * Body: { "phone": "5511999999999" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendBoasVindasToNumber } from '@/lib/whatsapp-enviar-boas-vindas-lib'
import { markWelcomeSent } from '@/lib/whatsapp-contatos-pendentes'
import { isApifacilConfigured } from '@/lib/whatsapp-apifacil'

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
  if (!isApifacilConfigured()) {
    return NextResponse.json(
      { success: false, error: 'API Fácil não configurada' },
      { status: 503, headers: corsHeaders }
    )
  }
  let body: { phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body deve ser JSON com campo "phone"' },
      { status: 400, headers: corsHeaders }
    )
  }
  const phone = normalizarPhone(String(body.phone ?? ''))
  if (phone.length < 10) {
    return NextResponse.json(
      { success: false, error: 'Número inválido. Envie { "phone": "5511999999999" }' },
      { status: 400, headers: corsHeaders }
    )
  }
  let result: { success: boolean; error?: string }
  try {
    result = await sendBoasVindasToNumber(phone)
    if (result.success) {
      await markWelcomeSent(phone)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, error: 'Erro ao enviar: ' + msg, phone },
      { status: 500, headers: corsHeaders }
    )
  }
  return NextResponse.json(
    {
      success: result.success,
      error: result.error,
      phone,
    },
    { headers: corsHeaders }
  )
}
