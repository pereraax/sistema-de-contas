/**
 * Webhook da API Fácil (apifacil.dev) para mensagens WhatsApp.
 * A API Fácil chama esta URL quando uma mensagem é recebida na instância conectada.
 * Sem esta rota, o assistente PLEN nunca recebe as mensagens (404).
 *
 * Fluxos suportados:
 * - TEXTO: mensagem digitada → PLEN interpreta (registro, dúvidas, etc.) → envia resposta.
 * - ÁUDIO: detecta áudio (tipo_envio AUDIO_RECEBIDO ou URL de áudio) → baixa arquivo →
 *   transcreve (Gemini/Groq/OpenAI) → usa o texto transcrito como se fosse mensagem digitada →
 *   PLEN processa e gera a mesma resposta (ex.: "📌 Gasto R$ 50,00 ...") → envia ao usuário.
 * - IMAGEM: comprovante → extrai valor/nome (IA) → PLEN registra → envia confirmação.
 *
 * Para áudio funcionar, a API Fácil deve enviar no payload: tipo_envio (ou tipo_mensagem) de áudio
 * e URL do arquivo (url_media, media_url ou mensagem com URL). Se enviar só texto (ex.: transcrição
 * pronta "paguei 2.00"), o sistema trata como texto e aplica regras de correção quando possível.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage, registerSentMessage } from '@/lib/whatsapp-plen-handler'
import { sendTextMessage, sendReplyButtons, sendCtaUrlButton, isApifacilConfigured } from '@/lib/whatsapp-apifacil'
import { recordIncomingMessage, markWelcomeSent, hasReceivedWelcome } from '@/lib/whatsapp-contatos-pendentes'

/** Normalizar número (evita dependência do bundle que falhava com normalizarPhone importado). */
function normalizarPhone(phone: string): string {
  const limpo = String(phone || '').replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}
import { ensureAudioWebhookEnabled } from '@/lib/whatsapp-apifacil-config'
import { detectMedia, processComprovanteImage, downloadMedia, transcribeAudio } from '@/lib/whatsapp-media-processor'
import { createAdminClient } from '@/lib/supabase/server'

/** Uma vez por deploy: ao detectar texto "paguei 2.00" em vez de áudio, tenta corrigir tipos_envio na API Fácil. */
let audioConfigFixTried = false

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

/** Cache de IDs já processados para evitar resposta duplicada (API Fácil pode enviar 2 webhooks para o mesmo áudio). TTL 3 min. */
const processedWebhookIds = new Map<string, number>()
const DEDUPE_TTL_MS = 180_000

