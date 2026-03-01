/**
 * Webhook da Z-API (z-api.io) para mensagens WhatsApp.
 * Recebe mensagens e cliques em botões; processa com o mesmo handler PLEN e responde via Z-API (com botões quando for o caso).
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage, registerSentMessage } from '@/lib/whatsapp-plen-handler'
import { sendTextMessage, sendButtonList, sendButtonActions, isZapiConfigured } from '@/lib/whatsapp-zapi'
import { sendTextMessage as apifacilSendText, sendCustomButtons as apifacilSendCustomButtons, isApifacilConfigured } from '@/lib/whatsapp-apifacil'
import { hasReceivedWelcome, markWelcomeSent, recordIncomingMessage } from '@/lib/whatsapp-contatos-pendentes'
import { sendBoasVindasToNumber, isBoasVindasConfigured } from '@/lib/whatsapp-enviar-boas-vindas-lib'

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

  const type = String((b.type as string) || '').toLowerCase()
  if (type && type !== 'receivedcallback') {
    return null
  }
  if (b.fromMe === true) return null

  const rawPhone = (b.phone as string) || ''
  if (!rawPhone) return null
  const connectedPhone = String((b.connectedPhone as string) || '').replace(/\D/g, '')
  const phoneDigits = String(rawPhone).replace(/\D/g, '')
  if (connectedPhone && phoneDigits === connectedPhone) {
    return null
  }
  if (!connectedPhone && phoneDigits.length >= 10 && phoneDigits.length <= 13) {
    const envPhone = process.env.ZAPI_CONNECTED_PHONE?.replace(/\D/g, '')
    if (envPhone && phoneDigits === envPhone) return null
  }

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

function isQueroUtilizarPlenipayMessage(t: string): boolean {
  if (!t || typeof t !== 'string') return false
  const msg = t.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?]+/g, ' ')
  const temPlenipay = msg.includes('plenipay') || (msg.includes('pleni') && msg.includes('pay'))
  const temIntencao = msg.includes('quero utilizar') || msg.includes('quero usar') || (msg.includes('quero') && (msg.includes('utilizar') || msg.includes('usar') || msg.includes('plenipay')))
  return !!(temPlenipay && temIntencao)
}

/** Envia texto: tenta Z-API; se não configurada ou falhar, usa API Fácil. */
async function sendTextReply(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (isZapiConfigured()) {
    const r = await sendTextMessage(phone, message)
    if (r.success) return r
    console.warn('⚠️ [Z-API Webhook] Envio Z-API falhou, tentando API Fácil:', r.error)
  }
  if (isApifacilConfigured()) {
    const r = await apifacilSendText(phone, message)
    return r.success ? r : { success: false, error: r.error }
  }
  return { success: false, error: 'Nenhum provedor configurado (Z-API ou API Fácil). Configure no Railway.' }
}

/** Envia botão link (button_actions): Z-API ou fallback API Fácil. */
async function sendButtonActionsReply(
  phone: string,
  body: string,
  buttonActions: { type: string; url?: string; label: string }[]
): Promise<{ success: boolean; error?: string }> {
  if (isZapiConfigured()) {
    const r = await sendButtonActions(phone, body, buttonActions as any)
    if (r.success) return r
    console.warn('⚠️ [Z-API Webhook] Botão Z-API falhou, tentando API Fácil:', r.error)
  }
  if (isApifacilConfigured()) {
    const buttons = buttonActions.map((a) => ({ id: (a.label || a.url || '').slice(0, 20), title: a.label || 'Abrir', url: a.url }))
    const r = await apifacilSendCustomButtons(phone, body, buttons)
    return r.success ? r : { success: false, error: r.error }
  }
  return { success: false, error: 'Nenhum provedor configurado.' }
}

/** Envia lista de botões (reply): Z-API ou fallback API Fácil. */
async function sendButtonListReply(
  phone: string,
  body: string,
  buttons: { id: string; title: string }[]
): Promise<{ success: boolean; error?: string }> {
  if (isZapiConfigured()) {
    const r = await sendButtonList(phone, body, buttons)
    if (r.success) return r
    console.warn('⚠️ [Z-API Webhook] Botões Z-API falharam, tentando API Fácil:', r.error)
  }
  if (isApifacilConfigured()) {
    const r = await apifacilSendCustomButtons(phone, body, buttons.map((b) => ({ id: b.id, title: b.title })))
    return r.success ? r : { success: false, error: r.error }
  }
  return { success: false, error: 'Nenhum provedor configurado.' }
}

