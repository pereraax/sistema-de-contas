/**
 * Webhook da API Fácil (apifacil.dev) para mensagens WhatsApp.
 * A API Fácil chama esta URL quando uma mensagem é recebida na instância conectada.
 * Sem esta rota, o assistente PLEN nunca recebe as mensagens (404).
 * Suporta texto, imagem (comprovante) e áudio (transcrição → mesmo fluxo do texto).
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage, registerSentMessage } from '@/lib/whatsapp-plen-handler'
import { sendTextMessage, sendReplyButtons, isApifacilConfigured } from '@/lib/whatsapp-apifacil'
import { detectMedia, processComprovanteImage, downloadMedia, transcribeAudio } from '@/lib/whatsapp-media-processor'

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

/** Números permitidos em modo teste (localhost). Variável: WHATSAPP_TEST_NUMBERS=5511999999999 ou 5511999999999,5511888888888 */
function getTestNumbers(): string[] {
  const raw = process.env.WHATSAPP_TEST_NUMBERS || ''
  if (!raw.trim()) return []
  return raw
    .split(',')
    .map((n) => n.replace(/\D/g, '').trim())
    .filter(Boolean)
    .map((n) => (n.startsWith('55') ? n : `55${n}`))
}

/** Verifica se o número está na lista de teste (quando em modo teste). */
function isAllowedTestNumber(from: string, testNumbers: string[]): boolean {
  if (testNumbers.length === 0) return true
  const normalized = from.replace(/\D/g, '')
  const with55 = normalized.startsWith('55') ? normalized : `55${normalized}`
  return testNumbers.some((t) => t === with55 || t === normalized)
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
  // Meta Cloud API: message.text.body
  if (!text && (b as any).message?.text?.body) text = (b as any).message.text.body
  if (from && text) {
    const fromClean = String(from).replace(/\D/g, '')
    return { from: fromClean, text: String(text) }
  }

  return null
}

type MediaPayload = { type: 'audio'; url: string; mimetype: string } | { type: 'image'; url: string; mimetype: string; caption?: string }

/** Extrai from e opcionalmente text ou mídia (áudio/imagem). Para áudio, text virá da transcrição; para imagem, do comprovante. */
function parseWebhookBodyWithMedia(body: unknown): { from: string; text?: string; media?: MediaPayload } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const tipoEnvio = (b.tipo_envio as string) || ''
  if (tipoEnvio === 'MENSAGEM_ENVIADA') return null

  const data = (b.data && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
  const from = (data.origem ?? data.from ?? b.origem ?? b.from ?? data.telefone ?? data.numero ?? b.telefone ?? b.numero) as string | undefined
  if (!from) return null

  const fromClean = String(from).replace(/\D/g, '')
  const textRaw = (data.mensagem ?? data.text ?? b.mensagem ?? b.text ?? (data as any)?.body) as string | undefined
  const text = textRaw != null ? String(textRaw).trim() : ''

  // IMPORTANTE: Detectar mídia ANTES de tratar como texto. API Fácil pode enviar URL em "mensagem" ou tipo em data.
  const media = detectMedia(body as any)
  if (media?.type === 'audio' && media.url) {
    return { from: fromClean, media: { type: 'audio', url: media.url, mimetype: media.mimetype || 'audio/ogg' } }
  }
  if (media?.type === 'image' && media.url) {
    return { from: fromClean, media: { type: 'image', url: media.url, mimetype: media.mimetype || 'image/jpeg', caption: media.caption } }
  }

  if (text) return { from: fromClean, text }
  return null
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Apifacil Webhook ativo',
    service: 'PLEN Assistant',
  })
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Headers para fetch de mídia. API Fácil usa "Authorization: token" (sem Bearer). */
function getMediaFetchHeaders(): HeadersInit {
  const token = process.env.APIFACIL_TOKEN?.trim()
  if (token) return { Authorization: token }
  return {}
}

const MSG_COMPROVANTE_NAO_LEU = `Não consegui ler o comprovante 😅

Envie a foto de novo com uma legenda, por exemplo:
gastei 50 no mercado
paguei 80 para João
recebi 100 de Maria`

