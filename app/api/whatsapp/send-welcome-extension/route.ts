/**
 * POST: envia mensagem(ns) de boas-vindas para um número.
 * Usado pela extensão Chrome CRM (WhatsApp Web).
 * Autenticação: header Authorization: Bearer <EXTENSION_CRM_API_KEY> ou X-API-Key: <token>
 * Body: { "phone": "5511999999999" } ou { "phone": "...", "messageIndex": 1|2|3 } para enviar só uma mensagem (instantâneo).
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  sendBoasVindasToNumber,
  sendBoasVindasSingleMessage,
  isBoasVindasConfigured,
} from '@/lib/whatsapp-enviar-boas-vindas-lib'
import { markWelcomeSent, markTestIntroSent } from '@/lib/whatsapp-contatos-pendentes'

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
  let body: { phone?: string; messageIndex?: number }
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
  const messageIndex = body.messageIndex >= 1 && body.messageIndex <= 3 ? (body.messageIndex as 1 | 2 | 3) : null
  let result: { success: boolean; error?: string }
  try {
    if (messageIndex) {
      result = await sendBoasVindasSingleMessage(phone, messageIndex)
    } else {
      result = await sendBoasVindasToNumber(phone)
      if (result.success) {
        await markWelcomeSent(phone)
        await markTestIntroSent(phone).catch(() => {})
      }
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
      messageIndex: messageIndex ?? undefined,
    },
    { headers: corsHeaders }
  )
}
