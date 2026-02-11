/**
 * Webhook da API Fácil (apifacil.dev) para mensagens WhatsApp.
 * A API Fácil chama esta URL quando uma mensagem é recebida na instância conectada.
 * Sem esta rota, o assistente PLEN nunca recebe as mensagens (404).
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage, registerSentMessage } from '@/lib/whatsapp-plen-handler'
import { sendTextMessage, isApifacilConfigured } from '@/lib/whatsapp-apifacil'

/** Formato esperado pelo processWhatsAppMessage (Baileys/Evolution style) */
function buildPlenMessage(from: string, text: string): {
  key: { remoteJid: string; id: string }
  message: { conversation: string }
  messageTimestamp: number
} {
  const remoteJid = from.includes('@') ? from : `${from.replace(/\D/g, '')}@s.whatsapp.net`
  return {
    key: { remoteJid, id: `apifacil-${Date.now()}` },
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000),
  }
}

/** Extrair from e text do body em vários formatos (API Fácil / Meta / genérico). Só mensagens RECEBIDAS. */
function parseWebhookBody(body: unknown): { from: string; text: string } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  // Ignorar mensagens enviadas por nós (só processar MENSAGEM_RECEBIDA)
  const tipoEnvio = (b.tipo_envio as string) || ''
  if (tipoEnvio === 'MENSAGEM_ENVIADA') return null

  // Formato real da API Fácil: event "whatsapp_insert" com origem e mensagem no topo
  // Doc: https://apifacil.dev/documentacao/whatsapp
  if (b.event === 'whatsapp_insert' || b.tipo_envio === 'MENSAGEM_RECEBIDA' || tipoEnvio === 'MENSAGEM_RECEBIDA') {
    const from = (b.origem ?? b.from) as string | undefined
    const text = (b.mensagem ?? b.text) as string | undefined
    if (from && text) {
      return { from: String(from).replace(/\D/g, ''), text: String(text) }
    }
  }

  // Formato com dados dentro de "data" (algumas configs da API Fácil)
  if (b.data && typeof b.data === 'object') {
    const data = b.data as Record<string, unknown>
    const from = (data.origem ?? data.from ?? data.telefone ?? data.numero) as string | undefined
    const text = (data.mensagem ?? data.text ?? (data as any)?.body) as string | undefined
    if (from && text) {
      return { from: String(from).replace(/\D/g, ''), text: String(text) }
    }
  }

  // Formato com evento: { event: "MENSAGEM_RECEBIDA", data: { from, text, ... } }
  if (b.event === 'MENSAGEM_RECEBIDA' && b.data && typeof b.data === 'object') {
    const data = b.data as Record<string, unknown>
    const from = [data.origem, data.from, data.telefone, data.numero].find((x) => typeof x === 'string') as string | undefined
    const text = [data.mensagem, data.text, data.body, (data as any)?.text?.body].find((x) => typeof x === 'string') as string | undefined
    if (from && text) return { from: String(from).replace(/\D/g, ''), text: String(text) }
  }

  // Formato direto: origem, from, numero, mensagem, text
  const contacts = (b as any).contacts
  const from = (b.origem ?? b.from ?? b.telefone ?? b.numero ?? contacts?.[0]?.wa_id) as string | undefined
  let text: string | undefined
  if (typeof b.mensagem === 'string') text = b.mensagem
  else if (typeof b.text === 'string') text = b.text
  else if (typeof (b as any).body === 'string') text = (b as any).body
  else if (Array.isArray(b.messages) && b.messages[0] && typeof b.messages[0] === 'object') {
    const msg = (b.messages as any)[0]
    text = msg.text?.body ?? msg.body ?? msg.text
  }
  if (from && text) {
    const fromClean = String(from).replace(/\D/g, '')
    return { from: fromClean, text: String(text) }
  }

  return null
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Apifacil Webhook ativo',
    service: 'PLEN Assistant',
  })
}

/** Processar mensagem e enviar resposta em background (não bloqueia a resposta do webhook) */
async function processarEmBackground(parsed: { from: string; text: string }) {
  const { from, text } = parsed
  try {
    if (!isApifacilConfigured()) {
      console.warn('⚠️ [Apifacil Webhook] APIFACIL_INSTANCE_ID ou APIFACIL_TOKEN não configurados. Resposta não será enviada ao WhatsApp.')
      return
    }
    const plenMessage = buildPlenMessage(from, text)
    const result = await processWhatsAppMessage(plenMessage as any)
    if (result?.message && typeof result.message === 'string') {
      const phone = from.startsWith('55') ? from : `55${from}`
      const send = await sendTextMessage(phone, result.message)
      if (send.success) {
        registerSentMessage(phone, result.message)
        console.log('✅ [Apifacil Webhook] Resposta enviada para:', phone)
      } else {
        console.error('❌ [Apifacil Webhook] Falha ao enviar resposta:', send.error)
      }
    } else if (result === null) {
      console.log('📨 [Apifacil Webhook] Mensagem processada mas sem resposta (assistente desativado ou ignorado).')
    }
  } catch (err) {
    console.error('❌ [Apifacil Webhook] Erro no processamento em background:', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📨 [Apifacil Webhook] WEBHOOK CHAMADO')
    const raw = await request.text()
    let body: unknown
    try {
      body = raw ? JSON.parse(raw) : {}
    } catch {
      console.warn('📨 [Apifacil Webhook] Body não é JSON:', raw?.slice(0, 200))
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = parseWebhookBody(body)
    if (!parsed) {
      const rawPreview = JSON.stringify(body).slice(0, 600)
      console.log('📨 [Apifacil Webhook] Payload não reconhecido (sem from/text). Verifique o formato em Config. Webhook. Body:', rawPreview)
      return NextResponse.json({ success: true, message: 'Payload ignorado (sem from/text)' })
    }

    const { from, text } = parsed
    console.log('📨 [Apifacil Webhook] MENSAGEM RECEBIDA:', { from, textPreview: text.slice(0, 80) })

    // Responder 200 IMEDIATAMENTE para a API Fácil não marcar webhook como Pendente (timeout ~10s)
    processarEmBackground(parsed).catch((err) => {
      console.error('❌ [Apifacil Webhook] Erro em background:', err)
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ [Apifacil Webhook] Erro:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
