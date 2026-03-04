/**
 * Cria conta a partir do fluxo WhatsApp (nome + email coletados pela Plen).
 * POST body: { nome, email, phone }
 */

import { NextRequest, NextResponse } from 'next/server'
import { criarContaFromWhatsApp } from '@/lib/criar-conta-whatsapp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { nome, email, phone } = body as { nome?: string; email?: string; phone?: string }

    const result = await criarContaFromWhatsApp(
      nome ?? '',
      email ?? '',
      phone ?? ''
    )

    if (!result.success) {
      const status = result.error.includes('já está cadastrado') ? 409 : 400
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json({
      success: true,
      message: 'Conta criada. E-mail de confirmação enviado.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro inesperado'
    console.error('❌ [criar-conta-whatsapp]', message)
    return NextResponse.json(
      { error: message || 'Erro ao criar conta.' },
      { status: 500 }
    )
  }
}