function isAlreadyProcessed(bodyToParse: Record<string, unknown>, from: string): boolean {
  const id = bodyToParse.id ?? (bodyToParse.data && typeof bodyToParse.data === 'object' ? (bodyToParse.data as Record<string, unknown>).id : undefined)
  const mensagemId = bodyToParse.mensagem_id ?? (bodyToParse.data && typeof bodyToParse.data === 'object' ? (bodyToParse.data as Record<string, unknown>).mensagem_id : undefined)
  const key = [id, mensagemId].filter((v) => v != null).length ? `${String(id ?? '')}-${String(mensagemId ?? '')}-${from}` : ''
  if (!key) return false
  const now = Date.now()
  for (const [k, ts] of processedWebhookIds.entries()) {
    if (now - ts > DEDUPE_TTL_MS) processedWebhookIds.delete(k)
  }
  if (processedWebhookIds.has(key)) return true
  processedWebhookIds.set(key, now)
  return false
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

/** Retorna true se a assistente está pausada para este número (humano deve atender). Nunca lança. */
async function isAssistentePausadaParaNumero(phoneDigits: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    if (!admin) return false
    const phone = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`
    const { data: session, error: sessionError } = await admin
      .from('whatsapp_sessions')
      .select('user_id')
      .eq('phone_number', phone)
      .maybeSingle()
    if (sessionError || !session?.user_id) return false
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('assistente_pausada')
      .eq('id', session.user_id)
      .maybeSingle()
    if (profileError) return false
    return profile?.assistente_pausada === true
  } catch (_) {
    return false
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
  // Meta Cloud API: message.text.body
  if (!text && (b as any).message?.text?.body) text = (b as any).message.text.body
  if (from && text) {
    const fromClean = String(from).replace(/\D/g, '')
    return { from: fromClean, text: String(text) }
  }

  return null
}

type MediaPayload = { type: 'audio'; url: string; mimetype: string } | { type: 'image'; url: string; mimetype: string; caption?: string }

/** Quando tipo_envio = AUDIO_RECEBIDO, a API Fácil pode enviar a URL em vários campos. Extrair de forma explícita. */
function getAudioUrlFromPayload(body: Record<string, unknown>): string | null {
  const data = (body.data && typeof body.data === 'object' ? body.data : body) as Record<string, unknown>
  const candidates = [
    body.url_media,
    data.url_media,
    body.media_url,
    data.media_url,
    body.url_midia,
    data.url_midia,
    body.url,
    data.url,
    body.audio_url,
    (body as any).arquivo_audio,
    body.file_url,
    (body as any).link_media,
    body.mensagem,
    data.mensagem,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().startsWith('http')) return c.trim()
  }
  return null
}

/** Extrai from e opcionalmente text ou mídia (áudio/imagem). Áudio: prioriza tipo_envio AUDIO_RECEBIDO + URL explícita. */
function parseWebhookBodyWithMedia(body: unknown): { from: string; text?: string; media?: MediaPayload } | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  const tipoEnvio = String((b.tipo_envio ?? (b.data && typeof b.data === 'object' ? (b.data as Record<string, unknown>).tipo_envio : '')) || '').trim()
  if (tipoEnvio === 'MENSAGEM_ENVIADA') return null

  const data = (b.data && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
  // event whatsapp_insert = mensagem recebida (API Fácil); sem tipo_envio tratamos como recebida para pegar origem/mensagem
  const isRecebida =
    b.event === 'whatsapp_insert' ||
    /MENSAGEM_RECEBIDA|AUDIO_RECEBIDO|IMAGEM_RECEBIDA/i.test(tipoEnvio)
  let from = (isRecebida ? (data.origem ?? b.origem ?? data.numero_telefone_origem ?? b.numero_telefone_origem) : null)
    ?? (data.destino ?? b.destino ?? data.origem ?? data.from ?? b.origem ?? b.from ?? data.telefone ?? data.numero ?? b.telefone ?? b.numero) as string | undefined
  if (from && (String(from).includes('@') || String(from).replace(/\D/g, '').length < 10)) {
    const numOrigem = (data.numero_telefone_origem ?? b.numero_telefone_origem) as string | undefined
    const numLimpo = numOrigem ? String(numOrigem).replace(/\D/g, '') : ''
    if (numLimpo.length >= 10) from = numOrigem
  }
  if (!from) return null

  const fromClean = String(from).replace(/\D/g, '')
  if (fromClean.length < 10) return null
  const textRaw = (data.mensagem ?? data.text ?? data.message ?? b.mensagem ?? b.text ?? (b as any).message ?? (data as any)?.body) as string | undefined
  const text = textRaw != null ? String(textRaw).trim() : ''

  // 1) ÁUDIO: prioridade para tipo_envio AUDIO_RECEBIDO com URL em qualquer campo conhecido
  if (/AUDIO_RECEBIDO/i.test(tipoEnvio)) {
    const audioUrl = getAudioUrlFromPayload(b)
    if (audioUrl) {
      console.log('🎤 [Apifacil Webhook] Áudio detectado (tipo_envio=AUDIO_RECEBIDO):', audioUrl.slice(0, 80))
      return { from: fromClean, media: { type: 'audio', url: audioUrl, mimetype: 'audio/ogg' } }
    }
  }

  // 2) Mídia genérica (detectMedia)
  const media = detectMedia(body as any)
  if (media?.type === 'audio' && media.url) {
    return { from: fromClean, media: { type: 'audio', url: media.url, mimetype: media.mimetype || 'audio/ogg' } }
  }
  if (media?.type === 'image' && media.url) {
    return { from: fromClean, media: { type: 'image', url: media.url, mimetype: media.mimetype || 'image/jpeg', caption: media.caption } }
  }

  // 3) Só texto (mensagem não é URL)
  if (text && !/^https?:\/\//i.test(text)) return { from: fromClean, text }
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

/** Mensagem "quero utilizar plenipay" deve SEMPRE receber as 3 de boas-vindas, mesmo com assistente pausada. */
function isQueroUtilizarPlenipayMessage(t: string): boolean {
  if (!t || typeof t !== 'string') return false
  const msg = t
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?]+/g, ' ') // normalizar pontuação para não falhar "Olá! Quero"
  const temPlenipay = msg.includes('plenipay') || (msg.includes('pleni') && msg.includes('pay'))
  const temIntencao =
    msg.includes('quero utilizar') ||
    msg.includes('quero usar') ||
    (msg.includes('quero') && (msg.includes('utilizar') || msg.includes('usar') || msg.includes('plenipay')))
  return temPlenipay && temIntencao
}

/** Conteúdo das 3 mensagens de boas-vindas "quero utilizar plenipay" — usado como fallback se o handler falhar. */
const BOAS_VINDAS_QUERO_UTILIZAR = [
  `Oiii 👋💙\nEu sou a Plen, sua assistente financeira 🤖✨\nE eu já estou prontinha pra começar a te ajudar a organizar tudo por aqui!\n\nAntes da gente começar, cria sua conta rapidinho lá no site 🌐\nÉ bem rápido mesmo, prometo! ⏱️💙`,
  { type: 'buttons' as const, body: 'Para que eu consiga te reconhecer e registrar tudo certinho, preciso que você salve meu contato, tá bem? 💙🥺\n\nEscolha abaixo:', buttons: [{ id: 'cadastrar', title: 'CADASTRAR' }, { id: 'ja_cadastrei', title: 'JÁ CADASTREI' }] },
  `Assim que finalizar o cadastro, me envia seu e-mail aqui 📩\nVou verificar tudo certinho e já te liberar pra começar a registrar seus gastos e colocar suas economias em ordem 💸📊✨\n\nEu fico responsável por anotar tudo pra você direto pelo WhatsApp, combinado? 😉`,
]

/** Processar mensagem e enviar resposta em background (não bloqueia a resposta do webhook) */
async function processarEmBackground(parsed: {
  from: string
  text?: string
  media?: { type: 'audio'; url: string; mimetype: string } | { type: 'image'; url: string; mimetype: string; caption?: string }
}) {
  const { from, text: textInicial, media } = parsed
  const phoneDigits = from.replace(/\D/g, '')
  let text = textInicial
  let origemMensagem: 'texto' | 'áudio' | 'imagem' = 'texto'
  try {
    if (media?.type === 'audio') {
      origemMensagem = 'áudio'
      const phoneAudio = from.startsWith('55') ? from : `55${from}`
      console.log('🎤 [Apifacil Webhook] Processando ÁUDIO: origem (quem enviou)=' + from + ' → resposta será enviada para ' + phoneAudio)
      try {
        const buffer = await downloadMedia(media.url, getMediaFetchHeaders())
        if (!buffer || buffer.length === 0) throw new Error('Download do áudio falhou')
        const transcribed = await transcribeAudio(buffer, media.mimetype || 'audio/ogg')
        text = (transcribed || '').trim()
        if (text) {
          console.log('🎤 [Apifacil Webhook] Áudio transcrito:', text.slice(0, 120), '→ será processado pelo PLEN como texto')
        } else {
          if (isApifacilConfigured()) {
            const phone = from.startsWith('55') ? from : `55${from}`
            await sendTextMessage(
              phone,
              'Não consegui entender o áudio 😅 Pode digitar a mensagem? Ex.: gastei 50 no mercado'
            )
            registerSentMessage(phone, 'Transcrição do áudio falhou (cota/API).')
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
      origemMensagem = 'imagem'
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

    const phone = from.startsWith('55') ? from : `55${from}`

    // PRIORIDADE MÁXIMA: "Olá! Quero utilizar a Plenipay" — responder IMEDIATAMENTE (antes de qualquer DB)
    // para não depender de hasReceivedWelcome/timeout e garantir resposta em segundos
    if (isQueroUtilizarPlenipayMessage(text) && isApifacilConfigured()) {
      console.log('👋 [Apifacil Webhook] "Quero utilizar PleniPay" detectado — enviando 3 mensagens IMEDIATAMENTE para', phone)
      try {
        for (let i = 0; i < BOAS_VINDAS_QUERO_UTILIZAR.length; i++) {
          const msg = BOAS_VINDAS_QUERO_UTILIZAR[i]
          if (typeof msg === 'string' && msg.trim()) {
            const send = await sendTextMessage(phone, msg)
            if (send.success) registerSentMessage(phone, msg)
          } else if (typeof msg === 'object' && msg !== null && (msg as any).type === 'buttons') {
            const { body, buttons } = msg as { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }
            const send = await sendReplyButtons(phone, body, buttons)
            if (send.success) registerSentMessage(phone, `${body}\n\n${buttons.map((b) => b.title).join(' / ')}`)
            else {
              const linkMsg = `Para que eu consiga te reconhecer e registrar tudo certinho, preciso que você salve meu contato, tá bem? 💙🥺\n\nEscolha abaixo:\n\n🔗 Cadastro: https://plenipay.com\n\n*CADASTRAR* — abrir site\n*JÁ CADASTREI* — já criei minha conta`
              await sendTextMessage(phone, linkMsg)
              registerSentMessage(phone, linkMsg)
            }
          }
          if (i < BOAS_VINDAS_QUERO_UTILIZAR.length - 1) await delay(1200)
        }
        await recordIncomingMessage(from, text).catch((e) => console.error('📨 [Apifacil Webhook] recordIncomingMessage:', e))
        await markWelcomeSent(phone).catch((e) => console.error('📨 [Apifacil Webhook] markWelcomeSent:', e))
        console.log('✅ [Apifacil Webhook] 3 mensagens de boas-vindas enviadas (resposta imediata):', phone)
        return
      } catch (err) {
        console.error('❌ [Apifacil Webhook] Erro ao enviar boas-vindas (resposta imediata):', err)
        // segue para o fluxo normal (pode reenviar via PLEN handler)
      }
    }

    // Registrar contato (para lista de pendentes e hasReceivedWelcome)
    await recordIncomingMessage(from, text).catch((e) => console.error('📨 [Apifacil Webhook] recordIncomingMessage:', e))

    // CONTATO NOVO (não é "quero utilizar"): quem ainda não recebeu as 3 mensagens recebe agora
    const jaRecebeuBoasVindas = await hasReceivedWelcome(phoneDigits)
    if (!jaRecebeuBoasVindas && isApifacilConfigured()) {
      console.log('👋 [Apifacil Webhook] Contato novo (sem boas-vindas) — enviando as 3 mensagens para', phone)
      try {
        for (let i = 0; i < BOAS_VINDAS_QUERO_UTILIZAR.length; i++) {
          const msg = BOAS_VINDAS_QUERO_UTILIZAR[i]
          if (typeof msg === 'string' && msg.trim()) {
            const send = await sendTextMessage(phone, msg)
            if (send.success) registerSentMessage(phone, msg)
          } else if (typeof msg === 'object' && msg !== null && (msg as any).type === 'buttons') {
            const { body, buttons } = msg as { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }
            const send = await sendReplyButtons(phone, body, buttons)
            if (send.success) registerSentMessage(phone, `${body}\n\n${buttons.map((b) => b.title).join(' / ')}`)
            else {
              const linkMsg = `Para que eu consiga te reconhecer e registrar tudo certinho, preciso que você salve meu contato, tá bem? 💙🥺\n\nEscolha abaixo:\n\n🔗 Cadastro: https://plenipay.com\n\n*CADASTRAR* — abrir site\n*JÁ CADASTREI* — já criei minha conta`
              await sendTextMessage(phone, linkMsg)
              registerSentMessage(phone, linkMsg)
            }
          }
          if (i < BOAS_VINDAS_QUERO_UTILIZAR.length - 1) await delay(1500)
        }
        await markWelcomeSent(phone).catch((e) => console.error('📨 [Apifacil Webhook] markWelcomeSent:', e))
        console.log('✅ [Apifacil Webhook] 3 mensagens enviadas para contato novo:', phone)
        return
      } catch (err) {
        console.error('❌ [Apifacil Webhook] Erro ao enviar boas-vindas para contato novo:', err)
      }
    }

    // Assistente pausada: não responder automaticamente, EXCETO para "quero utilizar plenipay" (reenviar as 3)
    if (await isAssistentePausadaParaNumero(phoneDigits)) {
      if (!isQueroUtilizarPlenipayMessage(text)) {
        console.log('⏸️ [Apifacil Webhook] Assistente pausada para este contato — não enviando resposta automática (humano pode atender).', phoneDigits)
        return
      }
      console.log('👋 [Apifacil Webhook] "Quero utilizar PleniPay" — respondendo com as 3 mensagens mesmo com assistente pausada:', phoneDigits)
    }

    // "Quero utilizar PleniPay" (quem já recebeu antes): reenviar as 3 mensagens se pedir de novo
    const ehQueroUtilizar = isQueroUtilizarPlenipayMessage(text)
    if (!ehQueroUtilizar) {
      const txtLower = String(text).trim().toLowerCase()
      const trechosNossasMensagens = [
        'eu sou a plen',
        'sua assistente financeira',
        'oiii',
        'antes da gente começar',
        'cria sua conta',
        'lá no site',
        'assim que finalizar o cadastro',
        'me envia seu e-mail',
        'escolha abaixo',
      ]
      const pareceEcoNossaMensagem = trechosNossasMensagens.some((trecho) => txtLower.includes(trecho))
      const soSaudacaoCurta = /^(o+i+!?|olá!?|ola!?)\s*$/i.test(String(text).trim()) || txtLower === 'oi' || txtLower === 'olá' || txtLower === 'ola'
      if (pareceEcoNossaMensagem || soSaudacaoCurta) {
        console.log('📨 [Apifacil Webhook] Ignorando (eco ou saudação curta):', txtLower.slice(0, 80))
        return
      }
    } else {
      console.log('👋 [Apifacil Webhook] Mensagem "quero utilizar PleniPay" — processando (pode reenviar 3 msgs via PLEN)')
    }

    // Quando a API Fácil envia só TEXTO em vez do áudio (ex.: "paguei 2.00"), não registrar 2 — pedir para digitar
    const txtNorm = text.trim()
    if (
      !media &&
      (/^(gastei|paguei)\s+2(\.0{0,2})?\s*$/i.test(txtNorm) ||
        /^dois\s*reais?\.?$/i.test(txtNorm) ||
        /^(gastei|paguei)\s+dois\s*reais?\.?$/i.test(txtNorm))
    ) {
      const phone = from.startsWith('55') ? from : `55${from}`
      if (isApifacilConfigured()) {
        await sendTextMessage(
          phone,
          'Recebi só um resumo do seu áudio (valor 2). Para registrar o valor certo, **digite** a frase, por exemplo:\n\ngastei 50 no mercado\npaguei 200 com roupas'
        )
        registerSentMessage(phone, 'Pedido para digitar valor (evitar 2 fixo).')
      }
      console.log('📨 [Apifacil Webhook] Texto "paguei 2" recebido em vez de áudio — pedimos para o usuário digitar.')
      return
    }

    // Texto (digitado, transcrito do áudio ou extraído da imagem) → PLEN interpreta e gera resposta
    const plenMessage = buildPlenMessage(from, text)
    let result: Awaited<ReturnType<typeof processWhatsAppMessage>> = null
    try {
      result = await processWhatsAppMessage(plenMessage as any)
    } catch (plenErr: unknown) {
      const msg = plenErr instanceof Error ? plenErr.message : String(plenErr)
      const stack = plenErr instanceof Error ? plenErr.stack : ''
      console.error('❌ [Apifacil Webhook] processWhatsAppMessage lançou:', msg)
      console.error('❌ [Apifacil Webhook] Stack:', stack?.substring(0, 600) ?? '')
      try {
        const { addLog } = await import('@/lib/server-logs')
        addLog('error', `[Apifacil Webhook] processWhatsAppMessage: ${msg}`)
      } catch (_) {}
      result = { success: true, message: 'Desculpe, tive um problema. Tente novamente.' }
    }
    if (origemMensagem !== 'texto') {
      console.log('📤 [Apifacil Webhook] Resposta do PLEN (origem:', origemMensagem + '):', result?.message ? String(result.message).slice(0, 80) : result?.messages?.length ? `${result.messages.length} msg(s)` : '—')
    }
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
            console.error('❌ [Apifacil Webhook] Falha ao enviar botões', i + 1, ':', send.error, '- enviando link de cadastro como texto')
            // Garantir que a segunda mensagem (link de cadastro) sempre seja enviada
            const cadastroUrl = 'https://plenipay.com'
            const linkMsg = `Para que eu consiga te reconhecer e registrar tudo certinho, preciso que você salve meu contato, tá bem? 💙🥺\n\nEscolha abaixo:\n\n🔗 Cadastro: ${cadastroUrl}\n\n*CADASTRAR* — abrir site\n*JÁ CADASTREI* — já criei minha conta`
            const sendLink = await sendTextMessage(phone, linkMsg)
            if (sendLink.success) {
              registerSentMessage(phone, linkMsg)
              console.log('✅ [Apifacil Webhook] Link de cadastro enviado como fallback para:', phone)
            } else {
              console.error('❌ [Apifacil Webhook] Falha ao enviar link de cadastro:', sendLink.error)
            }
          }
        } else if (typeof msg === 'object' && msg !== null && (msg as any).type === 'button_actions') {
          // Botão com URL: enviar via cta_url para aparecer como botão sem preview da página.
          const { body, buttonActions } = msg as { type: 'button_actions'; body: string; buttonActions: { type: string; url?: string; label: string }[] }
          const urlBtn = buttonActions?.find((a) => a.type === 'URL' && a.url)
          if (urlBtn?.url) {
            const sendBtn = await sendCtaUrlButton(phone, body, urlBtn.label || 'ABRIR', urlBtn.url)
            if (sendBtn.success) {
              registerSentMessage(phone, `${body}\n\n[${urlBtn.label}]`)
              console.log('✅ [Apifacil Webhook] Botão (cta_url) enviado para:', phone, sendBtn.usedFallback ? '(fallback)' : '')
            } else {
              console.error('❌ [Apifacil Webhook] Falha ao enviar botão cta_url:', sendBtn.error)
              const sendBody = await sendTextMessage(phone, body)
              if (sendBody.success) registerSentMessage(phone, body)
              await delay(600)
              await sendTextMessage(phone, `${urlBtn.label}: ${urlBtn.url}`)
            }
          } else {
            const sendBody = await sendTextMessage(phone, body)
            if (sendBody.success) {
              registerSentMessage(phone, body)
              console.log('✅ [Apifacil Webhook] Texto (button_actions sem URL)', i + 1, 'enviado para:', phone)
            }
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
      // Marcar que já respondemos (qualquer quantidade) — assim o contato sai da lista de pendentes
      markWelcomeSent(phone).catch((e) => console.error('📨 [Apifacil Webhook] markWelcomeSent:', e))
    } else if (result?.message && typeof result.message === 'string') {
      const send = await sendTextMessage(phone, result.message)
      if (send.success) {
        registerSentMessage(phone, result.message)
        console.log('✅ [Apifacil Webhook] Resposta enviada para:', phone)
        // Marcar que já respondemos — contato sai da lista de pendentes (não reenvio)
        markWelcomeSent(phone).catch((e) => console.error('📨 [Apifacil Webhook] markWelcomeSent:', e))
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
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    const errStack = err instanceof Error ? err.stack : ''
    console.error('❌ [Apifacil Webhook] Erro no processamento em background:', errMsg)
    console.error('❌ [Apifacil Webhook] Stack:', errStack?.substring(0, 800) ?? '')
    try {
      const { addLog } = await import('@/lib/server-logs')
      addLog('error', `[Apifacil Webhook] Erro no processamento: ${errMsg}`)
    } catch (_) {}
    const phone = from.startsWith('55') ? from : `55${from}`
    // Fallback: se a mensagem era "quero utilizar plenipay", enviar as 3 de boas-vindas mesmo com erro no handler
    const textoRecebido = typeof text === 'string' ? text : (text ? String(text) : '')
    if (isApifacilConfigured() && isQueroUtilizarPlenipayMessage(textoRecebido)) {
      try {
        console.log('👋 [Apifacil Webhook] Fallback: enviando 3 mensagens de boas-vindas após erro no handler')
        for (let i = 0; i < BOAS_VINDAS_QUERO_UTILIZAR.length; i++) {
          const msg = BOAS_VINDAS_QUERO_UTILIZAR[i]
          if (typeof msg === 'string' && msg.trim()) {
            const send = await sendTextMessage(phone, msg)
            if (send.success) registerSentMessage(phone, msg)
          } else if (typeof msg === 'object' && msg !== null && (msg as any).type === 'buttons') {
            const { body, buttons } = msg as { type: 'buttons'; body: string; buttons: { id: string; title: string }[] }
            const send = await sendReplyButtons(phone, body, buttons)
            if (send.success) registerSentMessage(phone, `${body}\n\n${buttons.map((b) => b.title).join(' / ')}`)
            else {
              const linkMsg = `Para que eu consiga te reconhecer e registrar tudo certinho, preciso que você salve meu contato, tá bem? 💙🥺\n\nEscolha abaixo:\n\n🔗 Cadastro: https://plenipay.com\n\n*CADASTRAR* — abrir site\n*JÁ CADASTREI* — já criei minha conta`
              await sendTextMessage(phone, linkMsg)
              registerSentMessage(phone, linkMsg)
            }
          }
          if (i < BOAS_VINDAS_QUERO_UTILIZAR.length - 1) await delay(1500)
        }
        markWelcomeSent(phone).catch((e) => console.error('📨 [Apifacil Webhook] markWelcomeSent:', e))
        return
      } catch (fallbackErr) {
        console.error('❌ [Apifacil Webhook] Fallback boas-vindas também falhou:', fallbackErr)
      }
    }
    try {
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
  // Responder 200 o mais cedo possível para a API Fácil não marcar como Pendente (timeout ~10–30s)
  let parsed: { from: string; text?: string; media?: { type: 'audio'; url: string; mimetype: string } | { type: 'image'; url: string; mimetype: string; caption?: string } } | null = null
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

    // API Fácil envia os dados da mensagem dentro de "payload" (event whatsapp_insert). Unificar para o resto do código ver tipo_envio, mensagem, url_media, origem.
    const rawBody = body as Record<string, unknown>
    const payload = rawBody.payload && typeof rawBody.payload === 'object' ? (rawBody.payload as Record<string, unknown>) : null
    const bodyToParse = payload ? { ...rawBody, ...payload } : rawBody

    const b = bodyToParse as Record<string, unknown>
    // Notificação de ERRO de envio (ex.: botão falhou — "Não foi possível enviar sua mensagem"): não processar como mensagem do usuário
    const erroEnvio = b.erro === true || String(b.status || '').toUpperCase() === 'ERRO'
    const tipoEnvioPayload = String(b.tipo_envio ?? '').toUpperCase()
    if (erroEnvio) {
      const msgErro = typeof b.mensagem === 'string' ? b.mensagem : '(sem mensagem)'
      console.log('📨 [Apifacil Webhook] Notificação de erro de envio ignorada (não é mensagem do usuário):', msgErro.slice(0, 120))
      // Quando o envio de BOTÃO falhou, enviar fallback (link de cadastro em texto) para o destino (usuário)
      if (tipoEnvioPayload === 'BOTAO_ENVIADO' && isApifacilConfigured()) {
        const destino = String(b.destino ?? b.numero_telefone_destino ?? '').replace(/\D/g, '')
        const phone = destino.startsWith('55') ? destino : destino ? `55${destino}` : ''
        if (phone) {
          const cadastroUrl = 'https://plenipay.com'
          const fallbackMsg = `Para que eu consiga te reconhecer e registrar tudo certinho, preciso que você salve meu contato, tá bem? 💙🥺\n\nEscolha abaixo:\n\n🔗 Cadastre-se aqui: ${cadastroUrl}\n\n*CADASTRAR* — abrir site\n*JÁ CADASTREI* — já criei minha conta`
          sendTextMessage(phone, fallbackMsg)
            .then((r) => {
              if (r.success) {
                console.log('✅ [Apifacil Webhook] Fallback (link cadastro) enviado para', phone, 'após erro de botão')
                registerSentMessage(phone, fallbackMsg)
              } else {
                console.error('❌ [Apifacil Webhook] Falha ao enviar fallback após erro botão:', r.error)
              }
            })
            .catch((e) => console.error('❌ [Apifacil Webhook] Erro ao enviar fallback após erro botão:', e))
        }
      }
      return NextResponse.json({ success: true, message: 'Notificação de erro de envio ignorada' })
    }
    const data = (b.data && typeof b.data === 'object' ? b.data : b) as Record<string, unknown>
    const tipoEnvio = (b.tipo_envio ?? data.tipo_envio) as string | undefined
    const mensagemPreview = (b.mensagem ?? data.mensagem) as string | undefined
    const urlMedia = b.url_media ?? data.url_media ?? data.url_midia ?? data.media_url ?? b.url ?? data.url ?? mensagemPreview
    const mensagemEhUrl = typeof urlMedia === 'string' && /^https?:\/\//i.test(urlMedia)
    const payloadKeys = payload ? Object.keys(payload) : []
    // Uma linha só para aparecer em qualquer painel de logs (busque: APIFACIL_WEBHOOK_PAYLOAD)
    const payloadKeysStr = payloadKeys.length ? payloadKeys.join(',') : 'sem_payload'
    const msgPreview = typeof mensagemPreview === 'string' ? mensagemPreview.slice(0, 80).replace(/\n/g, ' ') : 'não_string'
    console.log('APIFACIL_WEBHOOK_PAYLOAD tipo_envio=' + String(tipoEnvio || '') + ' payload_keys=' + payloadKeysStr + ' tem_url_media=' + (!!urlMedia && mensagemEhUrl) + ' mensagem_preview=' + msgPreview + ' from=' + String(b.origem ?? data.origem ?? ''))
    console.log('📨 [Apifacil Webhook] Payload recebido:', {
      keys: Object.keys(bodyToParse),
      payload_keys: payloadKeys.length ? payloadKeys : '(sem payload)',
      tipo_envio: tipoEnvio,
      tem_url_media: !!urlMedia && mensagemEhUrl,
      mensagem_preview: typeof mensagemPreview === 'string' ? mensagemPreview.slice(0, 100) : '(não é string)',
      from: b.origem ?? data.origem,
    })
    // Diagnóstico: listar todos os campos que podem ser URL de mídia (para áudio quando API envia em outro nome)
    const possiveisUrlAudio = [
      b.url_media, data.url_media, b.media_url, data.media_url, b.url, data.url,
      (bodyToParse as any).audio_url, (bodyToParse as any).arquivo_audio, (bodyToParse as any).file_url, (bodyToParse as any).link_media,
    ].filter((v) => typeof v === 'string' && /^https?:\/\//i.test(v))
    if (possiveisUrlAudio.length > 0) {
      console.log('📨 [Apifacil Webhook] Possível URL de mídia encontrada:', possiveisUrlAudio[0].slice(0, 80))
    }
    if (tipoEnvio && /AUDIO/i.test(String(tipoEnvio))) {
      console.log('📨 [Apifacil Webhook] ÁUDIO detectado no tipo_envio. url_media?', !!urlMedia, 'mensagem é URL?', mensagemEhUrl)
    }

    parsed = parseWebhookBodyWithMedia(bodyToParse)
    if (!parsed) {
      const fallback = parseWebhookBody(bodyToParse)
      if (fallback) parsed = { from: fallback.from, text: fallback.text }
    }
    if (parsed && !parsed.media) {
      const data = (bodyToParse as any).data || bodyToParse
      const te = ((bodyToParse as any).tipo_envio ?? data?.tipo_envio) as string
      const url =
        data?.url_media ?? data?.url_midia ?? data?.media_url ?? data?.url ?? data?.mensagem
        ?? (bodyToParse as any).url_media ?? (bodyToParse as any).audio_url ?? (bodyToParse as any).file_url ?? (bodyToParse as any).link_media
        ?? (bodyToParse as any).mensagem
      if (te && typeof url === 'string' && url.startsWith('http')) {
        const tipo = /AUDIO_RECEBIDO/i.test(te) ? 'audio' : /IMAGEM_RECEBIDA|IMAGE/i.test(te) ? 'image' : null
        if (tipo) {
          parsed = { ...parsed, media: { type: tipo as 'audio' | 'image', url, mimetype: tipo === 'audio' ? 'audio/ogg' : 'image/jpeg', caption: tipo === 'image' ? (data?.caption ?? data?.legenda ?? '') : undefined } }
          console.log('📨 [Apifacil Webhook] Mídia obtida por fallback (tipo_envio + URL):', tipo, url.slice(0, 60))
        }
      }
    }
    if (!parsed) {
      const rawPreview = JSON.stringify(bodyToParse).slice(0, 600)
      const keys = bodyToParse && typeof bodyToParse === 'object' ? Object.keys(bodyToParse as object).join(', ') : 'null'
      console.log('📨 [Apifacil Webhook] Payload não reconhecido (sem from/text). Keys:', keys, '| Body:', rawPreview)
      return NextResponse.json({ success: true, message: 'Payload ignorado (sem from/text)' })
    }

    const { from } = parsed
    if (isAlreadyProcessed(bodyToParse as Record<string, unknown>, from)) {
      console.log('📨 [Apifacil Webhook] Ignorando payload duplicado (id/mensagem_id já processado).', { from })
      return NextResponse.json({ success: true, message: 'Payload já processado (deduplicado)' })
    }
    const textPreview = parsed.text ? parsed.text.slice(0, 80) : parsed.media ? `[${parsed.media.type}]` : ''
    console.log('📨 [Apifacil Webhook] MENSAGEM RECEBIDA:', { from, textPreview, mediaType: parsed.media?.type })

    // Diagnóstico: quando veio TEXTO e não áudio, e o texto parece transcrição errada ("paguei 2.00"), avisar e tentar corrigir config uma vez
    if (parsed.text && !parsed.media && /^(gastei|paguei)\s+2(\.00)?\s*$/i.test(parsed.text.trim())) {
      console.warn('⚠️ [Apifacil Webhook] RECEBEMOS TEXTO EM VEZ DE ÁUDIO — por isso o valor fica R$ 2,00. tipo_envio=', tipoEnvio, '| Para receber áudio de verdade, chame GET/POST .../api/whatsapp/apifacil/ensure-audio-config')
      if (!audioConfigFixTried && isApifacilConfigured()) {
        audioConfigFixTried = true
        ensureAudioWebhookEnabled()
          .then((r) => {
            if (r.updated) console.log('✅ [Apifacil Webhook] Configuração corrigida: webhook passará a receber áudio. tipos_envio:', r.tipos_envio_depois)
            else if (r.success) console.log('📋 [Apifacil Webhook] Config já permitia áudio. tipos_envio:', r.tipos_envio_antes)
            else console.warn('⚠️ [Apifacil Webhook] Não foi possível ajustar config áudio:', r.error)
          })
          .catch((e) => console.warn('⚠️ [Apifacil Webhook] Erro ao ajustar config áudio:', e))
      }
    }

    // Em localhost: só processar se WHATSAPP_TEST_NUMBERS estiver definido e o número estiver na lista.
    // Exceção: "Olá, quero utilizar a plenipay" (e variações) — sempre responder para QUALQUER número.
    const isQueroUtilizarPlenipay = parsed.text ? isQueroUtilizarPlenipayMessage(parsed.text) : false
    const isDev = process.env.NODE_ENV === 'development'
    const testNumbers = getTestNumbers()
    if (isDev && testNumbers.length > 0 && !isQueroUtilizarPlenipay) {
      if (!isAllowedTestNumber(from, testNumbers)) {
        console.log('🔒 [Apifacil Webhook] Modo teste: ignorando número não autorizado.', { from, allowed: testNumbers })
        return NextResponse.json({ success: true, message: 'Modo teste: número ignorado' })
      }
      console.log('✅ [Apifacil Webhook] Modo teste: número autorizado, processando.', { from })
    } else if (isQueroUtilizarPlenipay) {
      console.log('👋 [Apifacil Webhook] "Quero utilizar PleniPay" — processando para qualquer número:', from)
    }

    // Aguardar o processamento terminar antes de responder 200, para o envio automático (boas-vindas) concluir
    // em ambiente serverless (Railway/Vercel). Timeout 25s para não travar se algo falhar.
    const WEBHOOK_PROCESS_TIMEOUT_MS = 25_000
    await Promise.race([
      processarEmBackground(parsed),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Webhook process timeout')), WEBHOOK_PROCESS_TIMEOUT_MS)
      ),
    ]).catch((err) => {
      console.error('❌ [Apifacil Webhook] Erro ou timeout em processamento:', err instanceof Error ? err.message : err)
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ [Apifacil Webhook] Erro (retornando 200 para API Fácil não marcar Pendente):', err)
    if (parsed) {
      await processarEmBackground(parsed).catch((e) =>
        console.error('❌ [Apifacil Webhook] Erro em processamento após catch:', e)
      )
    }
    return NextResponse.json({ success: true })
  }
}
