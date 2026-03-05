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
import { hasReceivedWelcome, markWelcomeSent, recordIncomingMessage, hasReceivedTestIntro, markTestIntroSent, hasCadastro, markEmailConfirmLinkSent } from '@/lib/whatsapp-contatos-pendentes'
import { sendBoasVindasToNumber, isBoasVindasConfigured } from '@/lib/whatsapp-enviar-boas-vindas-lib'
import {
  getMensagemInicialModoTeste,
  parseGastoSimples,
  getMsgGastoRegistradoModoTeste,
  MSG_FOLLOW_UP_CRIAR_CONTA,
  MSG_TESTAR_ANTES,
} from '@/lib/whatsapp-modo-teste'
import {
  getSignupPending,
  setSignupStepNome,
  setSignupStepEmail,
  clearSignupPending,
  isValidEmail,
  isValidNome,
  validateEmailWithHint,
  isSaudacaoOuRespostaGenerica,
  isRecusaOuAdiamentoCadastro,
} from '@/lib/whatsapp-signup-flow'
import { cancelLeadRecoveryOnUserReply, initLeadRecovery, markLeadRecoveryEmailReceived, markLeadRecoveryCadastroConcluido } from '@/lib/whatsapp-lead-recovery'

/** Evita enviar a mesma intro duas vezes quando o webhook é chamado em duplicata (ex.: dois eventos para a mesma mensagem). */
const introSendingNow = new Set<string>()

/** Mensagem de intro (oi, quero usar, quero registrar, etc.) — deve ir para o handler PLEN para responder com intro + botão CADASTRAR, não para o modo teste/LLM. */
function isIntroIntentWebhook(text: string): boolean {
  const t = (text ?? '').toLowerCase().replace(/\s+/g, ' ').trim()
  if (!t || t.length > 200) return false
  const cumprimentos = ['oi', 'olá', 'ola', 'oii', 'oiii', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite']
  if (cumprimentos.some((c) => t === c || t.startsWith(c + ' ') || t === c + '!')) return true
  const temPleni = /pleni\s*pay|plenipay/.test(t)
  if (temPleni && (/quero\s+usar/.test(t) || /quero\s+utilizar/.test(t) || /quero\s+começar/.test(t))) return true
  if (/quero\s+usar\s+(a\s+)?plenipay/i.test(t) || /quero\s+utilizar\s+(a\s+)?plenipay/i.test(t)) return true
  if (/quero\s+registrar\s+(meus?\s+)?(ganhos|gastos|receitas)/i.test(t)) return true
  if (/quero\s+começar\s+a\s+usar/.test(t) && temPleni) return true
  if (t.length <= 60 && /\bquero\s+usar\b/.test(t)) return true
  return false
}

/** True se a mensagem indica "não gastei nada" / "nada" no contexto do modo teste. */
function isRespostaNadaOuNaoGastei(text: string): boolean {
  const raw = (text ?? '').trim()
  if (!raw) return true
  const t = raw.toLowerCase().replace(/\s+/g, ' ')
  // Mensagem curta: só "nada", "não", etc.
  if (t.length <= 80) {
    const short = /^(nada|nao|n[aã]o|nope|zero|nenhum|nenhuma|n[aã]o\s*gastei|n[aã]o\s*gastou|n[aã]o\s*tenho|t[aá]\s*bem|tudo\s*bem|por\s*enquanto\s*n[aã]o|hoje\s*n[aã]o)\s*\.?\s*$/i.test(t)
    if (short || t === 'n' || t === 'nao') return true
  }
  // Mensagem que termina com "nada" (ex.: "Oiii ... Nada")
  if (/\bnada\s*\.?\s*$/i.test(t) || /\bnao\s*\.?\s*$/i.test(t)) return true
  return false
}
import { extrairNomeComOpenAI } from '@/lib/openai-validar-nome'
import { criarContaFromWhatsApp } from '@/lib/criar-conta-whatsapp'
import { downloadMedia, transcribeAudio, processComprovanteImage } from '@/lib/whatsapp-media-processor'

/** pushName = nome do contato no WhatsApp (usado na mensagem "registrado com sucesso (Nome)"). */
function buildPlenMessage(from: string, text: string, contactName?: string | null) {
  const remoteJid = from.includes('@') ? from : `${from.replace(/\D/g, '')}@s.whatsapp.net`
  const name = (contactName ?? '').trim().slice(0, 80) || undefined
  return {
    key: { remoteJid, id: `zapi-${Date.now()}` },
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000),
    ...(name ? { pushName: name } : {}),
  }
}

