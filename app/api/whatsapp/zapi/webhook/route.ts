/**
 * Webhook da Z-API (z-api.io) para mensagens WhatsApp.
 * Único provedor em uso: toda recepção e envio é via Z-API (sem API Fácil).
 * Recebe mensagens e cliques em botões; processa com o handler PLEN e responde via Z-API.
 *
 * - TEXTO: mensagem digitada → PLEN interpreta (registro, dúvidas, etc.) → envia resposta.
 * - ÁUDIO: baixa arquivo → transcreve (Groq/OpenAI/Gemini) → usa texto como se fosse digitado → PLEN registra.
 * - IMAGEM (comprovante): baixa → OCR/IA extrai valor e nome → comando "paguei X para Y" / "recebi X de Y" → PLEN registra.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage, registerSentMessage } from '@/lib/whatsapp-plen-handler'
import { sendTextMessage, sendButtonList, sendButtonActions, isZapiConfigured } from '@/lib/whatsapp-zapi'
import { hasReceivedWelcome, markWelcomeSent, recordIncomingMessage } from '@/lib/whatsapp-contatos-pendentes'
import { sendBoasVindasToNumber, isBoasVindasConfigured, MENSAGENS_BOAS_VINDAS } from '@/lib/whatsapp-enviar-boas-vindas-lib'
import { downloadMedia, transcribeAudio, processComprovanteImage } from '@/lib/whatsapp-media-processor'

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
  const id = (buttonId || '').toLowerCase().trim().replace(/\s+/g, '_')
  const lbl = (label || '').trim()
  if (id === 'cadastrar') return 'CADASTRAR'
  if (id === 'ja_cadastrei' || id === 'já_criei' || id === 'ja_criei') return 'JÁ CADASTREI'
  if (id === 'falar_com_humano') return 'Falar com humano'
  if (id === 'voltar_plen') return 'Voltar a falar com a PLEN'
  // Z-API às vezes envia o rótulo do botão como id; reconhecer "JÁ CRIEI" em qualquer campo
  if (lbl && /^j[aá]\s*criei$/i.test(lbl.replace(/\s+/g, ' '))) return 'JÁ CADASTREI'
  if (id && /^j[aá]_?criei$/i.test(id)) return 'JÁ CADASTREI'
  return label || buttonId || ''
}

/** Obter objeto que pode conter buttonsResponseMessage/listResponseMessage (top-level ou em data/messageData). */
function getButtonPayload(b: Record<string, unknown>): Record<string, unknown> | null {
  if (b.buttonsResponseMessage && typeof b.buttonsResponseMessage === 'object') return b as Record<string, unknown>
  if (b.listResponseMessage && typeof b.listResponseMessage === 'object') return b as Record<string, unknown>
  if (b.data && typeof b.data === 'object') {
    const d = b.data as Record<string, unknown>
    if (d.buttonsResponseMessage || d.listResponseMessage) return d
  }
  if (b.messageData && typeof b.messageData === 'object') {
    const m = b.messageData as Record<string, unknown>
    if (m.buttonsResponseMessage || m.listResponseMessage) return m
  }
  return null
}

/** Mídia recebida no webhook Z-API (áudio ou imagem de comprovante). */
type ZapiMedia =
  | { type: 'audio'; url: string; mimetype: string }
  | { type: 'image'; url: string; mimetype: string; caption?: string }

export type ZapiParsed = { from: string; text: string; messageId?: string; media?: ZapiMedia }