async function processarEmBackground(parsed: { from: string; text: string }) {
  const { from, text } = parsed
  try {
    if (!isZapiConfigured() && !isApifacilConfigured()) {
      console.warn('⚠️ [Z-API Webhook] Nenhum provedor configurado (Z-API ou API Fácil). Configure variáveis no Railway.')
      return
    }
    const phone = from.startsWith('55') ? from : `55${from}`
    const phoneDigits = phone.replace(/\D/g, '')
    await recordIncomingMessage(phone, text ?? '').catch((e) => console.error('📨 [Z-API Webhook] recordIncomingMessage:', e))

    if (isQueroUtilizarPlenipayMessage(text) && isBoasVindasConfigured()) {
      console.log('👋 [Z-API Webhook] "Quero utilizar PleniPay" — enviando 3 mensagens para', phone)
      const result = await sendBoasVindasToNumber(phone)
      await markWelcomeSent(phone).catch(() => {})
      if (result.success) {
        console.log('✅ [Z-API Webhook] 3 mensagens de boas-vindas enviadas:', phone)
        return
      }
      console.error('❌ [Z-API Webhook] sendBoasVindasToNumber falhou:', result.error)
    }

    const jaRecebeuBoasVindas = await hasReceivedWelcome(phoneDigits)
    if (!jaRecebeuBoasVindas && isBoasVindasConfigured()) {
      console.log('👋 [Z-API Webhook] Contato novo — enviando 3 mensagens de boas-vindas para', phone)
      const result = await sendBoasVindasToNumber(phone)
      await markWelcomeSent(phone).catch(() => {})
      if (result.success) {
        console.log('✅ [Z-API Webhook] 3 mensagens enviadas para contato novo:', phone)
        return
      }
      console.error('❌ [Z-API Webhook] sendBoasVindasToNumber falhou para contato novo:', result.error)
    }

    const plenMessage = buildPlenMessage(from, text)
    const result = await processWhatsAppMessage(plenMessage as any)

    if (result?.messages && Array.isArray(result.messages) && result.messages.length > 0) {
      for (let i = 0; i < result.messages.length; i++) {
        const msg = result.messages[i]
        if (typeof msg === 'object' && msg !== null && (msg as any).type === 'buttons') {
          const { body, buttons } = msg as { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }
          const send = await sendButtonListReply(phone, body, buttons)
          if (send.success) {
            registerSentMessage(phone, `${body} [botões]`)
            console.log('✅ [Z-API Webhook] Botões', i + 1, '/', result.messages.length, 'enviados para:', phone)
          } else {
            console.error('❌ [Z-API Webhook] Falha ao enviar botões:', send.error)
          }
        } else if (typeof msg === 'object' && msg !== null && (msg as any).type === 'button_actions') {
          const { body, buttonActions } = msg as { type: 'button_actions'; body: string; buttonActions: { type: string; url?: string; label: string }[] }
          const send = await sendButtonActionsReply(phone, body, buttonActions)
          if (send.success) {
            registerSentMessage(phone, `${body} [botão link]`)
            console.log('✅ [Z-API Webhook] Botão link', i + 1, '/', result.messages.length, 'enviado para:', phone)
          } else {
            console.error('❌ [Z-API Webhook] Falha ao enviar botão link:', send.error)
          }
        } else if (typeof msg === 'string' && msg.trim()) {
          const send = await sendTextReply(phone, msg)
          if (send.success) {
            registerSentMessage(phone, msg)
            console.log('✅ [Z-API Webhook] Mensagem', i + 1, '/', result.messages.length, 'enviada para:', phone)
          } else {
            console.error('❌ [Z-API Webhook] Falha ao enviar:', send.error)
          }
        }
        if (i < result.messages.length - 1) await delay(500)
      }
    } else if (result?.message && typeof result.message === 'string') {
      const send = await sendTextReply(phone, result.message)
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