/** Processar mensagem e enviar resposta em background (não bloqueia a resposta do webhook) */
async function processarEmBackground(parsed: {
  from: string
  text?: string
  media?: { type: 'audio'; url: string; mimetype: string } | { type: 'image'; url: string; mimetype: string; caption?: string }
}) {
  const { from, text: textInicial, media } = parsed
  let text = textInicial
  try {
    if (media?.type === 'audio') {
      // Áudio: baixar → transcrever → tratar o texto como se o usuário tivesse digitado (mesmo fluxo do PLEN).
      try {
        const buffer = await downloadMedia(media.url, getMediaFetchHeaders())
        if (!buffer || buffer.length === 0) throw new Error('Download do áudio falhou')
        const transcribed = await transcribeAudio(buffer, media.mimetype || 'audio/ogg')
        text = (transcribed || '').trim()
        if (text) {
          console.log('🎤 [Apifacil Webhook] Áudio transcrito:', text.slice(0, 80))
        } else {
          if (isApifacilConfigured()) {
            const phone = from.startsWith('55') ? from : `55${from}`
            await sendTextMessage(
              phone,
              'Não consegui entender o áudio 😅 Tente falar de novo (ex.: "gastei 50 no mercado") ou digite a mensagem.'
            )
            registerSentMessage(phone, 'Não consegui entender o áudio.')
          }
          return
        }
      } catch (err) {
        console.error('🎤 [Apifacil Webhook] Erro ao processar áudio:', err)
        if (isApifacilConfigured()) {
          const phone = from.startsWith('55') ? from : `55${from}`
          await sendTextMessage(
            phone,
            'Problema ao processar o áudio. Tente enviar de novo ou digite a mensagem (ex.: gastei 50 no mercado).'
          )
          registerSentMessage(phone, 'Erro ao processar áudio.')
        }
        return
      }
    }
    if (media?.type === 'image') {
      try {
        console.log('🖼️ [Apifacil Webhook] Imagem detectada, baixando:', media.url?.slice(0, 90))
        const buffer = await downloadMedia(media.url, getMediaFetchHeaders())
        if (!buffer || buffer.length === 0) {
          console.error('🖼️ [Apifacil Webhook] Download falhou (buffer vazio ou null)')
          throw new Error('Falha ao baixar imagem')
        }
        console.log('🖼️ [Apifacil Webhook] Download OK,', buffer.length, 'bytes. Extraindo comprovante...')
        const comando = await processComprovanteImage(buffer, media.caption)
        text = (comando || '').trim()
        if (!text) {
          console.error('🖼️ [Apifacil Webhook] Nenhum comando extraído da imagem (IA retornou vazio ou null)')
          if (isApifacilConfigured()) {
            const phone = from.startsWith('55') ? from : `55${from}`
            await sendTextMessage(phone, MSG_COMPROVANTE_NAO_LEU)
            registerSentMessage(phone, MSG_COMPROVANTE_NAO_LEU)
          }
          return
        }
        // Registrar direto: valor e nome vêm da extração (OCR/IA). Sem pedir reenvio com legenda.
        console.log('🖼️ [Apifacil Webhook] Comprovante OK:', text.slice(0, 80))
      } catch (err) {
        console.error('🖼️ [Apifacil Webhook] Erro ao processar imagem:', err)
        if (isApifacilConfigured()) {
          const phone = from.startsWith('55') ? from : `55${from}`
          await sendTextMessage(phone, MSG_COMPROVANTE_NAO_LEU)
          registerSentMessage(phone, MSG_COMPROVANTE_NAO_LEU)
        }
        return
      }
    }
    if (!text) return

    // Texto (digitado ou de imagem/comprovante) segue o fluxo normal: PLEN interpreta e registra
    const plenMessage = buildPlenMessage(from, text)
    const result = await processWhatsAppMessage(plenMessage as any)
    const phone = from.startsWith('55') ? from : `55${from}`

    const apifacilOk = isApifacilConfigured()
    if (!apifacilOk) {
      console.warn('⚠️ [Apifacil Webhook] APIFACIL_INSTANCE_ID ou APIFACIL_TOKEN não configurados em produção. Configure no painel (Railway/Render) e faça redeploy.')
      const preview = result?.message ? String(result.message).slice(0, 80) : result?.messages?.length ? `${result.messages.length} msg(s)` : 'null'
      console.warn('⚠️ [Apifacil Webhook] Resposta que seria enviada para', phone, ':', preview)
      return
    }

    if (result?.messages && Array.isArray(result.messages) && result.messages.length > 0) {
      console.log('📤 [Apifacil Webhook] Enviando', result.messages.length, 'mensagem(ns) para', phone)
      for (let i = 0; i < result.messages.length; i++) {
        const msg = result.messages[i]
        if (typeof msg === 'object' && msg !== null && (msg as any).type === 'buttons') {
          const { body, buttons } = msg as { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }
          const send = await sendReplyButtons(phone, body, buttons)
          if (send.success) {
            const textFallback = `${body}\n\n${buttons.map((b) => b.title).join(' / ')}`
            registerSentMessage(phone, textFallback)
            console.log('✅ [Apifacil Webhook] Botões', i + 1, '/', result.messages.length, 'enviados para:', phone, send.usedFallback ? '(fallback texto)' : '')
          } else {
            console.error('❌ [Apifacil Webhook] Falha ao enviar botões', i + 1, ':', send.error)
          }
        } else if (typeof msg === 'object' && msg !== null && (msg as any).type === 'button_actions') {
          // API Fácil não suporta botão URL; envio como texto + link
          const { body, buttonActions } = msg as { type: 'button_actions'; body: string; buttonActions: { type: string; url?: string; label: string }[] }
          const urlBtn = buttonActions?.find((a) => a.type === 'URL' && a.url)
          const text = urlBtn ? `${body}\n\n🔗 ${urlBtn.label}: ${urlBtn.url}` : body
          const send = await sendTextMessage(phone, text)
          if (send.success) {
            registerSentMessage(phone, text)
            console.log('✅ [Apifacil Webhook] Link (fallback texto)', i + 1, '/', result.messages.length, 'enviado para:', phone)
          } else {
            console.error('❌ [Apifacil Webhook] Falha ao enviar link', i + 1, ':', send.error)
          }
        } else if (typeof msg === 'string' && msg.trim()) {
          const send = await sendTextMessage(phone, msg)
          if (send.success) {
            registerSentMessage(phone, msg)
            console.log('✅ [Apifacil Webhook] Mensagem', i + 1, '/', result.messages.length, 'enviada para:', phone)
          } else {
            console.error('❌ [Apifacil Webhook] Falha ao enviar mensagem', i + 1, ':', send.error)
          }
        }
        if (i < result.messages.length - 1) await delay(1500)
      }
    } else if (result?.message && typeof result.message === 'string') {
      const send = await sendTextMessage(phone, result.message)
      if (send.success) {
        registerSentMessage(phone, result.message)
        console.log('✅ [Apifacil Webhook] Resposta enviada para:', phone)
      } else {
        console.error('❌ [Apifacil Webhook] Falha ao enviar resposta:', send.error)
      }
    } else if (result === null) {
      console.log('📨 [Apifacil Webhook] Mensagem processada mas sem resposta (assistente desativado ou ignorado).')
      if (apifacilOk) {
        await sendTextMessage(phone, 'Processei sua mensagem. Se precisar de algo, digite ou fale de novo. 😊')
        registerSentMessage(phone, 'Processei sua mensagem.')
      }
    } else if (!result?.message && (!result?.messages || result.messages.length === 0)) {
      console.log('📨 [Apifacil Webhook] Resposta vazia do assistente.')
      if (apifacilOk) {
        await sendTextMessage(phone, 'Não consegui processar. Tente novamente ou digite, por exemplo: gastei 50 no mercado.')
        registerSentMessage(phone, 'Não consegui processar.')
      }
    }
  } catch (err) {
    console.error('❌ [Apifacil Webhook] Erro no processamento em background:', err)
    try {
      const phone = from.startsWith('55') ? from : `55${from}`
      if (isApifacilConfigured()) {
        await sendTextMessage(phone, 'Desculpe, tive um problema. Tente novamente.')
        registerSentMessage(phone, 'Erro no processamento.')
      }
    } catch (sendErr) {
      console.error('❌ [Apifacil Webhook] Falha ao enviar mensagem de erro ao usuário:', sendErr)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const apifacilConfigured = isApifacilConfigured()
    console.log('📨 [Apifacil Webhook] WEBHOOK CHAMADO | APIFACIL configurado:', apifacilConfigured)
    const raw = await request.text()
    let body: unknown
    try {
      body = raw ? JSON.parse(raw) : {}
    } catch {
      console.warn('📨 [Apifacil Webhook] Body não é JSON:', raw?.slice(0, 200))
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    // Log resumido para debug de áudio/imagem (tipo_envio e se mensagem é URL)
    const b = body as Record<string, unknown>
    const tipoEnvio = (b.tipo_envio ?? (b.data && typeof b.data === 'object' ? (b.data as Record<string, unknown>).tipo_envio : null)) as string | undefined
    const mensagemPreview = (b.mensagem ?? (b.data && typeof b.data === 'object' ? (b.data as Record<string, unknown>).mensagem : null)) as string | undefined
    if (tipoEnvio || (typeof mensagemPreview === 'string' && mensagemPreview.startsWith('http'))) {
      console.log('📨 [Apifacil Webhook] Payload (tipo_envio/mídia):', { tipo_envio: tipoEnvio, mensagem_eh_url: typeof mensagemPreview === 'string' && /^https?:\/\//i.test(mensagemPreview), from: b.origem ?? (b.data && typeof b.data === 'object' ? (b.data as Record<string, unknown>).origem : null) })
    }

    let parsed = parseWebhookBodyWithMedia(body)
    if (!parsed) {
      const fallback = parseWebhookBody(body)
      if (fallback) parsed = { from: fallback.from, text: fallback.text }
    }
    if (parsed && !parsed.media) {
      const data = (body as any).data || body
      const te = ((body as any).tipo_envio ?? data?.tipo_envio) as string
      const url = data?.url_media ?? data?.url_midia ?? data?.media_url ?? data?.url ?? data?.mensagem ?? (body as any).mensagem
      if (te && typeof url === 'string' && url.startsWith('http')) {
        const tipo = /AUDIO_RECEBIDO/i.test(te) ? 'audio' : /IMAGEM_RECEBIDA|IMAGE/i.test(te) ? 'image' : null
        if (tipo) {
          parsed = { ...parsed, media: { type: tipo as 'audio' | 'image', url, mimetype: tipo === 'audio' ? 'audio/ogg' : 'image/jpeg', caption: tipo === 'image' ? (data?.caption ?? data?.legenda ?? '') : undefined } }
          console.log('📨 [Apifacil Webhook] Mídia obtida por fallback (tipo_envio + URL):', tipo, url.slice(0, 60))
        }
      }
    }
    if (!parsed) {
      const rawPreview = JSON.stringify(body).slice(0, 600)
      const keys = body && typeof body === 'object' ? Object.keys(body as object).join(', ') : 'null'
      console.log('📨 [Apifacil Webhook] Payload não reconhecido (sem from/text). Keys:', keys, '| Body:', rawPreview)
      return NextResponse.json({ success: true, message: 'Payload ignorado (sem from/text)' })
    }

    const { from } = parsed
    const textPreview = parsed.text ? parsed.text.slice(0, 80) : parsed.media ? `[${parsed.media.type}]` : ''
    console.log('📨 [Apifacil Webhook] MENSAGEM RECEBIDA:', { from, textPreview, mediaType: parsed.media?.type })

    // Em localhost: só processar se WHATSAPP_TEST_NUMBERS estiver definido e o número estiver na lista
    const isDev = process.env.NODE_ENV === 'development'
    const testNumbers = getTestNumbers()
    if (isDev && testNumbers.length > 0) {
      if (!isAllowedTestNumber(from, testNumbers)) {
        console.log('🔒 [Apifacil Webhook] Modo teste: ignorando número não autorizado.', { from, allowed: testNumbers })
        return NextResponse.json({ success: true, message: 'Modo teste: número ignorado' })
      }
      console.log('✅ [Apifacil Webhook] Modo teste: número autorizado, processando.', { from })
    }

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