/** Extrair phone, text, messageId e mídia (áudio/imagem) do payload Z-API. Aceita vários formatos (on-message-received, ReceivedCallBack, data.text, audio.audioUrl, image.imageUrl, etc.). */
function parseZapiBody(body: unknown): ZapiParsed | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  if (b.fromMe === true) return null

  const rawPhone =
    (b.phone as string) ||
    (b.data && typeof b.data === 'object' && (b.data as Record<string, unknown>).phone as string) ||
    ''
  if (!rawPhone) return null
  const connectedPhone = String((b.connectedPhone as string) || '').replace(/\D/g, '')
  const phoneDigits = String(rawPhone).replace(/\D/g, '')
  if (connectedPhone && phoneDigits === connectedPhone) return null
  if (!connectedPhone && phoneDigits.length >= 10 && phoneDigits.length <= 13) {
    const envPhone = process.env.ZAPI_CONNECTED_PHONE?.replace(/\D/g, '')
    if (envPhone && phoneDigits === envPhone) return null
  }

  let text = ''
  const buttonPayload = getButtonPayload(b)
  if (buttonPayload?.buttonsResponseMessage && typeof buttonPayload.buttonsResponseMessage === 'object') {
    const br = buttonPayload.buttonsResponseMessage as { buttonId?: string; message?: string; selectedButtonId?: string; selectedButtonText?: string }
    const id = String(br.selectedButtonId ?? br.buttonId ?? '').trim()
    const label = String(br.selectedButtonText ?? br.message ?? '').trim()
    text = buttonIdToText(id, label)
    if (!text.trim()) text = label || id || 'Olá'
  } else if (buttonPayload?.listResponseMessage && typeof buttonPayload.listResponseMessage === 'object') {
    const lr = buttonPayload.listResponseMessage as { singleSelectReply?: string; title?: string }
    const id = String(lr.singleSelectReply ?? '').trim()
    const label = String(lr.title ?? '').trim()
    text = buttonIdToText(id, label)
    if (!text.trim()) text = label || id || 'Olá'
  } else if (b.text && typeof b.text === 'object') {
    const t = b.text as { message?: string }
    text = (t.message as string) || ''
  } else if (typeof b.text === 'string') {
    text = b.text
  } else if (typeof b.message === 'string') {
    text = b.message
  } else if (b.body && typeof (b.body as { message?: string }).message === 'string') {
    text = (b.body as { message: string }).message
  } else if (typeof b.body === 'string') {
    text = b.body
  } else if (b.data && typeof b.data === 'object') {
    const d = b.data as Record<string, unknown>
    text = (d.text as string) || (d.message as string) || (d.body as string) || ''
  }
  if (typeof b.messageText === 'string') text = text || b.messageText
  // Reforço: se tem phone mas não extraiu texto, tratar como "Olá" para não descartar contato novo
  if (!text.trim()) text = 'Olá'

  const from = String(rawPhone).replace(/\D/g, '')
  let messageId: string | undefined = typeof b.messageId === 'string' ? b.messageId : undefined
  if (!messageId && b.data && typeof b.data === 'object') {
    const mid = (b.data as Record<string, unknown>).messageId
    if (typeof mid === 'string') messageId = mid
  }

  // Mídia: Z-API envia audio.audioUrl / image.imageUrl (top-level ou em data)
  let media: ZapiMedia | undefined
  const data = (b.data && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
  const audio = (b.audio ?? data?.audio) as { audioUrl?: string; mimeType?: string } | undefined
  const image = (b.image ?? data?.image) as { imageUrl?: string; mimeType?: string; caption?: string } | undefined
  if (audio?.audioUrl && typeof audio.audioUrl === 'string') {
    media = { type: 'audio', url: audio.audioUrl, mimetype: audio.mimeType || 'audio/ogg; codecs=opus' }
  } else if (image?.imageUrl && typeof image.imageUrl === 'string') {
    media = { type: 'image', url: image.imageUrl, mimetype: image.mimeType || 'image/jpeg', caption: image.caption }
  }

  return { from: from.startsWith('55') ? from : `55${from}`, text: text.trim(), messageId, media }
}

