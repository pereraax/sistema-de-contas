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
import { sendTextMessage, sendReplyButtons, isApifacilConfigured } from '@/lib/whatsapp-apifacil'
import { registerSentMessage } from '@/lib/whatsapp-plen-handler'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Mesmas 3 mensagens do fluxo "quero utilizar a plenipay" */
const MENSAGENS_BOAS_VINDAS: [string, { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }, string] = [
  `Oiii 👋💙\nEu sou a Plen, sua assistente financeira 🤖✨\nE eu já estou prontinha pra começar a te ajudar a organizar tudo por aqui!\n\nAntes da gente começar, cria sua conta rapidinho lá no site 🌐\nÉ bem rápido mesmo, prometo! ⏱️💙`,
  {
    type: 'buttons' as const,
    body: 'Escolha abaixo:',
    buttons: [
      { id: 'cadastrar', title: 'CADASTRAR' },
      { id: 'ja_cadastrei', title: 'JÁ CADASTREI' },
    ],
  },
  `Assim que finalizar o cadastro, me envia seu e-mail aqui 📩\nVou verificar tudo certinho e já te liberar pra começar a registrar seus gastos e colocar suas economias em ordem 💸📊✨\n\nEu fico responsável por anotar tudo pra você direto pelo WhatsApp, combinado? 😉`,
]

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
      let ok = true
      let lastError: string | undefined
      try {
        for (let i = 0; i < MENSAGENS_BOAS_VINDAS.length; i++) {
          const msg = MENSAGENS_BOAS_VINDAS[i]
          if (typeof msg === 'string') {
            const send = await sendTextMessage(phone, msg)
            if (send.success) {
              registerSentMessage(phone, msg)
            } else {
              ok = false
              lastError = send.error
              console.error('❌ [enviar-boas-vindas] Falha texto para', phone, ':', send.error)
              break
            }
          } else if (msg.type === 'buttons') {
            const send = await sendReplyButtons(phone, msg.body, msg.buttons)
            if (send.success) {
              registerSentMessage(phone, `${msg.body}\n\n${msg.buttons.map((b) => b.title).join(' / ')}`)
            } else {
              const linkMsg = `Escolha abaixo:\n\n🔗 Cadastro: https://plenipay.com\n\n*CADASTRAR* — abrir site\n*JÁ CADASTREI* — já criei minha conta`
              const fallback = await sendTextMessage(phone, linkMsg)
              if (fallback.success) registerSentMessage(phone, linkMsg)
              if (!fallback.success) {
                ok = false
                lastError = send.error || fallback.error
                break
              }
            }
          }
          if (i < MENSAGENS_BOAS_VINDAS.length - 1) await delay(1500)
        }
      } catch (err) {
        ok = false
        lastError = err instanceof Error ? err.message : String(err)
      }
      results.push({ numero: phone, ok, error: lastError })
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
