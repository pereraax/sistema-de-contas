/**
 * Enviar as 3 mensagens de "Olá, quero utilizar a plenipay" para uma lista de números.
 * Útil para reponder a quem mandou essa mensagem e não recebeu resposta (ex.: números do painel API Fácil).
 *
 * Uso:
 *   POST /api/whatsapp/apifacil/enviar-boas-vindas
 *   Header: Authorization: Bearer <WHATSAPP_ENVIAR_BOASVINDAS_SECRET>
 *   Body: { "numeros": ["5511999999999", "5511888888888"] }
 *
 * Configure WHATSAPP_ENVIAR_BOASVINDAS_SECRET no painel (Railway/Render) para proteger a rota.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isApifacilConfigured } from '@/lib/whatsapp-apifacil'
import { sendBoasVindasToNumber } from '@/lib/whatsapp-enviar-boas-vindas-lib'

function normalizarNumero(n: string): string {
  const limpo = n.replace(/\D/g, '')
  if (limpo.length >= 10 && !limpo.startsWith('55')) return `55${limpo}`
  return limpo
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.WHATSAPP_ENVIAR_BOASVINDAS_SECRET?.trim()
    if (secret) {
      const auth = request.headers.get('authorization') || ''
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
      if (token !== secret) {
        return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
      }
    }

    if (!isApifacilConfigured()) {
      return NextResponse.json(
        { success: false, error: 'API Fácil não configurada (APIFACIL_INSTANCE_ID / APIFACIL_TOKEN)' },
        { status: 503 }
      )
    }

    let body: { numeros?: string[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body deve ser JSON com campo "numeros" (array de números)' },
        { status: 400 }
      )
    }

    const rawNumeros = Array.isArray(body.numeros) ? body.numeros : []
    const numeros = [...new Set(rawNumeros.map(normalizarNumero).filter((n) => n.length >= 10))]

    if (numeros.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum número válido. Envie { "numeros": ["5511999999999", ...] }' },
        { status: 400 }
      )
    }

    const results: { numero: string; ok: boolean; error?: string }[] = []

    for (const phone of numeros) {
      try {
        const r = await sendBoasVindasToNumber(phone)
        results.push({ numero: phone, ok: r.success, error: r.error })
      } catch (err) {
        results.push({
          numero: phone,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const enviados = results.filter((r) => r.ok).length
    return NextResponse.json({
      success: true,
      enviados,
      total: numeros.length,
      detalhes: results,
    })
  } catch (err) {
    console.error('❌ [enviar-boas-vindas] Erro:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