/** Cache de messageIds já processados (evitar resposta duplicada quando Z-API envia 2 eventos para o mesmo ato). TTL 90s. */
const processedMessageIds = new Map<string, number>()
const DEDUP_TTL_MS = 90_000
function wasAlreadyProcessed(messageId: string): boolean {
  if (!messageId) return false
  const now = Date.now()
  const t = processedMessageIds.get(messageId)
  if (t && now - t < DEDUP_TTL_MS) return true
  processedMessageIds.set(messageId, now)
  // Limpar entradas antigas
  for (const [id, time] of processedMessageIds.entries()) {
    if (now - time >= DEDUP_TTL_MS) processedMessageIds.delete(id)
  }
  return false
}

/** Dedup por número + texto: Z-API pode enviar 2 eventos (mensagem + callback) com messageIds diferentes; ignorar o segundo. */
const processedPhoneText = new Map<string, number>()
const PHONE_TEXT_DEDUP_MS = 60_000
function normalizeKey(phone: string, text: string): string {
  const t = (text || '').toLowerCase().trim().replace(/\s+/g, ' ')
  return `${phone.replace(/\D/g, '')}_${t}`
}
function wasRecentlyResponded(phone: string, text: string): boolean {
  const key = normalizeKey(phone, text)
  const now = Date.now()
  const t = processedPhoneText.get(key)
  if (t && now - t < PHONE_TEXT_DEDUP_MS) return true
  return false
}
function markResponded(phone: string, text: string): void {
  const key = normalizeKey(phone, text)
  const now = Date.now()
  processedPhoneText.set(key, now)
  for (const [k, time] of processedPhoneText.entries()) {
    if (now - time >= PHONE_TEXT_DEDUP_MS) processedPhoneText.delete(k)
  }
}

/** Cooldown por número após enviar as 2 boas-vindas (intro + botões): evita enviar mensagens extras em evento duplicado. */
const welcomeSentAtByPhone = new Map<string, number>()
// Importante: este cooldown existe só para cortar EVENTOS DUPLICADOS imediatos da Z-API após enviar boas-vindas.
// Não pode bloquear mensagens reais do usuário (ex.: e-mail após cadastro).
const WELCOME_COOLDOWN_MS = 10_000 // 10s
function wasWelcomeJustSent(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  const t = welcomeSentAtByPhone.get(digits)
  const now = Date.now()
  if (t && now - t < WELCOME_COOLDOWN_MS) return true
  if (t) welcomeSentAtByPhone.delete(digits)
  return false
}
function markWelcomeJustSent(phone: string): void {
  const digits = phone.replace(/\D/g, '')
  const now = Date.now()
  welcomeSentAtByPhone.set(digits, now)
  for (const [p, time] of welcomeSentAtByPhone.entries()) {
    if (now - time >= WELCOME_COOLDOWN_MS) welcomeSentAtByPhone.delete(p)
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Mensagens fora do funil: nunca enviar (evita repetição). "Oops! não entendi" é enviada quando o usuário manda comando que a assistente não entende. */
const MSG_BLOQUEADA = 'Em que posso ajudar? 😊'
function isMsgBloqueada(msg: string): boolean {
  const t = (msg || '').trim()
  if (!t) return true
  if (t === MSG_BLOQUEADA) return true
  return false
}

function isQueroUtilizarPlenipayMessage(t: string): boolean {
  if (!t || typeof t !== 'string') return false
  const msg = t.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?]+/g, ' ')
  const temPlenipay = msg.includes('plenipay') || (msg.includes('pleni') && msg.includes('pay'))
  const temIntencao = msg.includes('quero utilizar') || msg.includes('quero usar') || (msg.includes('quero') && (msg.includes('utilizar') || msg.includes('usar') || msg.includes('plenipay')))
  return !!(temPlenipay && temIntencao)
}

function shouldIgnoreEventDuringWelcomeCooldown(text: string): boolean {
  const t = (text || '').replace(/\u200B|\uFEFF/g, '').trim()
  if (!t) return true
  // E-mail ou clique em JÁ CRIEI: sempre processar (pedir e-mail ou receber e-mail).
  const emailOnlyRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (emailOnlyRegex.test(t)) return false
  const lower = t.toLowerCase().replace(/\s+/g, ' ')
  if (/^j[aá]\s*criei$/.test(lower) || /^j[aá]\s*cadastrei$/.test(lower)) return false
  // Este "Olá" é o fallback do parse quando o payload vem sem texto — típico de evento duplicado.
  if (lower === 'olá' || lower === 'ola') return true
  return false
}

