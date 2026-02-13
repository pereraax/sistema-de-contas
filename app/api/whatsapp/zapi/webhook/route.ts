/**
 * Webhook da Z-API (z-api.io) para mensagens WhatsApp.
 * Recebe mensagens e cliques em botões; processa com o mesmo handler PLEN e responde via Z-API (com botões quando for o caso).
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage, registerSentMessage } from '@/lib/whatsapp-plen-handler'
import { sendTextMessage, sendButtonList, isZapiConfigured } from '@/lib/whatsapp-zapi'

function buildPlenMessage(from: string, text: string) {
  const remoteJid = from.includes('@') ? from : `${from.replace(/\D/g, '')}@s.whatsapp.net`
  return {
    key: { remoteJid, id: `zapi-${Date.now()}` },
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000),
  }
}

/** Mapear clique em botão Z-API para o texto que o handler reconhece */
function buttonIdToText(buttonId: string, label?: string): string {
  const id = (buttonId || '').toLowerCase()
  if (id === 'cadastrar') return 'CADASTRAR'
  if (id === 'ja_cadastrei') return 'JÁ CADASTREI'
  return label || buttonId || ''
}

/** Extrair phone e text do payload Z-API (on-message-received). Doc: text.message, phone, fromMe. */
function parseZapiBody(body: unknown): { from: string; text: string } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (b.fromMe === true) return null

  // Destino da resposta: phone (contato ou grupo); connectedPhone é o número da instância
  const rawPhone = (b.phone as string) || (b.connectedPhone as string) || ''
  if (!rawPhone) return null

  let text = ''
  if (b.buttonsResponseMessage && typeof b.buttonsResponseMessage === 'object') {
    const br = b.buttonsResponseMessage as { buttonId?: string; message?: string }
    text = buttonIdToText(br.buttonId || '', br.message)
  } else if (b.text && typeof b.text === 'object') {
    const t = b.text as { message?: string }
    text = (t.message as string) || ''
  } else if (typeof b.text === 'string') {
    text = b.text
  } else if (typeof b.message === 'string') {
    text = b.message
  } else if (b.body && typeof (b.body as any).message === 'string') {
    text = (b.body as any).message
  } else if (typeof b.body === 'string') {
    text = b.body
  }
  if (!text.trim()) return null

  const from = String(rawPhone).replace(/\D/g, '')
  return { from: from.startsWith('55') ? from : `55${from}`, text: text.trim() }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function processarEmBackground(parsed: { from: string; text: string }) {
  const { from, text } = parsed
  try {
    if (!isZapiConfigured()) {
      console.warn('⚠️ [Z-API Webhook] ZAPI_INSTANCE_ID ou ZAPI_TOKEN não configurados.')
      return
    }
    const plenMessage = buildPlenMessage(from, text)
    const result = await processWhatsAppMessage(plenMessage as any)
    const phone = from.startsWith('55') ? from : `55${from}`

    if (result?.messages && Array.isArray(result.messages) && result.messages.length > 0) {
      for (let i = 0; i < result.messages.length; i++) {
        const msg = result.messages[i]
        if (typeof msg === 'object' && msg !== null && (msg as any).type === 'buttons') {
          const { body, buttons } = msg as { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }
          const send = await sendButtonList(phone, body, buttons)
          if (send.success) {
            registerSentMessage(phone, `${body} [botões]`)
            console.log('✅ [Z-API Webhook] Botões', i + 1, '/', result.messages.length, 'enviados para:', phone)
          } else {
            console.error('❌ [Z-API Webhook] Falha ao enviar botões:', send.error)
          }
        } else if (typeof msg === 'string' && msg.trim()) {
          const send = await sendTextMessage(phone, msg)
          if (send.success) {
            registerSentMessage(phone, msg)
            console.log('✅ [Z-API Webhook] Mensagem', i + 1, '/', result.messages.length, 'enviada para:', phone)
          } else {
            console.error('❌ [Z-API Webhook] Falha ao enviar:', send.error)
          }
        }
        if (i < result.messages.length - 1) await delay(1500)
      }
    } else if (result?.message && typeof result.message === 'string') {
      const send = await sendTextMessage(phone, result.message)
      if (send.success) {
        registerSentMessage(phone, result.message)
        console.log('✅ [Z-API Webhook] Resposta enviada para:', phone)
      } else {
        console.error('❌ [Z-API Webhook] Falha ao enviar resposta:', send.error)
      }
    } else if (result === null) {
      console.log('📨 [Z-API Webhook] Mensagem processada sem resposta.')
    }
  } catch (err) {
    console.error('❌ [Z-API Webhook] Erro em background:', err)
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Z-API Webhook ativo',
    service: 'PLEN Assistant (Z-API)',
  })
}

export async function POST(request: NextRequest) {
  // Log imediato para confirmar que a Z-API está chamando o servidor (ver nos logs do Railway)
  console.log('🔔 [Z-API Webhook] POST recebido em', new Date().toISOString())
  try {
    const body = await request.json().catch(() => null)
    const parsed = parseZapiBody(body)
    if (!parsed) {
      console.warn('📨 [Z-API Webhook] Payload ignorado (sem phone/text ou fromMe). Body keys:', body && typeof body === 'object' ? Object.keys(body as object).join(', ') : 'null')
      return NextResponse.json({ success: true, message: 'Payload ignorado' })
    }
    console.log('📨 [Z-API Webhook] Mensagem recebida:', { from: parsed.from, textPreview: parsed.text.slice(0, 80) })
    processarEmBackground(parsed).catch((e) => console.error('❌ [Z-API Webhook]', e))
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ [Z-API Webhook] Erro:', err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