/** Mapear clique em botão Z-API para o texto que o handler reconhece */
function buttonIdToText(buttonId: string, label?: string): string {
  const id = (buttonId || '').toLowerCase().trim().replace(/\s+/g, '_')
  const lbl = (label || '').trim()
  if (id === 'cadastrar') return 'CADASTRAR'
  if (lbl && /^cadastrar$/i.test(lbl.replace(/\s+/g, ''))) return 'CADASTRAR'
  if (id === 'ja_cadastrei' || id === 'já_criei' || id === 'ja_criei') return 'JÁ CADASTREI'
  if (id === 'reenviar_codigo' || (lbl && /^reenviar\s*c[oó]digo$/i.test(lbl.replace(/\s+/g, ' ')))) return 'reenviar o email'
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

export type ZapiParsed = { from: string; text: string; messageId?: string; media?: ZapiMedia; contactName?: string }

/** Extrair phone, text, messageId e mídia (áudio/imagem) do payload Z-API. Aceita vários formatos (on-message-received, ReceivedCallBack, data.text, audio.audioUrl, image.imageUrl, etc.). */
function parseZapiBody(body: unknown, logReject?: (reason: string) => void): ZapiParsed | null {
  if (!body || typeof body !== 'object') {
    logReject?.('body vazio ou não é objeto')
    return null
  }
  const b = body as Record<string, unknown>
  const data = (b.data && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>

  if (b.fromMe === true) {
    logReject?.('fromMe=true (mensagem enviada pelo número conectado na Z-API — ignorada; a assistente só responde quando ALGUÉM envia para a Plen)')
    return null
  }
  const eventType = String((b.type as string) || (data.type as string) || '').trim()

  // Em grupos, o remetente real pode vir em participantPhone
  const rawPhone =
    (b.participantPhone as string) ||
    (data.participantPhone as string) ||
    (b.phone as string) ||
    (b.from as string) ||
    (b.senderPhone as string) ||
    (b.chatId as string)?.replace(/@.*$/, '') ||
    (data.phone as string) ||
    (data.from as string) ||
    (data.senderPhone as string) ||
    ''
  const phoneStr = String(rawPhone || '').trim()
  if (!phoneStr) {
    logReject?.('sem phone (keys: ' + Object.keys(b).join(', ') + ')')
    return null
  }
  const connectedPhone = String((b.connectedPhone as string) || (data.connectedPhone as string) || '').replace(/\D/g, '')
  const phoneDigits = phoneStr.replace(/\D/g, '')
  if (phoneDigits.length < 10) {
    logReject?.('phone com menos de 10 dígitos: ' + phoneStr)
    return null
  }
  if (connectedPhone && phoneDigits === connectedPhone) {
    logReject?.('phone é o próprio conectado (ignorar)')
    return null
  }
  if (!connectedPhone && phoneDigits.length >= 10 && phoneDigits.length <= 13) {
    const envPhone = process.env.ZAPI_CONNECTED_PHONE?.replace(/\D/g, '')
    if (envPhone && phoneDigits === envPhone) {
      logReject?.('phone igual ZAPI_CONNECTED_PHONE')
      return null
    }
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
    const dText = d.text
    if (dText && typeof dText === 'object' && typeof (dText as { message?: string }).message === 'string') {
      text = (dText as { message: string }).message
    } else {
      text = (d.text as string) || (d.message as string) || (d.body as string) || ''
    }
  }
  if (typeof b.messageText === 'string') text = text || b.messageText
  if (!text && data && typeof data.text === 'object' && (data.text as { message?: string })?.message) {
    text = (data.text as { message: string }).message
  }
  // messageData.text (formato alternativo Z-API)
  const messageData = (b.messageData ?? data.messageData) as { text?: string; message?: string } | undefined
  if (!text?.trim() && messageData && typeof messageData === 'object') {
    const mdText = messageData.text ?? (messageData as { message?: string }).message
    if (typeof mdText === 'string' && mdText.trim()) text = mdText
  }
  // Reforço: se tem phone mas não extraiu texto, tratar como "Olá" para não descartar contato novo
  const hadRealText = !!text.trim()
  if (!text.trim()) text = 'Olá'

  // Ignorar callbacks de status (RECEIVED, READ, etc.) apenas quando não há texto de mensagem — evita descartar mensagens reais
  if (eventType && /MessageStatus|DeliveryCallback|ReadCallback|Connect|Disconnect|SentCallBack/i.test(eventType) && !hadRealText) {
    logReject?.('evento ignorado (type=' + eventType + ')')
    return null
  }

  const from = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits
  let messageId: string | undefined = typeof b.messageId === 'string' ? b.messageId : undefined
  if (!messageId && b.data && typeof b.data === 'object') {
    const mid = (b.data as Record<string, unknown>).messageId
    if (typeof mid === 'string') messageId = mid
  }

  // Mídia: Z-API envia audio.audioUrl / image.imageUrl (top-level ou em data)
  let media: ZapiMedia | undefined
  const dataObj = (b.data && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
  const audio = (b.audio ?? dataObj?.audio) as { audioUrl?: string; mimeType?: string } | undefined
  const image = (b.image ?? dataObj?.image) as { imageUrl?: string; mimeType?: string; caption?: string } | undefined
  if (audio?.audioUrl && typeof audio.audioUrl === 'string') {
    media = { type: 'audio', url: audio.audioUrl, mimetype: audio.mimeType || 'audio/ogg; codecs=opus' }
  } else   if (image?.imageUrl && typeof image.imageUrl === 'string') {
    media = { type: 'image', url: image.imageUrl, mimetype: image.mimeType || 'image/jpeg', caption: image.caption }
  }

  const contactNameRaw =
    (b.senderName as string) ||
    (b.chatName as string) ||
    (b.pushName as string) ||
    (b.contactName as string) ||
    (data.senderName as string) ||
    (data.chatName as string) ||
    (data.pushName as string) ||
    (data.contactName as string) ||
    (b.contact && typeof b.contact === 'object' && ((b.contact as Record<string, unknown>).displayName as string)) ||
    (dataObj.contact && typeof dataObj.contact === 'object' && ((dataObj.contact as Record<string, unknown>).displayName as string)) ||
    ''
  const contactNameTrimmed = typeof contactNameRaw === 'string' ? contactNameRaw.trim().slice(0, 80) : ''
  const contactNameDigits = contactNameTrimmed.replace(/\D/g, '')
  const contactName =
    contactNameTrimmed && contactNameDigits.length < 10
      ? contactNameTrimmed
      : undefined

  return { from: from.startsWith('55') ? from : `55${from}`, text: text.trim(), messageId, media, contactName }
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

/** Anti-spam: máximo de mensagens enviadas por número por hora (evita bloqueio WhatsApp Business). */
const RATE_LIMIT_MS = 60 * 60 * 1000 // 1 hora
const RATE_LIMIT_MAX = 25 // máx. respostas ao mesmo número por hora
const rateLimitByPhone = new Map<string, { count: number; windowStart: number }>()
function isOverRateLimit(phoneDigits: string): boolean {
  const now = Date.now()
  let entry = rateLimitByPhone.get(phoneDigits)
  if (!entry) {
    rateLimitByPhone.set(phoneDigits, { count: 1, windowStart: now })
    return false
  }
  if (now - entry.windowStart >= RATE_LIMIT_MS) {
    entry = { count: 1, windowStart: now }
    rateLimitByPhone.set(phoneDigits, entry)
    return false
  }
  if (entry.count >= RATE_LIMIT_MAX) return true
  entry.count++
  return false
}

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
  const temIntencao =
    msg.includes('quero utilizar') ||
    msg.includes('quero usar') ||
    msg.includes('utilizar a plenipay') ||
    msg.includes('usar a plenipay') ||
    (msg.includes('quero') && (msg.includes('utilizar') || msg.includes('usar') || msg.includes('plenipay')))
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

/** Números permitidos em localhost. Variável: WHATSAPP_TEST_NUMBERS=5531994467805 ou 31994467805 (com ou sem 55). */
function getTestNumbers(): string[] {
  const raw = process.env.WHATSAPP_TEST_NUMBERS || ''
  if (!raw.trim()) return []
  return raw
    .split(',')
    .map((n) => n.replace(/\D/g, '').trim())
    .filter(Boolean)
    .map((n) => (n.length <= 11 ? `55${n}` : n))
}

function isAllowedTestNumber(phoneDigits: string, testNumbers: string[]): boolean {
  if (testNumbers.length === 0) return true
  const with55 = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`
  return testNumbers.some((t) => t.replace(/\D/g, '') === with55.replace(/\D/g, '') || t.replace(/\D/g, '') === phoneDigits.replace(/\D/g, ''))
}

/** Síncrono: só verifica env. Para decisão completa (incl. pausa no admin) use assistenteDeveResponderAsync. */
function assistenteDeveResponder(): boolean {
  if (process.env.NODE_ENV === 'production' && process.env.DISABLE_WHATSAPP_ASSISTENTE_PRODUCAO === 'true') {
    return false
  }
  return true
}

/** Assistente deve responder? Respeita env e pausa global do painel admin (platform_config). Quando pausada, não responde a ninguém. */
async function assistenteDeveResponderAsync(): Promise<boolean> {
  if (!assistenteDeveResponder()) return false
  try {
    const { getAssistenteGlobalPausada } = await import('@/lib/assistente-global-pausada')
    if (await getAssistenteGlobalPausada()) return false
  } catch (_) {}
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
    // Respeitar pausa global do admin: quando pausada, não responder a ninguém.
    if (!(await assistenteDeveResponderAsync())) {
      console.log('🛑 [Z-API Webhook] Assistente desativada (env ou pausada no admin) — não enviar resposta.')
      return
    }
    if (!isZapiConfigured()) {
      console.error('❌ [Z-API Webhook] Z-API não configurada. Defina ZAPI_INSTANCE_ID e ZAPI_TOKEN no Railway. Não usamos mais API Fácil neste webhook.')
      return
    }
    const phone = from.startsWith('55') ? from : `55${from}`
    const phoneDigits = phone.replace(/\D/g, '')

    if (isOverRateLimit(phoneDigits)) {
      console.warn('⚠️ [Z-API Webhook] Rate limit: muitos envios para', phone, '— aguardar 1h')
      const contactName = parsed.contactName
      const nome = contactName?.trim() ? ` ${contactName.trim().slice(0, 30)}` : ''
      await sendTextMessage(phone, `Oi${nome}! 💙 Estamos recebendo muitas mensagens. Aguarde alguns minutos para continuar.`, { delayTyping: 1 }).catch(() => {})
      return
    }

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
    await cancelLeadRecoveryOnUserReply(phone).catch(() => {})

    const contactName = parsed.contactName

    /** Envia apenas a mensagem única do modo teste (sem botões). Retry em caso de falha. */
    const envioBoasVindasComRetry = async (): Promise<boolean> => {
      let r = await sendBoasVindasToNumber(phone, { contactName })
      if (r.success) return true
      console.warn('⚠️ [Z-API Webhook] Primeira tentativa falhou, retry em 2s:', r.error)
      await delay(2000)
      r = await sendBoasVindasToNumber(phone, { contactName })
      return r.success
    }

    /** Fallback: mesma mensagem do modo teste (só texto). Marca como enviado para não reenviar. */
    const enviarFallbackContatoNovo = async (): Promise<void> => {
      const msg = getMensagemInicialModoTeste(contactName)
      const sent = await sendTextMessage(phone, msg, { delayTyping: 1 }).catch(() => ({ success: false }))
      if (sent?.success) {
        await markTestIntroSent(phone).catch(() => {})
        await markWelcomeSent(phone).catch(() => {})
      }
    }

    // Modo teste inicial: contato novo primeiro recebe "Me diga algo que você gastou hoje"; na segunda mensagem, registramos o gasto e oferecemos criar conta.
    const jaRecebeuBoasVindas = await hasReceivedWelcome(phone).catch(() => false)
    const jaRecebeuTestIntro = await hasReceivedTestIntro(phone).catch(() => false)
    const temCadastro = await hasCadastro(phoneDigits).catch(() => false)
    const signupPending = await getSignupPending(phoneDigits).catch(() => null)

    // Fluxo de criação de conta pelo WhatsApp: aguardando nome ou e-mail.
    if (signupPending) {
      // Lead disse que não quer criar conta agora / quer só testar → entender contexto e sair do fluxo.
      if (isRecusaOuAdiamentoCadastro(text ?? '')) {
        await clearSignupPending(phone)
        await sendTextMessage(
          phone,
          'Tudo bem! 💙 Quando quiser criar sua conta é só me avisar ou digitar *CADASTRAR*.\n\nPor enquanto pode *testar*: me diga um gasto do dia (ex.: 50 mercado, 20 uber) que eu registro e te mostro como funciona.',
          { delayTyping: 1 }
        ).catch(() => {})
        markResponded(phone, text ?? '')
        console.log('📧 [Z-API Webhook] Lead adiou cadastro — fluxo limpo, convite a testar:', phone)
        return
      }
      if (signupPending.step === 'nome') {
        const nome = (text ?? '').trim()
        // Identificar contexto: saudação ou resposta genérica não é nome — não avançar nem chamar LLM.
        if (isSaudacaoOuRespostaGenerica(nome)) {
          await sendTextMessage(
            phone,
            'Oi! 💙 Para criar sua conta preciso do seu *nome completo*. Ex.: Maria Silva.',
            { delayTyping: 1 }
          ).catch(() => {})
          markResponded(phone, text ?? '')
          console.log('📧 [Z-API Webhook] Cadastro WhatsApp — mensagem é saudação/resposta genérica, pedindo nome completo de novo:', phone)
          return
        }
        let nomeFinal = nome
        if (!isValidNome(nome)) {
          const extraido = await extrairNomeComOpenAI(nome).catch(() => null)
          if (extraido && isValidNome(extraido)) nomeFinal = extraido
        }
        if (isValidNome(nomeFinal)) {
          await setSignupStepEmail(phone, nomeFinal)
          await initLeadRecovery(phone).catch(() => {})
          await sendTextMessage(phone, 'Qual seu e-mail?', { delayTyping: 1 }).catch(() => {})
          markResponded(phone, text ?? '')
          console.log('📧 [Z-API Webhook] Cadastro WhatsApp — nome recebido', nomeFinal !== nome ? `(extraído: ${nomeFinal})` : '', 'aguardando e-mail para', phone)
        } else {
          await sendTextMessage(phone, 'Me diga seu nome (ex.: Maria Silva).', { delayTyping: 1 }).catch(() => {})
          markResponded(phone, text ?? '')
        }
        return
      }
      if (signupPending.step === 'email') {
        const email = (text ?? '').trim().toLowerCase()
        const emailCheck = validateEmailWithHint(email)
        if (!emailCheck.valid) {
          await sendTextMessage(phone, emailCheck.hint, { delayTyping: 1 }).catch(() => {})
          markResponded(phone, text ?? '')
          return
        }
        await markLeadRecoveryEmailReceived(phone).catch(() => {})
        const nomeParaConta = (signupPending.nome || '').trim()
        console.log('📧 [Z-API Webhook] Criando conta WhatsApp | nome:', nomeParaConta || '(vazio)', '| email:', email, '| phone:', phoneDigits)
        const result = await criarContaFromWhatsApp(nomeParaConta, email, phoneDigits)
        if (result.success) {
          const nomeExibir = nomeParaConta || 'pessoa'
          const emailFoiEnviado = result.emailEnviado !== false
          const msgSucesso = emailFoiEnviado
            ? `Perfeito ${nomeExibir} 💙\n\nEnviei um *código de 6 dígitos* no seu e-mail. Digite o código aqui na conversa que eu confirmo sua conta.\n\nDepois disso você pode me dizer seus gastos e receitas. Por exemplo:\n• "gastei 200 com roupas"\n• "recebi 1500 salário"\n• "extra de 300"`
            : `Conta criada, ${nomeExibir} 💙\n\n*Não consegui enviar* o e-mail com o código (falha no servidor). Por favor, me avise aqui que eu te oriento — ou um administrador pode reenviar o código.\n\nSe receber o e-mail depois, digite o código de 6 dígitos aqui na conversa. 💙`
          await sendTextMessage(phone, msgSucesso, { delayTyping: 1 }).catch(() => {})
          if (!emailFoiEnviado && result.emailError) {
            console.error('📧 [Z-API Webhook] E-mail do código não enviado:', result.emailError)
          }
          if (emailFoiEnviado) await markEmailConfirmLinkSent(phone).catch(() => {})
          await markWelcomeSent(phone).catch(() => {})
          await markLeadRecoveryCadastroConcluido(phone).catch(() => {})
          await clearSignupPending(phone)
          markResponded(phone, text ?? '')
          console.log('✅ [Z-API Webhook] Conta criada pelo WhatsApp para', phone)
        } else {
          if (result.error) console.error('📧 [Z-API Webhook] Criar conta falhou (não expor ao lead):', result.error)
          await sendTextMessage(
            phone,
            'Um momento, parece que estão fazendo uma pequena manutenção e eu já volto aqui. 💙',
            { delayTyping: 1 }
          ).catch(() => {})
          markResponded(phone, text ?? '')
        }
        return
      }
    }

    // "CADASTRAR" ou "quero criar conta" (não "sim" — "sim" = quer testar primeiro) → iniciar fluxo de cadastro.
    const textNorm = (text ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
    const isCadastrarMessage =
      (text ?? '').trim() === 'CADASTRAR' ||
      /^cadastrar$/i.test((text ?? '').trim()) ||
      /^(quero|vamos)\s*criar\s*(minha\s*)?conta$/i.test((text ?? '').trim()) ||
      /^quero\s*criar$/i.test(textNorm)
    if (!temCadastro && !signupPending && isCadastrarMessage && isBoasVindasConfigured()) {
      await setSignupStepNome(phone)
      await sendTextMessage(
        phone,
        'O cadastro é feito aqui pelo WhatsApp! 💙\n\nMe diga seu nome (ex.: Maria) que eu crio sua conta e envio o código de confirmação no seu e-mail.',
        { delayTyping: 1 }
      ).catch(() => {})
      markResponded(phone, text ?? '')
      console.log('📧 [Z-API Webhook] Cadastro pelo WhatsApp iniciado para', phone)
      return
    }

    // Modo teste: sem cadastro + mensagem que parece gasto simples ("30 carro", "50 mercado") → fluxo teste (não exige jaRecebeuTestIntro para evitar falha de marcação).
    const gastoModoTeste = parseGastoSimples(text ?? '')
    if (
      !temCadastro &&
      !signupPending &&
      gastoModoTeste &&
      !isQueroUtilizarPlenipayMessage(text) &&
      !isCadastrarMessage &&
      isBoasVindasConfigured()
    ) {
      const gasto = gastoModoTeste
        console.log('🧪 [Z-API Webhook] Modo teste (2ª msg) — gasto registrado:', gasto.valor, gasto.categoria, 'para', phone)
        const msgRegistro = getMsgGastoRegistradoModoTeste(gasto.categoria, gasto.valor, undefined, contactName)
        await sendTextMessage(phone, msgRegistro, { delayTyping: 1 }).catch(() => {})
        await delay(800)
        await sendTextMessage(phone, MSG_FOLLOW_UP_CRIAR_CONTA, { delayTyping: 1 }).catch(() => {})
        await delay(800)
        await setSignupStepNome(phone)
        await sendTextMessage(
          phone,
          'Me diga seu nome (ex.: Maria) que eu crio sua conta e envio o código de confirmação no seu e-mail.',
          { delayTyping: 1 }
        ).catch(() => {})
        await markWelcomeSent(phone).catch(() => {})
        markResponded(phone, text ?? '')
        markWelcomeJustSent(phone)
        console.log('✅ [Z-API Webhook] Modo teste concluído — solicitando nome:', phone)
      return
    }

    // Modo teste: já recebeu intro e usuário respondeu "nada" / "não gastei" → resposta inteligente (não repetir intro nem formato).
    if (
      !temCadastro &&
      !signupPending &&
      jaRecebeuTestIntro &&
      isRespostaNadaOuNaoGastei(text) &&
      !isCadastrarMessage &&
      isBoasVindasConfigured()
    ) {
      await sendTextMessage(
        phone,
        'Tudo bem! 😊 Quando tiver algum gasto pode me contar. Quer criar sua conta já? Assim organizo tudo pra você.',
        { delayTyping: 1 }
      ).catch(() => {})
      await delay(600)
      await sendTextMessage(phone, MSG_FOLLOW_UP_CRIAR_CONTA, { delayTyping: 1 }).catch(() => {})
      await delay(600)
      await setSignupStepNome(phone)
      await sendTextMessage(
        phone,
        'Me diga seu nome (ex.: Maria) que eu crio sua conta e envio o código de confirmação no seu e-mail.',
        { delayTyping: 1 }
      ).catch(() => {})
      markResponded(phone, text ?? '')
      return
    }

    // Modo teste: já recebeu intro mas mensagem não é gasto válido → LLM explica Plenipay e convida a testar/cadastrar.
    if (
      !temCadastro &&
      !signupPending &&
      jaRecebeuTestIntro &&
      !isQueroUtilizarPlenipayMessage(text) &&
      !isCadastrarMessage &&
      isBoasVindasConfigured()
    ) {
      const leadTestContext = `Lead no fluxo de teste da Plenipay (ainda não tem conta). Pedimos para ele dizer um gasto do dia (ex: 50 mercado). Ele respondeu com a mensagem abaixo. Responda de forma amigável e organizada: explique brevemente o que é a Plenipay, responda à dúvida ou objeção dele, e no final convide a testar com um gasto (ex: 50 mercado, 20 uber) ou a criar a conta aqui pelo WhatsApp (digite CADASTRAR ou me diga seu nome — não mencione link nem site para cadastro). Máximo 4-5 frases curtas. Use formatação WhatsApp (*negrito* para ênfase).`
      let msgResposta: string
      try {
        const { getPlenLLMResponse } = await import('@/lib/plen-llm-fallback')
        const llmResposta = await getPlenLLMResponse({
          userMessage: (text ?? '').trim(),
          context: leadTestContext,
          productMode: true,
        })
        msgResposta = (llmResposta && llmResposta.trim()) ? llmResposta.trim() : 'Me diga um gasto no formato: valor e o que foi. Ex: 50 mercado, 20 uber'
      } catch (_) {
        msgResposta = 'Me diga um gasto no formato: valor e o que foi. Ex: 50 mercado, 20 uber'
      }
      await sendTextMessage(phone, msgResposta, { delayTyping: 1 }).catch(() => {})
      markResponded(phone, text ?? '')
      return
    }

    // "Quero utilizar Plenipay" (primeira vez, sem cadastro): enviar apresentação breve + convite a testar.
    if (isQueroUtilizarPlenipayMessage(text) && isBoasVindasConfigured() && !temCadastro && !jaRecebeuTestIntro) {
      const apresentacao = getMensagemInicialModoTeste(contactName)
      await sendTextMessage(phone, apresentacao, { delayTyping: 1 }).catch(() => {})
      await markTestIntroSent(phone).catch(() => {})
      await markWelcomeSent(phone).catch(() => {})
      markResponded(phone, text ?? '')
      console.log('👋 [Z-API Webhook] "Quero utilizar Plenipay" — enviada apresentação + teste para lead:', phone)
      return
    }

    // Só tratar como "modo teste" (intro/gasto/testar antes) quando o lead ainda NÃO tem conta. Quem já tem cadastro (ex.: acabou de criar e está aguardando confirmar email) deve cair no handler principal (processWhatsAppMessage).
    // Mensagens de intro (oi, quero usar, etc.) vão para o handler PLEN para responder com intro + botão CADASTRAR — não interceptar aqui.
    if (!jaRecebeuBoasVindas && isBoasVindasConfigured() && !temCadastro && !isIntroIntentWebhook(text ?? '')) {
      // 1) Primeira mensagem do lead: intro já foi enviada pelo WhatsApp (saudação). Só marcar e processar a resposta.
      if (!jaRecebeuTestIntro) {
        await markTestIntroSent(phone).catch(() => {})
        console.log('🧪 [Z-API Webhook] Intro enviada pelo WhatsApp (saudação) — processando primeira resposta do lead:', phone)
        // Não enviar nossa intro; cair no bloco 2) para processar gasto / nada / LLM.
      }

      // 2) Intro já enviada (por nós antes ou pelo WhatsApp) → processar resposta: gasto, "nada" ou LLM
      const gasto = parseGastoSimples(text ?? '')
      if (gasto) {
        console.log('🧪 [Z-API Webhook] Modo teste — gasto registrado:', gasto.valor, gasto.categoria, 'para', phone)
        const msgRegistro = getMsgGastoRegistradoModoTeste(gasto.categoria, gasto.valor, undefined, contactName)
        await sendTextMessage(phone, msgRegistro, { delayTyping: 1 }).catch(() => {})
        await delay(800)
        await sendTextMessage(phone, MSG_FOLLOW_UP_CRIAR_CONTA, { delayTyping: 1 }).catch(() => {})
        await delay(800)
        await setSignupStepNome(phone)
        await sendTextMessage(
          phone,
          'Me diga seu nome (ex.: Maria) que eu crio sua conta e envio o código de confirmação no seu e-mail.',
          { delayTyping: 1 }
        ).catch(() => {})
        await markWelcomeSent(phone).catch(() => {})
        markResponded(phone, text ?? '')
        markWelcomeJustSent(phone)
        console.log('✅ [Z-API Webhook] Modo teste concluído para', phone, '— solicitando nome.')
        return
      }

      // Resposta "nada" / "não gastei" → mensagem única, sem repetir intro nem pedir formato
      if (isRespostaNadaOuNaoGastei(text)) {
        await sendTextMessage(
          phone,
          'Tudo bem! 😊 Quando tiver algum gasto pode me contar. Quer criar sua conta já? Assim organizo tudo pra você.',
          { delayTyping: 1 }
        ).catch(() => {})
        await delay(600)
        await sendTextMessage(phone, MSG_FOLLOW_UP_CRIAR_CONTA, { delayTyping: 1 }).catch(() => {})
        await delay(600)
        await setSignupStepNome(phone)
        await sendTextMessage(
          phone,
          'Me diga seu nome (ex.: Maria) que eu crio sua conta e envio o código de confirmação no seu e-mail.',
          { delayTyping: 1 }
        ).catch(() => {})
        markResponded(phone, text ?? '')
        return
      }

      // Não pareceu um gasto → pedir para testar antes (gasto ou entrada)
      await sendTextMessage(phone, MSG_TESTAR_ANTES, { delayTyping: 1 }).catch(() => {})
      markResponded(phone, text ?? '')
      return
    }

    // "Quero utilizar PleniPay" — enviar apresentação breve + convite a testar (fluxo: apresentação → teste free → cadastro).
    if (isQueroUtilizarPlenipayMessage(text) && isBoasVindasConfigured()) {
      if (introSendingNow.has(phone)) {
        markResponded(phone, text ?? '')
        return
      }
      introSendingNow.add(phone)
      try {
        if (!temCadastro) {
          const apresentacao = getMensagemInicialModoTeste(contactName)
          await sendTextMessage(phone, apresentacao, { delayTyping: 1 }).catch(() => {})
          console.log('👋 [Z-API Webhook] "Quero utilizar PleniPay" — enviada apresentação + convite a testar:', phone)
        } else {
          console.log('👋 [Z-API Webhook] "Quero utilizar PleniPay" — já tem cadastro; marcando intro:', phone)
        }
        await markTestIntroSent(phone).catch(() => {})
        await markWelcomeSent(phone).catch(() => {})
        markResponded(phone, text ?? '')
        markWelcomeJustSent(phone)
      } finally {
        introSendingNow.delete(phone)
      }
      return
    }

    // Crítico: não enviar mais nada (intro PLEN, etc.) se acabamos de enviar as 2 boas-vindas — evita mensagens extras
    if (wasWelcomeJustSent(phone) && shouldIgnoreEventDuringWelcomeCooldown(text)) {
      console.log('📨 [Z-API Webhook] Cooldown pós-boas-vindas: ignorando evento duplicado para', phone)
      return
    }

    const plenMessage = buildPlenMessage(from, text, contactName)
    const result = await processWhatsAppMessage(plenMessage as any)

    if (result?.skipReply === true) {
      console.log('🛑 [Z-API Webhook] skipReply: aguardando humano — não enviar resposta')
      markResponded(phone, text ?? '')
      return
    }

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
            console.error('❌ [Z-API Webhook] Falha ao enviar botões:', send.error, '— enviando só o texto')
            const fallback = await sendTextMessage(phone, body, { delayTyping: firstMessageInSequence ? 1 : 0 }).catch(() => ({ success: false }))
            if (fallback?.success) registerSentMessage(phone, body)
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
    } else if (result?.message && typeof result.message === 'string' && result.message.trim()) {
      if (isMsgBloqueada(result.message)) {
        console.log('📨 [Z-API Webhook] Resposta bloqueada (não enviar):', result.message.slice(0, 30))
        markResponded(phone, text ?? '')
      } else {
      const send = await sendTextReply(phone, result.message.trim(), { delayTyping: 2 })
      if (send.success) {
        markResponded(phone, text ?? '')
        registerSentMessage(phone, result.message)
        console.log('✅ [Z-API Webhook] Resposta enviada para:', phone)
      } else {
        console.error('❌ [Z-API Webhook] Falha ao enviar resposta:', send.error)
        await sendTextReply(phone, 'Desculpe, tive um problema ao enviar. Tente de novo em um instante. 💙').catch(() => {})
      }
      }
    } else if (result === null || (result && !result.messages?.length && !(typeof result.message === 'string' && result.message.trim()))) {
      const motivo = result === null ? 'null' : 'sem mensagem válida'
      console.warn('📨 [Z-API Webhook] processWhatsAppMessage', motivo, '— phone:', phone, 'text:', text?.slice(0, 50))
      // Se a assistente está pausada no admin, não enviar nenhum fallback (silêncio).
      if (!(await assistenteDeveResponderAsync())) {
        console.log('🛑 [Z-API Webhook] Assistente pausada — não enviar fallback.')
        return
      }
      // Quem já tem cadastro (ex.: acabou de receber "Enviei link para confirmar email") deve sempre receber resposta — fallback contextual
      if (temCadastro) {
        const msgFallback =
          'Agora é só abrir seu *email* (e a pasta de *spam*), clicar no *link* que enviamos e sua conta fica ativa. 💙\n\nDepois volte aqui e me diga um gasto ou receita que eu registro! Ex.: "gastei 200 com roupas" ou "recebi 1500 salário".'
        await sendTextReply(phone, msgFallback, { delayTyping: 1 }).catch(() => {})
        markResponded(phone, text ?? '')
        console.log('📨 [Z-API Webhook] Fallback para cadastro (pós-email): resposta enviada para', phone)
        return
      }
      const jaRecebeu = await hasReceivedWelcome(phoneDigits).catch(() => false)
      if (!jaRecebeu && isBoasVindasConfigured()) {
        console.log('🔄 [Z-API Webhook] Contato sem resposta e sem boas-vindas — enviando mensagem mínima.')
        await enviarFallbackContatoNovo()
      } else {
        const nome = contactName?.trim() ? `, ${contactName.trim().slice(0, 30)}` : ''
        await sendTextReply(phone, `Em que posso ajudar${nome}? 😊`, { delayTyping: 1 }).catch(() => {})
        markResponded(phone, text ?? '')
      }
    } else {
      console.warn('📨 [Z-API Webhook] Resultado inesperado do handler. phone:', phone, 'keys:', result ? Object.keys(result) : 'null')
      if (!(await assistenteDeveResponderAsync())) {
        console.log('🛑 [Z-API Webhook] Assistente pausada — não enviar fallback.')
        return
      }
      const jaRecebeu = await hasReceivedWelcome(phoneDigits).catch(() => false)
      if (!jaRecebeu && isBoasVindasConfigured()) {
        console.log('🔄 [Z-API Webhook] Resultado inesperado e contato sem boas-vindas — enviando mensagem mínima.')
        await enviarFallbackContatoNovo()
      } else {
        const nome = contactName?.trim() ? `, ${contactName.trim().slice(0, 30)}` : ''
        await sendTextReply(phone, `Em que posso ajudar${nome}? 😊`, { delayTyping: 1 }).catch(() => {})
        markResponded(phone, text ?? '')
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
  // Log imediato: confirma que a requisição chegou ao app (útil com ngrok/localhost)
  console.log('🔔 [Z-API Webhook] POST recebido', new Date().toISOString())
  const body = await request.json().catch((e) => {
    console.warn('📨 [Z-API Webhook] Body não é JSON válido:', e instanceof Error ? e.message : String(e))
    return null
  })
  const bodyKeys = body && typeof body === 'object' ? Object.keys(body as object).join(', ') : 'null'
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const phoneRaw = b ? (b.phone ?? b.from ?? (b.data && typeof b.data === 'object' ? (b.data as Record<string, unknown>).phone : null)) : null
  const fromMe = b ? b.fromMe : null
  const type = b ? (b.type ?? (b.data && typeof b.data === 'object' ? (b.data as Record<string, unknown>).type : null)) : null
  console.log('🔔 [Z-API Webhook] POST recebido', new Date().toISOString(), '| keys:', bodyKeys, '| phone:', phoneRaw, '| fromMe:', fromMe, '| type:', type)
  if (!isZapiConfigured()) {
    console.error('❌ [Z-API Webhook] Z-API não configurada. Configure ZAPI_INSTANCE_ID e ZAPI_TOKEN.')
    return NextResponse.json(
      { success: false, error: 'Z-API não configurada. Configure ZAPI_INSTANCE_ID e ZAPI_TOKEN no Railway.' },
      { status: 503 }
    )
  }
  try {
    const parsed = parseZapiBody(body, (reason) => {
      console.warn('📨 [Z-API Webhook] Payload ignorado:', reason, '| body keys:', body && typeof body === 'object' ? Object.keys(body as object).join(', ') : 'null')
    })
    if (!parsed) {
      const preview = body != null ? JSON.stringify(body).slice(0, 500) : 'null'
      console.warn('📨 [Z-API Webhook] Payload ignorado. Body (preview):', preview)
      if (process.env.NODE_ENV === 'development' && body != null) {
        try {
          console.warn('📨 [Z-API Webhook] Body completo (dev):', JSON.stringify(body, null, 2).slice(0, 3000))
        } catch (_) {}
      }
      return NextResponse.json({ success: true, message: 'Payload ignorado' })
    }
    console.log('📨 [Z-API Webhook] Payload aceito. from:', parsed.from, 'text:', parsed.text?.slice(0, 80))
    if (parsed.messageId && wasAlreadyProcessed(parsed.messageId)) {
      console.log('📨 [Z-API Webhook] Mensagem duplicada (messageId já processado), ignorando:', parsed.messageId)
      return NextResponse.json({ success: true, message: 'Duplicado ignorado' })
    }
    if (!(await assistenteDeveResponderAsync())) {
      console.log('🛑 [Z-API Webhook] Assistente desativada (env ou pausada no admin) — retornando 200 sem processar.')
      return NextResponse.json({ success: true, message: 'Assistente pausada' })
    }
    // Em localhost: só processar mensagens do(s) número(s) em WHATSAPP_TEST_NUMBERS (ex.: 31994467805).
    const testNumbers = getTestNumbers()
    const phoneDigits = parsed.from.replace(/\D/g, '')
    if (process.env.NODE_ENV === 'development' && testNumbers.length > 0 && !isAllowedTestNumber(phoneDigits, testNumbers)) {
      console.log('🔒 [Z-API Webhook] Localhost: ignorando número', parsed.from, '— apenas', testNumbers.join(', '), 'podem receber resposta.')
      return NextResponse.json({ success: true, message: 'Modo localhost: apenas WHATSAPP_TEST_NUMBERS' })
    }
    const isBotao = parsed.text === 'CADASTRAR' || parsed.text === 'JÁ CADASTREI' || /^j[aá]\s*criei$/i.test(parsed.text.trim()) || /^j[aá]\s*cadastrei$/i.test(parsed.text.trim())
    console.log('📨 [Z-API Webhook] Mensagem recebida:', { from: parsed.from, textPreview: parsed.text.slice(0, 80), messageId: parsed.messageId, isCliqueBotao: isBotao, media: parsed.media?.type })
    if (isBotao) console.log('🔘 [Z-API Webhook] Clique em botão reconhecido:', parsed.text)
    try {
      await processarEmBackground(parsed)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const errStack = err instanceof Error ? err.stack : undefined
      console.error('❌ [Z-API Webhook] Erro ao processar (resposta 200 para não quebrar integração):', errMsg, errStack ?? '')
      try {
        const phone = parsed.from.startsWith('55') ? parsed.from : `55${parsed.from}`
        await sendTextMessage(phone, 'Ocorreu um erro ao processar. Tente de novo em um instante. 💙').catch(() => {})
      } catch (_) {}
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('❌ [Z-API Webhook] Erro no POST (retornando 200 para manter webhook ativo):', errMsg)
    return NextResponse.json({ success: true, message: 'Erro interno registrado' })
  }
}