/** Envia texto só via Z-API (com delayTyping para "digitando..."). */
async function sendTextReply(
  phone: string,
  message: string,
  options?: { delayTyping?: number }
): Promise<{ success: boolean; error?: string }> {
  const r = await sendTextMessage(phone, message, { delayTyping: options?.delayTyping ?? 2 })
  if (!r.success) console.error('❌ [Z-API Webhook] sendTextMessage falhou:', r.error)
  return r.success ? r : { success: false, error: r.error }
}

/** Envia botão link (button_actions) só via Z-API. */
async function sendButtonActionsReply(
  phone: string,
  body: string,
  buttonActions: { type: string; url?: string; label: string }[]
): Promise<{ success: boolean; error?: string }> {
  const r = await sendButtonActions(phone, body, buttonActions)
  if (!r.success) console.error('❌ [Z-API Webhook] sendButtonActions falhou:', r.error)
  return r.success ? r : { success: false, error: r.error }
}

/** Envia lista de botões (reply) só via Z-API. */
async function sendButtonListReply(
  phone: string,
  body: string,
  buttons: { id: string; title: string }[]
): Promise<{ success: boolean; error?: string }> {
  const r = await sendButtonList(phone, body, buttons)
  if (!r.success) console.error('❌ [Z-API Webhook] sendButtonList falhou:', r.error)
  return r.success ? r : { success: false, error: r.error }
}

/** Assistente responde em qualquer ambiente (localhost e produção). Para desligar em produção use o painel admin "Pausar assistente para todos" ou DISABLE_WHATSAPP_ASSISTENTE_PRODUCAO=true. */
function assistenteDeveResponder(): boolean {
  if (process.env.NODE_ENV === 'production' && process.env.DISABLE_WHATSAPP_ASSISTENTE_PRODUCAO === 'true') {
    return false
  }
  return true
}

const MSG_AUDIO_NAO_ENTENDI = 'Não consegui entender o áudio 😊 Pode digitar a mensagem? Ex.: gastei 50 no mercado'
const MSG_COMPROVANTE_NAO_LEU = `Não consegui ler o comprovante 😊
Envie a foto de novo ou descreva em texto: valor e para quem (ex.: paguei 80 para João).`

/** Headers opcionais para baixar mídia da Z-API (URLs podem ser públicas; se 401, configurar token). */
function getZapiMediaHeaders(): HeadersInit {
  const token = process.env.ZAPI_TOKEN?.trim()
  if (token) return { Authorization: `Bearer ${token}` }
  return {}
}

async function processarEmBackground(parsed: ZapiParsed) {
  const { from } = parsed
  let text = parsed.text
  try {
    // Assistente deve estar sempre ativa para receber mensagens (novos contatos e existentes).
    if (!assistenteDeveResponder()) {
      console.log('🛑 [Z-API Webhook] Assistente desativada (DISABLE_WHATSAPP_ASSISTENTE_PRODUCAO=true ou pausada no admin).')
      return
    }
    if (!isZapiConfigured()) {
      console.error('❌ [Z-API Webhook] Z-API não configurada. Defina ZAPI_INSTANCE_ID e ZAPI_TOKEN no Railway. Não usamos mais API Fácil neste webhook.')
      return
    }
    const phone = from.startsWith('55') ? from : `55${from}`
    const phoneDigits = phone.replace(/\D/g, '')

    // Áudio: baixar → transcrever → usar texto para o PLEN (registro de gasto/recebimento por voz)
    if (parsed.media?.type === 'audio') {
      console.log('🎤 [Z-API Webhook] Áudio recebido, baixando e transcrevendo para', phone)
      try {
        const buffer = await downloadMedia(parsed.media.url, getZapiMediaHeaders())
        if (!buffer || buffer.length === 0) throw new Error('Download do áudio falhou')
        const transcribed = await transcribeAudio(buffer, parsed.media.mimetype || 'audio/ogg')
        text = (transcribed || '').trim()
        if (text) {
          console.log('🎤 [Z-API Webhook] Áudio transcrito:', text.slice(0, 120), '→ PLEN vai registrar como texto')
        } else {
          await sendTextMessage(phone, MSG_AUDIO_NAO_ENTENDI).catch(() => {})
          registerSentMessage(phone, 'Áudio não transcrito')
          return
        }
      } catch (err) {
        console.error('🎤 [Z-API Webhook] Erro ao processar áudio:', err)
        await sendTextMessage(phone, 'Problema ao processar o áudio. Tente enviar de novo ou digite a mensagem (ex.: gastei 50 no mercado).').catch(() => {})
        registerSentMessage(phone, 'Erro ao processar áudio')
        return
      }
    }

    // Imagem (comprovante): baixar → OCR/IA extrair valor e nome → usar comando para o PLEN registrar
    if (parsed.media?.type === 'image') {
      console.log('🖼️ [Z-API Webhook] Imagem de comprovante recebida, baixando e extraindo valor/nome para', phone)
      try {
        const buffer = await downloadMedia(parsed.media.url, getZapiMediaHeaders())
        if (!buffer || buffer.length === 0) throw new Error('Falha ao baixar imagem')
        const comando = await processComprovanteImage(buffer, parsed.media.caption)
        text = (comando || '').trim()
        if (!text) {
          console.error('🖼️ [Z-API Webhook] Nenhum valor/nome extraído da imagem')
          await sendTextMessage(phone, MSG_COMPROVANTE_NAO_LEU).catch(() => {})
          registerSentMessage(phone, MSG_COMPROVANTE_NAO_LEU)
          return
        }
        console.log('🖼️ [Z-API Webhook] Comprovante extraído:', text.slice(0, 80), '→ PLEN vai registrar')
      } catch (err) {
        console.error('🖼️ [Z-API Webhook] Erro ao processar imagem:', err)
        await sendTextMessage(phone, MSG_COMPROVANTE_NAO_LEU).catch(() => {})
        registerSentMessage(phone, MSG_COMPROVANTE_NAO_LEU)
        return
      }
    }

    if (wasRecentlyResponded(phone, text ?? '')) {
      console.log('📨 [Z-API Webhook] Duplicado por número+texto (resposta já enviada nos últimos 60s), ignorando:', phone, text?.slice(0, 30))
      return
    }

    await recordIncomingMessage(phone, text ?? '').catch((e) => console.error('📨 [Z-API Webhook] recordIncomingMessage:', e))

    const envioBoasVindasComRetry = async (): Promise<boolean> => {
      let r = await sendBoasVindasToNumber(phone)
      if (r.success) return true
      console.warn('⚠️ [Z-API Webhook] Primeira tentativa falhou, retry em 2s:', r.error)
      await delay(2000)
      r = await sendBoasVindasToNumber(phone)
      return r.success
    }

    const enviarFallbackContatoNovo = async (): Promise<void> => {
      const primeiraMsg = typeof MENSAGENS_BOAS_VINDAS[0] === 'string' ? MENSAGENS_BOAS_VINDAS[0] : null
      const fallback = primeiraMsg ?? 'Olá! 👋 Sou a Plen, assistente da Plenipay. Cria sua conta em plenipay.com e me manda *JÁ CADASTREI* aqui que eu te ajudo. 💙'
      await sendTextMessage(phone, fallback, { delayTyping: 1 }).catch(() => {})
    }

    // "Quero utilizar PleniPay" — sempre enviar mensagens de boas-vindas (intro + botões).
    if (isQueroUtilizarPlenipayMessage(text) && isBoasVindasConfigured()) {
      console.log('👋 [Z-API Webhook] "Quero utilizar PleniPay" — enviando mensagens de boas-vindas para', phone)
      const ok = await envioBoasVindasComRetry()
      if (ok) {
        await markWelcomeSent(phone).catch(() => {})
        markResponded(phone, text ?? '')
        markWelcomeJustSent(phone)
        console.log('✅ [Z-API Webhook] Boas-vindas enviadas:', phone)
        return
      }
      console.error('❌ [Z-API Webhook] sendBoasVindasToNumber falhou após retry. Enviando fallback.')
      await enviarFallbackContatoNovo()
      markWelcomeJustSent(phone)
      return
    }

    // Contato novo: SEMPRE enviar as 2 mensagens de boas-vindas (intro + uma mensagem com botões CADASTRAR e JÁ CRIEI). Em erro de consulta, tratar como novo.
    const jaRecebeuBoasVindas = await hasReceivedWelcome(phoneDigits).catch(() => false)
    if (!jaRecebeuBoasVindas && isBoasVindasConfigured()) {
      console.log('👋 [Z-API Webhook] Contato novo — enviando mensagens de boas-vindas para', phone)
      const ok = await envioBoasVindasComRetry()
      if (ok) {
        await markWelcomeSent(phone).catch(() => {})
        markResponded(phone, text ?? '')
        markWelcomeJustSent(phone)
        console.log('✅ [Z-API Webhook] Boas-vindas enviadas para contato novo:', phone)
        return
      }
      console.error('❌ [Z-API Webhook] sendBoasVindasToNumber falhou para contato novo após retry. Enviando fallback.')
      await enviarFallbackContatoNovo()
      markWelcomeJustSent(phone)
      return
    }

    // Crítico: não enviar mais nada (intro PLEN, etc.) se acabamos de enviar as 2 boas-vindas — evita mensagens extras
    if (wasWelcomeJustSent(phone) && shouldIgnoreEventDuringWelcomeCooldown(text)) {
      console.log('📨 [Z-API Webhook] Cooldown pós-boas-vindas: ignorando evento duplicado para', phone)
      return
    }

    const plenMessage = buildPlenMessage(from, text)
    const result = await processWhatsAppMessage(plenMessage as any)

    if (result?.messages && Array.isArray(result.messages) && result.messages.length > 0) {
      let firstMessageInSequence = true
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
          if (isMsgBloqueada(msg)) {
            console.log('📨 [Z-API Webhook] Mensagem bloqueada (não enviar):', msg.slice(0, 30))
            firstMessageInSequence = false
            continue
          }
          const send = await sendTextReply(phone, msg, { delayTyping: firstMessageInSequence ? 1 : 0 })
          if (send.success) {
            registerSentMessage(phone, msg)
            console.log('✅ [Z-API Webhook] Mensagem', i + 1, '/', result.messages.length, 'enviada para:', phone)
          } else {
            console.error('❌ [Z-API Webhook] Falha ao enviar:', send.error)
            await sendTextReply(phone, 'Desculpe, tive um problema ao enviar. Tente de novo em um instante. 💙').catch(() => {})
          }
        }
        firstMessageInSequence = false
        if (i < result.messages.length - 1) await delay(280)
      }
      markResponded(phone, text ?? '')
    } else if (result?.message && typeof result.message === 'string') {
      if (isMsgBloqueada(result.message)) {
        console.log('📨 [Z-API Webhook] Resposta bloqueada (não enviar):', result.message.slice(0, 30))
      } else {
      const send = await sendTextReply(phone, result.message, { delayTyping: 2 })
      if (send.success) {
        markResponded(phone, text ?? '')
        registerSentMessage(phone, result.message)
        console.log('✅ [Z-API Webhook] Resposta enviada para:', phone)
      } else {
        console.error('❌ [Z-API Webhook] Falha ao enviar resposta:', send.error)
        await sendTextReply(phone, 'Desculpe, tive um problema ao enviar. Tente de novo em um instante. 💙').catch(() => {})
      }
      }
    } else if (result === null) {
      console.warn('📨 [Z-API Webhook] processWhatsAppMessage retornou null (sem resposta). phone:', phone, 'text:', text?.slice(0, 50))
      const aindaNaoRecebeu = await hasReceivedWelcome(phoneDigits).catch(() => false)
      if (!aindaNaoRecebeu && isBoasVindasConfigured()) {
        console.log('🔄 [Z-API Webhook] Contato sem resposta e sem boas-vindas — enviando mensagem mínima.')
        await enviarFallbackContatoNovo()
      }
    } else {
      console.warn('📨 [Z-API Webhook] Resultado inesperado do handler. phone:', phone, 'keys:', result ? Object.keys(result) : 'null')
      const aindaNaoRecebeu = await hasReceivedWelcome(phoneDigits).catch(() => false)
      if (!aindaNaoRecebeu && isBoasVindasConfigured()) {
        console.log('🔄 [Z-API Webhook] Resultado inesperado e contato sem boas-vindas — enviando mensagem mínima.')
        await enviarFallbackContatoNovo()
      }
    }
  } catch (err) {
    console.error('❌ [Z-API Webhook] Erro em background:', err)
    try {
      const phone = parsed.from.startsWith('55') ? parsed.from : `55${parsed.from}`
      await sendTextMessage(phone, 'Ocorreu um erro ao processar sua mensagem. Tente de novo em um instante. 💙').catch(() => {})
    } catch (_) {}
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
  const body = await request.json().catch(() => null)
  const bodyKeys = body && typeof body === 'object' ? Object.keys(body as object).join(', ') : 'null'
  console.log('🔔 [Z-API Webhook] POST recebido em', new Date().toISOString(), '| body keys:', bodyKeys)
  if (!isZapiConfigured()) {
    console.error('❌ [Z-API Webhook] Z-API não configurada. Configure ZAPI_INSTANCE_ID e ZAPI_TOKEN.')
    return NextResponse.json(
      { success: false, error: 'Z-API não configurada. Configure ZAPI_INSTANCE_ID e ZAPI_TOKEN no Railway.' },
      { status: 503 }
    )
  }
  try {
    const parsed = parseZapiBody(body)
    if (!parsed) {
      console.warn('📨 [Z-API Webhook] Payload ignorado (sem phone/text ou fromMe). Body keys:', body && typeof body === 'object' ? Object.keys(body as object).join(', ') : 'null')
      return NextResponse.json({ success: true, message: 'Payload ignorado' })
    }
    if (parsed.messageId && wasAlreadyProcessed(parsed.messageId)) {
      console.log('📨 [Z-API Webhook] Mensagem duplicada (messageId já processado), ignorando:', parsed.messageId)
      return NextResponse.json({ success: true, message: 'Duplicado ignorado' })
    }
    if (!assistenteDeveResponder()) {
      console.log('🛑 [Z-API Webhook] Assistente desativada — retornando 200 sem processar.')
      return NextResponse.json({ success: true, message: 'Assistente pausada' })
    }
    const isBotao = parsed.text === 'CADASTRAR' || parsed.text === 'JÁ CADASTREI' || /^j[aá]\s*criei$/i.test(parsed.text.trim()) || /^j[aá]\s*cadastrei$/i.test(parsed.text.trim())
    console.log('📨 [Z-API Webhook] Mensagem recebida:', { from: parsed.from, textPreview: parsed.text.slice(0, 80), messageId: parsed.messageId, isCliqueBotao: isBotao, media: parsed.media?.type })
    if (isBotao) console.log('🔘 [Z-API Webhook] Clique em botão reconhecido:', parsed.text)
    await processarEmBackground(parsed)
    return NextResponse.json({ success: true })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    const errStack = err instanceof Error ? err.stack : undefined
    console.error('❌ [Z-API Webhook] Erro:', errMsg, errStack ?? '')
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 })
  }
}
