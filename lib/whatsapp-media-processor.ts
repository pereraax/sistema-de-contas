/**
 * Processamento de mídia (imagens e áudios) para WhatsApp
 */

import { normalizarNumerosPorExtenso } from '@/lib/plen-registro'

export interface MediaInfo {
  type: 'image' | 'audio' | 'document'
  url: string
  mimetype: string
  caption?: string
  filename?: string
}

/**
 * Detectar se a mensagem contém mídia
 */
/** Mapeia tipo_envio da API Fácil (AUDIO_RECEBIDO, IMAGEM_RECEBIDA) para tipo_mensagem */
function tipoEnvioToTipoMensagem(tipoEnvio: string): string | null {
  if (!tipoEnvio || typeof tipoEnvio !== 'string') return null
  const t = tipoEnvio.toUpperCase()
  if (t === 'AUDIO_RECEBIDO') return 'audio'
  if (t === 'IMAGEM_RECEBIDA' || t === 'IMAGE_RECEBIDO') return 'image'
  if (t === 'VIDEO_RECEBIDO') return 'video'
  if (t === 'DOCUMENTO_RECEBIDO') return 'document'
  return null
}

/** Normaliza body para API Fácil: tipo e URL podem estar em body.data, tipo_envio ou mensagem como URL */
function normalizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body
  const data = body.data && typeof body.data === 'object' ? body.data : {}
  const tipoEnvio = (body.tipo_envio ?? data.tipo_envio) as string | undefined
  const tipoFromEnvio = tipoEnvioToTipoMensagem(tipoEnvio || '')
  const tipoMensagem = body.tipo_mensagem ?? data.tipo_mensagem ?? data.tipo ?? tipoFromEnvio
  const mensagem = (body.mensagem ?? data.mensagem) as string | undefined
  const mensagemIsUrl = typeof mensagem === 'string' && /^https?:\/\//i.test(mensagem.trim())
  const urlMedia =
    body.url_media ?? data.url_media ?? data.url_midia ?? data.url_mídia
    ?? body.media_url ?? data.media_url
    ?? body.url ?? data.url
    ?? body.arquivo ?? data.arquivo ?? body.file ?? data.file
    ?? body.link_midia ?? data.link_midia ?? body.media ?? data.media
    ?? (mensagemIsUrl && tipoMensagem ? mensagem!.trim() : undefined)
  return {
    ...body,
    tipo_envio: tipoEnvio,
    tipo_mensagem: tipoMensagem,
    type: body.type ?? data.type ?? tipoMensagem,
    mimetype: body.mimetype ?? data.mimetype ?? data.mime_type,
    url_media: urlMedia,
    media_url: urlMedia,
    url: urlMedia,
    origem: body.origem ?? data.origem,
    from: body.from ?? data.from,
  }
}

export function detectMedia(body: any): MediaInfo | null {
  const b = normalizeBody(body)
  console.log('🔍 [Media Processor] Detectando mídia no body:', {
    keys: Object.keys(body),
    tipo_mensagem: b.tipo_mensagem,
    type: b.type,
    mimetype: b.mimetype,
    has_url_media: !!b.url_media,
    has_media_url: !!b.media_url,
    has_url: !!b.url,
  })

  // ESTRATÉGIA 1: Verificar campos de tipo de mensagem
  const isImage =
    b.tipo_mensagem === 'image' ||
    b.tipo_mensagem === 'imagem' ||
    b.type === 'image' ||
    b.mimetype?.startsWith('image/') ||
    body.tipo === 'image' ||
    body.tipo === 'imagem' ||
    body.messageType === 'image' ||
    body.mediaType === 'image'

  // ESTRATÉGIA 2: Verificar se há URL de mídia E o campo mensagem está vazio ou parece ser URL
  const hasMediaUrl = b.url_media || b.media_url || b.url || body.image_url || body.mediaUrl || body.media
  const hasText = body.mensagem || body.message || body.text || body.body
  const isLikelyMedia = hasMediaUrl && (!hasText || (typeof hasText === 'string' && hasText.match(/^https?:\/\//)))

  if (isImage || isLikelyMedia) {
    const imageUrl = b.url_media || b.media_url || b.url || body.image_url || body.mediaUrl || body.media
    if (imageUrl) {
      console.log('🖼️ [Media Processor] Imagem detectada:', imageUrl)
      return {
        type: 'image',
        url: imageUrl,
        mimetype: body.mimetype || body.mediaType || 'image/jpeg',
        caption: body.caption || body.legenda || body.mensagem || body.text || body.description || '',
      }
    } else {
      console.log('⚠️ [Media Processor] Imagem detectada mas sem URL')
    }
  }
  
  // ESTRATÉGIA 3: Verificar se QUALQUER campo de texto contém URL de imagem/áudio
  const allTextFields = [
    body.mensagem, body.message, body.text, body.body, 
    body.caption, body.legenda, body.description, body.content,
    body.data?.mensagem, body.data?.message, body.data?.text,
    body.message?.mensagem, body.message?.text,
  ].filter(field => field && typeof field === 'string')
  
  for (const field of allTextFields) {
    // Verificar se é uma URL de imagem
    const imageUrlPattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp)(\?[^\s]*)?/i
    const imageUrlMatch = field.match(imageUrlPattern)
    if (imageUrlMatch) {
      const imageUrl = imageUrlMatch[0]
      console.log('🖼️ [Media Processor] URL de imagem encontrada no texto:', imageUrl.substring(0, 100))
      return {
        type: 'image',
        url: imageUrl,
        mimetype: 'image/jpeg',
        caption: field.replace(imageUrl, '').trim() || '',
      }
    }
    
    // Verificar se é uma URL de áudio
    const audioUrlPattern = /https?:\/\/[^\s]+\.(mp3|wav|ogg|m4a|aac|webm)(\?[^\s]*)?/i
    const audioUrlMatch = field.match(audioUrlPattern)
    if (audioUrlMatch) {
      const audioUrl = audioUrlMatch[0]
      console.log('🎤 [Media Processor] URL de áudio encontrada no texto:', audioUrl.substring(0, 100))
      return {
        type: 'audio',
        url: audioUrl,
        mimetype: 'audio/ogg',
        caption: field.replace(audioUrl, '').trim() || '',
      }
    }
    
    // Verificar URLs do apifacil.dev ou S3 que podem ser mídia (sem extensão)
    const apifacilUrlPattern = /https?:\/\/(apifacil|apifacilv2|s3|amazonaws)[^\s]+/i
    if (apifacilUrlPattern.test(field)) {
      const url = field.trim()
      const isAudioByType = b.tipo_mensagem === 'audio' || b.tipo_mensagem === 'voice' || b.type === 'audio'
      console.log('🔍 [Media Processor] URL suspeita de mídia (apifacil/S3) encontrada:', url.substring(0, 100), 'tipo_mensagem:', b.tipo_mensagem)
      return {
        type: isAudioByType ? 'audio' : 'image',
        url,
        mimetype: isAudioByType ? 'audio/ogg' : 'image/jpeg',
        caption: field.replace(url, '').trim() || '',
      }
    }
  }
  
  const isAudio =
    b.tipo_mensagem === 'audio' ||
    b.tipo_mensagem === 'voice' ||
    b.type === 'audio' ||
    b.mimetype?.startsWith('audio/') ||
    body.tipo === 'audio' ||
    body.messageType === 'audio' ||
    body.mediaType === 'audio'

  if (isAudio) {
    const audioUrl = b.url_media || b.media_url || b.url || body.audio_url || body.mediaUrl || body.media
    if (audioUrl) {
      console.log('🎤 [Media Processor] Áudio detectado:', audioUrl)
      return {
        type: 'audio',
        url: audioUrl,
        mimetype: body.mimetype || body.mediaType || 'audio/ogg',
        caption: body.caption || body.legenda || body.mensagem || body.text || body.description || '',
      }
    }
  }
  
  const isDocument = 
    body.tipo_mensagem === 'document' || 
    body.type === 'document' || 
    body.mimetype?.startsWith('application/') ||
    body.tipo === 'document' ||
    body.messageType === 'document' ||
    body.mediaType === 'document'
  
  if (isDocument) {
    const docUrl = body.url_media || body.media_url || body.url || body.document_url || body.mediaUrl || body.media
    if (docUrl) {
      console.log('📄 [Media Processor] Documento detectado:', docUrl)
      return {
        type: 'document',
        url: docUrl,
        mimetype: body.mimetype || body.mediaType || 'application/pdf',
        caption: body.caption || body.legenda || body.mensagem || body.text || body.description || '',
        filename: body.filename || body.nome_arquivo || body.fileName,
      }
    }
  }
  
  // Verificar se há ID de mídia (pode precisar fazer requisição para obter URL)
  const mediaId = body.media_id || body.mediaId || body.id_media || body.id_midia
  const messageId = body.message_id || body.messageId || body.id || body.id_mensagem
  
  if (mediaId && !isImage && !isAudio && !isDocument) {
    console.log('📎 [Media Processor] ID de mídia encontrado:', mediaId)
    return {
      type: 'image',
      url: mediaId,
      mimetype: body.mimetype || 'image/jpeg',
      caption: body.caption || body.legenda || body.mensagem || body.text || '',
      filename: body.filename || body.nome_arquivo,
    }
  }
  
  // Verificar se há URL de mídia mesmo sem tipo explícito (pode ser imagem ou áudio)
  const hasMediaUrlAlt = b.url_media || b.media_url || body.mediaUrl || b.url
  if (hasMediaUrlAlt && !isImage && !isAudio && !isDocument) {
    const isAudioByType = b.tipo_mensagem === 'audio' || b.tipo_mensagem === 'voice' || b.type === 'audio'
    const asAudio = isAudioByType || (b.tipo_mensagem === 'audio' || b.tipo_mensagem === 'voice')
    console.log('📎 [Media Processor] URL de mídia encontrada, tipo:', asAudio ? 'audio' : 'image')
    return {
      type: asAudio ? 'audio' : 'image',
      url: hasMediaUrlAlt,
      mimetype: body.mimetype || (asAudio ? 'audio/ogg' : 'image/jpeg'),
      caption: body.caption || body.legenda || '',
    }
  }
  
  // Verificar campos aninhados de imagem
  if (body.image) {
    const imageUrl = body.image.url || body.image.url_media || body.image.media_url || body.image.file
    const imageBase64 = body.image.base64 || body.image.data
    if (imageUrl) {
      console.log('🖼️ [Media Processor] Imagem encontrada em campo aninhado:', imageUrl)
      return {
        type: 'image',
        url: imageUrl,
        mimetype: body.image.mime_type || body.image.mimetype || 'image/jpeg',
        caption: body.image.caption || body.caption || '',
      }
    } else if (imageBase64) {
      console.log('🖼️ [Media Processor] Imagem encontrada em base64 no campo aninhado')
      return {
        type: 'image',
        url: `data:image/jpeg;base64,${imageBase64}`,
        mimetype: body.image.mime_type || body.image.mimetype || 'image/jpeg',
        caption: body.image.caption || body.caption || '',
      }
    }
  }
  
  // Verificar se há base64 diretamente no body
  if (body.base64 || body.data) {
    const base64Data = body.base64 || body.data
    if (typeof base64Data === 'string' && base64Data.length > 100) {
      console.log('🖼️ [Media Processor] Imagem encontrada em base64 no body')
      return {
        type: 'image',
        url: `data:image/jpeg;base64,${base64Data}`,
        mimetype: body.mimetype || 'image/jpeg',
        caption: body.caption || body.legenda || '',
      }
    }
  }
  
  // Verificar em campos aninhados
  if (body.data) {
    const media = detectMedia(body.data)
    if (media) return media
  }
  
  if (body.message) {
    const media = detectMedia(body.message)
    if (media) return media
  }
  
  if (body.content) {
    const media = detectMedia(body.content)
    if (media) return media
  }
  
  console.log('❌ [Media Processor] Nenhuma mídia detectada')
  return null
}

/**
 * Baixar mídia (apifacil.dev ou qualquer URL). Headers opcionais para autenticação (ex.: Bearer token).
 */
export async function downloadMedia(mediaUrl: string, headers?: HeadersInit): Promise<Buffer | null> {
  try {
    console.log('📥 [Media Processor] Baixando mídia:', mediaUrl.substring(0, 100))
    
    if (mediaUrl.startsWith('data:')) {
      console.log('📥 [Media Processor] Detectado base64, convertendo...')
      const base64Match = mediaUrl.match(/base64,(.+)/)
      if (base64Match) {
        try {
          return Buffer.from(base64Match[1], 'base64')
        } catch (error: any) {
          console.error('❌ [Media Processor] Erro ao converter base64:', error.message)
          return null
        }
      }
    }
    
    if (!mediaUrl.startsWith('http')) {
      console.log('⚠️ [Media Processor] URL não parece ser válida:', mediaUrl)
      return null
    }

    const token = process.env.APIFACIL_TOKEN?.trim()
    const hasAuth = headers && typeof headers === 'object' && Object.keys(headers as object).length > 0

    const tryFetch = (opts: { headers?: HeadersInit; url?: string } = {}) =>
      fetch(opts.url || mediaUrl, { method: 'GET', headers: opts.headers || {} })

    let response = await tryFetch()
    if (!response.ok && hasAuth && token) {
      if (response.status === 401) response = await tryFetch({ headers: { Authorization: token } })
      if (!response.ok && (response.status === 400 || response.status === 401))
        response = await tryFetch({ url: `${mediaUrl}${mediaUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` })
      if (!response.ok && response.status === 401)
        response = await tryFetch({ headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } })
    }
    if (!response.ok) {
      console.error('❌ [Media Processor] Erro ao baixar mídia:', response.status, response.statusText)
      return null
    }

    let buf = Buffer.from(await response.arrayBuffer())
    const isImage = buf.length >= 50 && ((buf[0] === 0xff && buf[1] === 0xd8) || (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47))
    const isHtmlOrJson = buf.length > 0 && (buf[0] === 0x3c || buf[0] === 0x7b)
    if (!isImage && isHtmlOrJson && hasAuth && token) {
      console.log('📥 [Media Processor] Resposta parece HTML/JSON (não imagem); retentando com Authorization')
      response = await tryFetch({ headers: { Authorization: token } })
      if (response.ok) {
        buf = Buffer.from(await response.arrayBuffer())
        if (buf[0] === 0x3c || buf[0] === 0x7b) {
          console.error('❌ [Media Processor] Ainda HTML/JSON após auth. URL pode exigir login no navegador.')
          return null
        }
      }
    }
    console.log('📥 [Media Processor] Baixado', buf.length, 'bytes', isImage || buf[0] === 0xff || buf[0] === 0x89 ? '(imagem)' : '')
    return buf
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro ao baixar mídia:', error.message)
    return null
  }
}

/**
 * Processar imagem de comprovante usando IA
 */
function looksLikeImage(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 50) return false
  const h = buffer.subarray(0, 8)
  if (h[0] === 0xff && h[1] === 0xd8) return true // JPEG
  if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47) return true // PNG
  if (h[0] === 0x3c || h[0] === 0x7b) return false // HTML ou JSON (erro)
  return true
}

/** Google Vision: só OCR, retorna texto puro (sem IA). */
async function getOcrTextGoogleVision(base64Image: string): Promise<string | null> {
  if (!process.env.GOOGLE_CLOUD_VISION_API_KEY || !base64Image) return null
  try {
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ image: { content: base64Image }, features: [{ type: 'TEXT_DETECTION', maxResults: 1 }] }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.responses?.[0]?.textAnnotations?.[0]?.description?.trim() || null
  } catch {
    return null
  }
}

/** Gemini: só transcrever texto da imagem (sem pedir JSON). */
async function ocrImageSóTexto(base64Image: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY || !base64Image || base64Image.length < 100) return null
  const prompts = [
    'Transcreva todo o texto visível nesta imagem. Apenas o texto, sem explicação.',
    'Liste todo o texto que aparece nesta imagem, na ordem.',
  ]
  for (const prompt of prompts) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64Image } }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024 },
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
      if (text) return text
    } catch {
      continue
    }
  }
  return null
}

/** Remove valores que são típicos de data/hora (dia 1-31, mês 1-12, ano 2020-2030) para não confundir com valor em reais. */
function filtrarValoresDataHora(candidatos: number[]): number[] {
  return candidatos.filter(
    (v) =>
      v > 0 &&
      v < 10_000_000 &&
      !(v >= 1 && v <= 31) && // dia
      !(v >= 2020 && v <= 2030) // ano
  )
}

/**
 * Extrai valor principal e nomes do texto OCR do comprovante (PIX etc.).
 * Prioriza valor em contexto "R$", "Valor", "Total" e evita pegar número de data (2, 12, 2022) como valor.
 * Retorna comando pronto "paguei X para Y" / "recebi X de Y" ou null.
 */
function extrairComprovanteOCR(texto: string): string | null {
  if (!texto || typeof texto !== 'string' || texto.trim().length < 3) return null
  const t = texto.trim()

  // 1) Valor: preferir R$ X,XX ou Valor/Total; senão maior número no formato X,XX ou X.XX
  const valorCandidatos: number[] = []
  const reR$ = /R\s*\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:[.,]\d{2})?)/g
  const reValorTotal = /(?:valor|total|pix\s+enviado|pix\s+recebido)\s*[:\s]*R?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:[.,]\d{2})?)/gi
  const reNumeroDecimal = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})/g

  /** Aceita 80,00 (BR), 80.00 (decimal), 1.500,00 (milhares BR). Nunca converte 80.00 em 8000. */
  function parseValorBR(s: string): number {
    const limpo = s.replace(/\s/g, '').trim()
    if (!limpo) return 0
    const temVirgula = limpo.includes(',')
    const temPonto = limpo.includes('.')
    if (temVirgula) {
      const br = limpo.replace(/\./g, '').replace(',', '.')
      const n = parseFloat(br)
      return isNaN(n) ? 0 : n
    }
    if (temPonto) {
      const partes = limpo.split('.')
      if (partes.length === 2 && partes[1].length === 2) return parseFloat(limpo)
      return parseFloat(limpo.replace(/\./g, ''))
    }
    return parseFloat(limpo) || 0
  }

  let m: RegExpExecArray | null
  while ((m = reR$.exec(t)) !== null) valorCandidatos.push(parseValorBR(m[1]))
  reValorTotal.lastIndex = 0
  while ((m = reValorTotal.exec(t)) !== null) valorCandidatos.push(parseValorBR(m[1]))
  reNumeroDecimal.lastIndex = 0
  while ((m = reNumeroDecimal.exec(t)) !== null) valorCandidatos.push(parseValorBR(m[1]))

  const semDataHora = filtrarValoresDataHora(valorCandidatos)
  const valor =
    semDataHora.length > 0
      ? Math.max(...semDataHora)
      : valorCandidatos.length > 0
        ? Math.max(...valorCandidatos.filter((v) => v > 0 && v < 10_000_000))
        : null
  if (valor == null || valor <= 0) return null

  // 2) Nomes: "Quem recebeu" → beneficiário (quem você pagou); "Quem pagou" → pagador (quem te pagou)
  const quemRecebeuBlock = t.match(/(?:Quem\s+recebeu|recebedor|benefici[aá]rio)[\s\S]*?(?=Quem\s+pagou|pagador|$)/i)
  const quemPagouBlock = t.match(/(?:Quem\s+pagou|pagador)[\s\S]*?(?=Valor|Total|R\$|$)/i)

  const nomeDepoisDe = (bloco: string | null, label: string): string => {
    if (!bloco) return ''
    const r = new RegExp(`${label}\\s*[:\\s]*([A-Za-z0-9\\s.-]{2,}?)(?=\\n|\\s*CPF|\\s*CNPJ|Instituição|$)`, 'i')
    const match = bloco.match(r)
    return match ? match[1].replace(/\s+/g, ' ').trim().substring(0, 120) : ''
  }

  let nomeBeneficiario = nomeDepoisDe(quemRecebeuBlock?.[0] ?? null, 'Nome')
  if (!nomeBeneficiario && quemRecebeuBlock) {
    const ignorar = /^(Nome|CPF|CNPJ|Institui[cç][aã]o|Raz[aã]o\s*Social)$/i
    const linhas = quemRecebeuBlock[0].split(/\n/).map((l) => l.trim()).filter((l) => l.length > 2 && /^[A-Za-z]/.test(l) && !ignorar.test(l) && !/^\d[\d.\s,-]+$/.test(l))
    const linha = linhas.find((l) => l.length >= 2 && l.length <= 80) ?? linhas[0]
    if (linha) nomeBeneficiario = linha.substring(0, 120)
  }

  let nomePagador = nomeDepoisDe(quemPagouBlock?.[0] ?? null, 'Nome')
  if (!nomePagador && quemPagouBlock) {
    const ignorar = /^(Nome|CPF|CNPJ|Institui[cç][aã]o|Raz[aã]o\s*Social)$/i
    const linhas = quemPagouBlock[0].split(/\n/).map((l) => l.trim()).filter((l) => l.length > 2 && /^[A-Za-z]/.test(l) && !ignorar.test(l) && !/^\d[\d.\s,-]+$/.test(l))
    const linha = linhas.find((l) => l.length >= 2 && l.length <= 80) ?? linhas[0]
    if (linha) nomePagador = linha.substring(0, 120)
  }

  // 3) Direção: "Quem recebeu" = beneficiário (você pagou para ele). "Quem pagou" = quem te pagou (recebimento). Preferir beneficiário quando existir (comprovante de gasto).
  if (nomeBeneficiario) {
    return `paguei ${valor.toFixed(2)} para ${nomeBeneficiario}`
  }
  if (nomePagador) {
    return `recebi ${valor.toFixed(2)} de ${nomePagador}`
  }
  return `paguei ${valor.toFixed(2)}`
}

/** Monta comando "paguei X para Nome" só com valor e nome extraídos do texto OCR. Usado quando extrairComprovanteOCR falha mas temos valor válido. */
function comandoFromOcrValorENome(ocrText: string): string | null {
  if (!ocrText || ocrText.trim().length < 5) return null
  const valor = extrairValorPrincipalDoTexto(ocrText)
  if (valor == null || valor <= 31) return null
  const t = ocrText.trim()
  const quemRecebeuBlock = t.match(/(?:Quem\s+recebeu|recebedor|benefici[aá]rio)[\s\S]*?(?=Quem\s+pagou|pagador|$)/i)
  const quemPagouBlock = t.match(/(?:Quem\s+pagou|pagador)[\s\S]*?(?=Valor|Total|R\$|$)/i)
  const ignorar = /^(Nome|CPF|CNPJ|Institui[cç][aã]o|Raz[aã]o\s*Social)$/i
  const pegarNome = (bloco: string | null): string => {
    if (!bloco) return ''
    const afterNome = bloco.match(/Nome\s*[:]?\s*([A-Za-z0-9\s.-]{2,}?)(?=\n|CPF|CNPJ|Instituição|$)/i)
    if (afterNome?.[1]) return afterNome[1].replace(/\s+/g, ' ').trim().substring(0, 120)
    const linhas = bloco.split(/\n/).map((l) => l.trim()).filter((l) => l.length >= 2 && l.length <= 80 && /^[A-Za-z]/.test(l) && !ignorar.test(l) && !/^\d[\d.\s,-]+$/.test(l))
    return linhas[0]?.substring(0, 120) ?? ''
  }
  const nomeBenef = pegarNome(quemRecebeuBlock?.[0] ?? null)
  const nomePag = pegarNome(quemPagouBlock?.[0] ?? null)
  if (nomeBenef) return `paguei ${valor.toFixed(2)} para ${nomeBenef}`
  if (nomePag) return `recebi ${valor.toFixed(2)} de ${nomePag}`
  return `paguei ${valor.toFixed(2)}`
}

/** Extrai apenas o valor principal (maior R$ X,XX / X,XX) do texto. Ignora números de data (1-31, 2020-2030). */
function extrairValorPrincipalDoTexto(texto: string): number | null {
  if (!texto || typeof texto !== 'string') return null
  const t = texto.trim()
  const candidatos: number[] = []
  const reR$ = /R\s*\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:[.,]\d{2})?)/g
  const reValorTotal = /(?:valor|total|pix\s+enviado|pix\s+recebido)\s*[:\s]*R?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:[.,]\d{2})?)/gi
  const reNumero = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})/g
  function parse(s: string): number {
    const limpo = s.replace(/\s/g, '').trim()
    if (limpo.includes(',')) return parseFloat(limpo.replace(/\./g, '').replace(',', '.')) || 0
    if (limpo.includes('.') && /^\d+\.\d{2}$/.test(limpo)) return parseFloat(limpo)
    if (limpo.includes('.')) return parseFloat(limpo.replace(/\./g, '')) || 0
    return parseFloat(limpo) || 0
  }
  let m: RegExpExecArray | null
  while ((m = reR$.exec(t)) !== null) candidatos.push(parse(m[1]))
  reValorTotal.lastIndex = 0
  while ((m = reValorTotal.exec(t)) !== null) candidatos.push(parse(m[1]))
  reNumero.lastIndex = 0
  while ((m = reNumero.exec(t)) !== null) candidatos.push(parse(m[1]))
  // Fallback PIX: valor em reais costuma ter 2+ dígitos (80,00). Evita pegar 2,00 de data.
  if (/pix|enviado|recebido|comprovante/i.test(t)) {
    const reValorGrande = /\b(\d{2,})[.,](\d{2})\b/g
    while ((m = reValorGrande.exec(t)) !== null) {
      const v = parseFloat(m[1] + '.' + m[2])
      if (v > 31 && v < 10_000_000) candidatos.push(v)
    }
  }
  const semDataHora = filtrarValoresDataHora(candidatos)
  const validos = semDataHora.length > 0 ? semDataHora : candidatos.filter((v) => v > 0 && v < 10_000_000)
  return validos.length > 0 ? Math.max(...validos) : null
}

export async function processComprovanteImage(imageBuffer: Buffer, caption?: string): Promise<string | null> {
  try {
    console.log('🔍 [Media Processor] Processando comprovante de imagem...')
    if (!looksLikeImage(imageBuffer)) {
      console.error('❌ [Media Processor] Buffer não parece imagem')
      return null
    }
    const base64Image = imageBuffer.toString('base64')

    // 0) Legenda do usuário (sem chamar nenhuma API)
    if (caption && caption.trim().length > 2) {
      const cmdCaption = extrairComandoDeTexto(caption.trim())
      if (cmdCaption) {
        console.log('✅ [Media Processor] Comando da legenda:', cmdCaption)
        return cmdCaption
      }
    }

    // 1) Groq Vision primeiro (substitui Gemini para comprovantes; usa GROQ_API_KEY)
    if (process.env.GROQ_API_KEY) {
      try {
        const groqResult = await processImageWithGroqVision(base64Image, caption)
        if (groqResult) {
          console.log('✅ [Media Processor] Groq Vision processou comprovante:', groqResult.slice(0, 60))
          return groqResult
        }
      } catch (e: any) {
        console.error('❌ [Media Processor] Groq Vision:', e?.message)
      }
    }

    // 2) Google Vision só OCR → extração determinística (valor principal + nomes)
    let ocrTextAcumulado = ''
    const ocrGoogle = await getOcrTextGoogleVision(base64Image)
    if (ocrGoogle) {
      ocrTextAcumulado = ocrGoogle
      const cmdOCR = extrairComprovanteOCR(ocrGoogle)
      if (cmdOCR) {
        console.log('✅ [Media Processor] Comando do OCR (Google Vision, extração valor/nome):', cmdOCR)
        return cmdOCR
      }
      const cmd = extrairComandoDeTexto(ocrGoogle)
      if (cmd) {
        console.log('✅ [Media Processor] Comando do OCR (Google Vision):', cmd)
        return cmd
      }
      if (caption) {
        const c = extrairComprovanteOCR(ocrGoogle + '\n' + caption) || extrairComandoDeTexto(ocrGoogle + '\n' + caption)
        if (c) return c
      }
    }

    // 3) Gemini só texto (OCR) — fallback; extração valor/nome
    if (process.env.GEMINI_API_KEY) {
      const ocrGemini = await ocrImageSóTexto(base64Image)
      if (ocrGemini) {
        ocrTextAcumulado = (ocrTextAcumulado ? ocrTextAcumulado + '\n' : '') + ocrGemini
        const cmdOCR = extrairComprovanteOCR(ocrGemini)
        if (cmdOCR) {
          console.log('✅ [Media Processor] Comando do OCR (Gemini):', cmdOCR)
          return cmdOCR
        }
        const cmd = extrairComandoDeTexto(ocrGemini)
        if (cmd) return cmd
        if (caption) {
          const c = extrairComprovanteOCR(ocrGemini + '\n' + caption) || extrairComandoDeTexto(ocrGemini + '\n' + caption)
          if (c) return c
        }
      }
    }

    // 4) Fallback: montar comando só com valor + nome do OCR (sem IA JSON)
    if (ocrTextAcumulado.trim().length > 10) {
      const cmdOcr = comandoFromOcrValorENome(ocrTextAcumulado)
      if (cmdOcr) {
        console.log('✅ [Media Processor] Comando do OCR (fallback valor+nome):', cmdOcr)
        return cmdOcr
      }
    }

    // 5) OpenAI GPT-4o Vision (antes do Gemini)
    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await processImageWithOpenAI(base64Image, caption, ocrTextAcumulado)
        if (result) {
          console.log('✅ [Media Processor] OpenAI Vision processou comprovante')
          return result
        }
      } catch (error: any) {
        console.error('❌ [Media Processor] Erro OpenAI Vision:', error.message)
      }
    }

    // 6) Gemini por último (substituído por Groq/OpenAI para comprovantes)
    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await processImageWithGemini(base64Image, caption, ocrTextAcumulado)
        if (result) {
          console.log('✅ [Media Processor] Gemini (fallback) processou comprovante')
          return result
        }
      } catch (error: any) {
        console.error('❌ [Media Processor] Erro Gemini:', error.message)
      }
    }

    // 7) Google Cloud Vision (análise completa)
    if (process.env.GOOGLE_CLOUD_VISION_API_KEY) {
      try {
        console.log('🔍 [Media Processor] Tentando Google Cloud Vision API (gratuito)...')
        const result = await processImageWithGoogleVision(base64Image, caption)
        if (result) {
          console.log('✅ [Media Processor] Google Cloud Vision processou com sucesso!')
          return result
        }
      } catch (error: any) {
        console.error('❌ [Media Processor] Erro ao processar com Google Vision:', error.message)
      }
    }
    
    // 8) Azure Computer Vision (gratuito - 5000/mês)
    if (process.env.AZURE_VISION_API_KEY && process.env.AZURE_VISION_ENDPOINT) {
      try {
        console.log('🔍 [Media Processor] Tentando Azure Computer Vision (gratuito)...')
        const result = await processImageWithAzureVision(base64Image, caption)
        if (result) {
          console.log('✅ [Media Processor] Azure Vision processou com sucesso!')
          return result
        }
      } catch (error: any) {
        console.error('❌ [Media Processor] Erro ao processar com Azure Vision:', error.message)
      }
    }
    
    // Último recurso: legenda com número → "paguei X"
    if (caption && caption.trim().length > 0) {
      const num = caption.match(/(\d+)[.,]?(\d*)/)
      if (num) {
        const v = parseFloat((num[1] || '0') + '.' + (num[2] || '00').padEnd(2, '0'))
        if (v > 0) {
          console.log('✅ [Media Processor] Fallback: comando da legenda (valor)', v)
          return `paguei ${v.toFixed(2)}`
        }
      }
    }

    console.log('⚠️ [Media Processor] Nenhum comando extraído. Dica: envie com legenda, ex: "gastei 50 no mercado".')
    return null
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro ao processar imagem:', error.message)
    return null
  }
}

/**
 * Pergunta ao Gemini APENAS o valor em reais da transação (uma pergunta simples).
 * Usado quando a IA retornou valor suspeito (ex.: 2 de data) para corrigir.
 */
async function perguntarValorSoGemini(base64Image: string): Promise<number | null> {
  if (!process.env.GEMINI_API_KEY || !base64Image) return null
  const prompt = `Na imagem do comprovante PIX, qual é o valor em REAIS da transação (valor pago ou recebido)?
É o número em DESTAQUE, por exemplo "Pix enviado R$ 80,00" → responda 80.
NÃO use número de data (12/08/2022), nem hora (01h23), nem ID. Apenas o valor da transação em reais.
Responda SOMENTE com o número (ex: 80).`
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64Image } }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 20 },
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim()
    const fromText = extrairValorPrincipalDoTexto(text)
    if (fromText != null && fromText > 31) return fromText
    const num = text.match(/\d{1,6}(?:[.,]\d{2})?/)?.[0]?.replace(',', '.') || text.replace(/\D/g, '')
    const v = num ? parseFloat(num) : NaN
    if (Number.isFinite(v) && v > 31 && v < 10_000_000) {
      console.log('📝 [Media Processor] Valor corrigido por pergunta direta ao Gemini:', v)
      return v
    }
  } catch (_) {}
  return null
}

/**
 * Processar imagem com Google Gemini (Gratuito e Funcional).
 * Se ocrText for passado, o valor do comando vem SEMPRE do OCR (nunca do JSON da IA), para evitar R$ 2 em vez de R$ 80.
 */
async function processImageWithGemini(base64Image: string, caption?: string, ocrText?: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ [Media Processor] GEMINI_API_KEY não configurada')
    return null
  }

  // Verificar se a imagem base64 está válida
  if (!base64Image || base64Image.length < 100) {
    console.error('❌ [Media Processor] Base64 da imagem inválido ou muito pequeno:', base64Image.length)
    return null
  }

  console.log('🔍 [Media Processor] Gemini API Key configurada:', process.env.GEMINI_API_KEY.substring(0, 10) + '...')
  console.log('🔍 [Media Processor] Tamanho da imagem base64:', base64Image.length, 'caracteres')
  if (ocrText) console.log('🔍 [Media Processor] OCR texto disponível para corrigir valor da IA:', ocrText.length, 'chars')

  const prompt = `Analise esta imagem de comprovante PIX e extraia em JSON.

REGRAS OBRIGATÓRIAS:
- Valor: use SOMENTE o valor da transação em reais, o número em DESTAQUE (ex.: "Pix enviado R$ 80,00" → valor 80). NUNCA use número de data (12, 08, 2022), hora (01, 23) ou ID.
- PIX enviado (você pagou): tipo = "pix". nome_beneficiario = nome em "Quem recebeu" (ex.: Pagsmile). valor = valor em reais (ex.: 80).
- PIX recebido (você recebeu): tipo = "recebimento". nome_pagador = nome em "Quem pagou". valor = valor em reais.
- Preencha nome_beneficiario ou nome_pagador com o nome REAL do comprovante (não deixe vazio).
- data: "YYYY-MM-DD" se visível, senão null.

Retorne SOMENTE um JSON válido, sem markdown: {"tipo":"pix"|"recebimento","valor":número,"data":null ou "YYYY-MM-DD","nome_beneficiario":"","nome_pagador":"","descricao":""}
${caption ? ` Legenda: ${caption}` : ''}`

  try {
    console.log('🔍 [Media Processor] Chamando Gemini API...')
    
    // Modelos disponíveis (tentar na ordem)
    const geminiModels = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ]
    
    let lastError: any = null
    
    for (const model of geminiModels) {
      try {
        console.log(`🔍 [Media Processor] Tentando modelo Gemini: ${model}`)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
        
        const requestBody = {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        }
        
        console.log('🔍 [Media Processor] Enviando requisição para Gemini...')
        console.log('🔍 [Media Processor] Tamanho do request body:', JSON.stringify(requestBody).length, 'caracteres')
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        console.log(`📡 [Media Processor] Resposta do Gemini - Status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          console.log('📝 [Media Processor] Resposta completa do Gemini (primeiros 500 chars):', JSON.stringify(data).substring(0, 500))
          
          const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
          
          if (extractedText) {
            console.log(`✅ [Media Processor] Gemini modelo ${model} funcionou!`)
            console.log('📝 [Media Processor] Resposta do Gemini:', extractedText.substring(0, 500))
            const jsonData = extrairJsonDaResposta(extractedText)
            if (jsonData && typeof jsonData === 'object') {
              // VALOR: priorizar sempre OCR/texto; nunca usar valor da IA quando for <= 31 (data/hora).
              const valorOCR = ocrText ? extrairValorPrincipalDoTexto(ocrText) : null
              const valorDoTexto = extrairValorPrincipalDoTexto(extractedText)
              const valorIA = typeof jsonData.valor === 'number' ? jsonData.valor : parseFloat(jsonData.valor)
              const valorIASeguro = Number.isFinite(valorIA) && valorIA > 31 ? valorIA : null
              const valorFinal = valorOCR ?? valorDoTexto ?? valorIASeguro
              if (valorOCR != null && valorOCR !== valorIA) {
                console.log('📝 [Media Processor] Valor do OCR (ignorando IA): IA=', valorIA, '→ OCR=', valorOCR)
              }
              if (valorFinal != null) jsonData.valor = valorFinal
              const cmd = formatarComprovante(jsonData)
              if (cmd) return cmd
            }
            const cmdTexto = extrairComandoDeTexto(extractedText)
            if (cmdTexto) return cmdTexto
            if (extractedText.length <= 200) return extractedText.trim()
            return null
          } else {
            console.log('⚠️ [Media Processor] Gemini retornou resposta vazia')
            if (data.candidates?.[0]?.finishReason) console.log('⚠️ [Media Processor] finishReason:', data.candidates[0].finishReason)
          }
        } else {
          const errorText = await response.text()
          console.error(`❌ [Media Processor] Modelo ${model} falhou - Status: ${response.status}`)
          console.error(`❌ [Media Processor] Erro completo:`, errorText.substring(0, 500))
          lastError = { status: response.status, text: errorText }
          
          // Se for 404, tentar próximo modelo
          if (response.status === 404) {
            console.log(`⚠️ [Media Processor] Modelo ${model} não encontrado (404), tentando próximo...`)
            continue
          }
          
          // Se for 400, pode ser problema de formato
          if (response.status === 400) {
            console.error(`❌ [Media Processor] Erro 400 - Possível problema de formato da requisição`)
            console.error(`❌ [Media Processor] Verifique se a imagem base64 está correta`)
            // Tentar próximo modelo mesmo assim
            continue
          }
        }
      } catch (error: any) {
        console.error(`❌ [Media Processor] Erro ao tentar modelo ${model}:`, error.message)
        console.error(`❌ [Media Processor] Stack:`, error.stack?.substring(0, 300))
        lastError = error
        continue
      }
    }
    
    console.error('❌ [Media Processor] Todos os modelos Gemini falharam')
    console.error('❌ [Media Processor] Último erro:', lastError)
    return null
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro geral ao processar com Gemini:', error.message)
    console.error('❌ [Media Processor] Stack:', error.stack?.substring(0, 500))
    return null
  }
}

/**
 * Processar comprovante com Groq Vision (Llama 4 Scout) — substitui Gemini para comprovantes.
 * Usa GROQ_API_KEY; valor sempre validado (nunca usar número de data).
 */
async function processImageWithGroqVision(base64Image: string, caption?: string, ocrText?: string): Promise<string | null> {
  if (!process.env.GROQ_API_KEY || !base64Image || base64Image.length < 100) return null
  const prompt = `Analise esta imagem de comprovante PIX e extraia em JSON.

REGRAS: Valor = valor da transação em reais (ex.: "Pix enviado R$ 80,00" → valor 80). NUNCA use número de data (12, 2022) ou hora.
PIX enviado: tipo "pix", nome_beneficiario = nome em "Quem recebeu" (ex.: Pagsmile).
PIX recebido: tipo "recebimento", nome_pagador = nome em "Quem pagou".
Retorne SOMENTE um JSON válido: {"tipo":"pix"|"recebimento","valor":número,"data":null,"nome_beneficiario":"","nome_pagador":"","descricao":""}
${caption ? ` Legenda: ${caption}` : ''}`

  try {
    console.log('🔍 [Media Processor] Chamando Groq Vision (Llama 4 Scout)...')
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('❌ [Media Processor] Groq Vision:', res.status, err.slice(0, 200))
      return null
    }
    const data = await res.json()
    const extractedText = data.choices?.[0]?.message?.content?.trim() || ''
    if (!extractedText) return null
    const jsonData = extrairJsonDaResposta(extractedText)
    if (!jsonData || typeof jsonData !== 'object') return null
    const valorOCR = ocrText ? extrairValorPrincipalDoTexto(ocrText) : null
    const valorDoTexto = extrairValorPrincipalDoTexto(extractedText)
    const valorIA = typeof jsonData.valor === 'number' ? jsonData.valor : parseFloat(jsonData.valor)
    const valorIASeguro = Number.isFinite(valorIA) && valorIA > 31 ? valorIA : null
    const valorFinal = valorOCR ?? valorDoTexto ?? valorIASeguro
    if (valorFinal != null) jsonData.valor = valorFinal
    return formatarComprovante(jsonData)
  } catch (e: any) {
    console.error('❌ [Media Processor] Groq Vision erro:', e?.message)
    return null
  }
}

/**
 * Processar imagem com OpenAI GPT-4o Vision.
 * Se ocrText for passado, o valor do comando vem do OCR (nunca só do JSON da IA).
 */
async function processImageWithOpenAI(base64Image: string, caption?: string, ocrText?: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  const prompt = `Analise esta imagem de comprovante (PIX, boleto, recibo) e extraia em JSON.

IMPORTANTE - Valor: use o valor PRINCIPAL da transação em reais (o valor pago ou recebido, em destaque). Ex: R$ 80,00 → valor 80. NÃO use outros números (data, código, ID).
PIX enviado (você pagou): "Quem recebeu" = nome_beneficiario (nome que aparece no comprovante). tipo = "pix".
PIX recebido (você recebeu): "Quem pagou" = nome_pagador, valor. tipo = "recebimento".
Preencha nome_beneficiario ou nome_pagador com o nome real do comprovante (não deixe vazio se estiver visível).
Data: YYYY-MM-DD se possível, senão null.
Retorne SOMENTE um JSON válido: {"tipo":"pix"|"recebimento","valor":número,"data":null ou "YYYY-MM-DD","nome_beneficiario":"","nome_pagador":"","descricao":""}
${caption ? ` Legenda: ${caption}` : ''}`

  try {
    console.log('🔍 [Media Processor] Chamando OpenAI GPT-4o Vision...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Modelo com visão - mais confiável
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Media Processor] OpenAI API error:', response.status, errorText.substring(0, 200))
      return null
    }

    const data = await response.json()
    const extractedText = data.choices?.[0]?.message?.content || ''
    
    if (!extractedText) {
      console.error('❌ [Media Processor] OpenAI não retornou texto')
      return null
    }
    console.log('📝 [Media Processor] Resposta do OpenAI:', extractedText.substring(0, 200))
    const jsonData = extrairJsonDaResposta(extractedText)
    if (jsonData && typeof jsonData === 'object') {
      const valorOCR = ocrText ? extrairValorPrincipalDoTexto(ocrText) : null
      const valorDoTexto = extrairValorPrincipalDoTexto(extractedText)
      const valorIA = typeof jsonData.valor === 'number' ? jsonData.valor : parseFloat(jsonData.valor)
      const valorFinal = valorOCR ?? valorDoTexto ?? (Number.isFinite(valorIA) ? valorIA : null)
      if (valorOCR != null && valorOCR !== valorIA) {
        console.log('📝 [Media Processor] Valor corrigido pelo OCR (OpenAI): IA=', valorIA, '→ OCR=', valorOCR)
      }
      if (valorFinal != null) jsonData.valor = valorFinal
      const cmd = formatarComprovante(jsonData)
      if (cmd) return cmd
    }
    const cmdTexto = extrairComandoDeTexto(extractedText)
    if (cmdTexto) return cmdTexto
    if (extractedText.length <= 200) return extractedText.trim()
    return null
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro ao processar com OpenAI:', error.message)
    return null
  }
}

/**
 * Processar imagem com Google Cloud Vision API (OCR + IA)
 */
async function processImageWithGoogleVision(base64Image: string, caption?: string): Promise<string | null> {
  if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
    return null
  }

  try {
    console.log('🔍 [Media Processor] Chamando Google Cloud Vision API...')
    
    const ocrResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text()
      console.error('❌ [Media Processor] Google Vision OCR falhou:', ocrResponse.status, errorText.substring(0, 200))
      return null
    }

    const ocrData = await ocrResponse.json()
    const extractedText = ocrData.responses?.[0]?.textAnnotations?.[0]?.description || ''
    
    if (!extractedText) {
      console.log('⚠️ [Media Processor] Google Vision não encontrou texto')
      return null
    }

    console.log('📝 [Media Processor] Texto extraído pelo Google Vision:', extractedText.substring(0, 200))
    
    // Usar GPT para interpretar o texto extraído (se tiver OpenAI configurado)
    if (process.env.OPENAI_API_KEY) {
      try {
        const interpretationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Você é um assistente que analisa textos de comprovantes e extrai informações em JSON.',
              },
              {
                role: 'user',
                content: `Analise este texto extraído de um comprovante:\n\n${extractedText}\n\n${caption ? `Legenda: ${caption}` : ''}\n\nExtraia: tipo (pix/boleto/etc), valor, data, nome_beneficiario, nome_pagador. Retorne APENAS JSON válido.`,
              },
            ],
            temperature: 0.1,
            max_tokens: 300,
          }),
        })

        if (interpretationResponse.ok) {
          const interpretationData = await interpretationResponse.json()
          const interpreted = interpretationData.choices?.[0]?.message?.content || ''
          
          const jsonMatch = interpreted.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const jsonData = JSON.parse(jsonMatch[0])
              return formatarComprovante(jsonData)
            } catch (e) {
              // Continuar sem interpretação
            }
          }
        }
      } catch (error) {
        // Continuar sem interpretação
      }
    }
    
    // Se não conseguiu interpretar, tentar extrair valor diretamente do texto
    const valorMatch = extractedText.match(/R\$\s*(\d+[.,]?\d*)/i) || extractedText.match(/(\d+[.,]?\d*)\s*reais/i)
    if (valorMatch) {
      const valor = parseFloat(valorMatch[1].replace(',', '.'))
      return formatarComprovante({
        tipo: 'pix',
        valor,
        descricao: extractedText.substring(0, 100),
      })
    }
    
    return null
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro ao processar com Google Vision:', error.message)
    return null
  }
}

/**
 * Processar imagem com Azure Computer Vision API
 */
async function processImageWithAzureVision(base64Image: string, caption?: string): Promise<string | null> {
  if (!process.env.AZURE_VISION_API_KEY || !process.env.AZURE_VISION_ENDPOINT) {
    return null
  }

  try {
    console.log('🔍 [Media Processor] Chamando Azure Computer Vision API...')
    
    const endpoint = process.env.AZURE_VISION_ENDPOINT.replace(/\/$/, '')
    const url = `${endpoint}/vision/v3.2/ocr?language=pt&detectOrientation=true`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': process.env.AZURE_VISION_API_KEY,
      },
      body: Buffer.from(base64Image, 'base64'),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Media Processor] Azure Vision falhou:', response.status, errorText.substring(0, 200))
      return null
    }

    const data = await response.json()
    
    // Extrair texto de todas as regiões
    const textLines: string[] = []
    if (data.regions) {
      for (const region of data.regions) {
        if (region.lines) {
          for (const line of region.lines) {
            if (line.words) {
              const lineText = line.words.map((w: any) => w.text).join(' ')
              textLines.push(lineText)
            }
          }
        }
      }
    }
    
    const extractedText = textLines.join('\n')
    
    if (!extractedText) {
      console.log('⚠️ [Media Processor] Azure Vision não encontrou texto')
      return null
    }

    console.log('📝 [Media Processor] Texto extraído pelo Azure Vision:', extractedText.substring(0, 200))
    
    // Usar GPT para interpretar (se tiver OpenAI)
    if (process.env.OPENAI_API_KEY) {
      try {
        const interpretationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Você é um assistente que analisa textos de comprovantes e extrai informações em JSON.',
              },
              {
                role: 'user',
                content: `Analise este texto extraído de um comprovante:\n\n${extractedText}\n\n${caption ? `Legenda: ${caption}` : ''}\n\nExtraia: tipo (pix/boleto/etc), valor, data, nome_beneficiario, nome_pagador. Retorne APENAS JSON válido.`,
              },
            ],
            temperature: 0.1,
            max_tokens: 300,
          }),
        })

        if (interpretationResponse.ok) {
          const interpretationData = await interpretationResponse.json()
          const interpreted = interpretationData.choices?.[0]?.message?.content || ''
          
          const jsonMatch = interpreted.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const jsonData = JSON.parse(jsonMatch[0])
              return formatarComprovante(jsonData)
            } catch (e) {
              // Continuar sem interpretação
            }
          }
        }
      } catch (error) {
        // Continuar sem interpretação
      }
    }
    
    // Se não conseguiu interpretar, tentar extrair valor diretamente
    const valorMatch = extractedText.match(/R\$\s*(\d+[.,]?\d*)/i) || extractedText.match(/(\d+[.,]?\d*)\s*reais/i)
    if (valorMatch) {
      const valor = parseFloat(valorMatch[1].replace(',', '.'))
      return formatarComprovante({
        tipo: 'pix',
        valor,
        descricao: extractedText.substring(0, 100),
      })
    }
    
    return null
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro ao processar com Azure Vision:', error.message)
    return null
  }
}

/**
 * Formatar dados extraídos do comprovante para comando PLEN
 */
function formatarComprovante(dados: any): string {
  let comando = ''
  
  const tipo = dados.tipo?.toLowerCase() || 'pagamento'
  const valor = dados.valor ? parseFloat(dados.valor) : null
  
  // Para PIX: se tem nome_pagador, significa que você RECEBEU
  // Se tem nome_beneficiario, significa que você PAGOU
  const recebeu = dados.nome_pagador && !dados.nome_beneficiario
  const pagou = dados.nome_beneficiario || (!dados.nome_pagador && tipo !== 'recebimento')
  
  let nome = ''
  if (recebeu) {
    nome = dados.nome_pagador || ''
  } else if (pagou) {
    nome = dados.nome_beneficiario || dados.descricao || ''
  } else {
    nome = dados.nome_beneficiario || dados.nome_pagador || dados.descricao || ''
  }
  
  // Formatar comando baseado no tipo e direção
  if (tipo === 'recebimento' || recebeu) {
    if (valor && nome) {
      comando = `recebi ${valor.toFixed(2)} de ${nome.trim()}`
    } else if (valor) {
      comando = `recebi ${valor.toFixed(2)}`
    } else if (nome) {
      comando = `recebi de ${nome.trim()}`
    } else {
      comando = dados.descricao || 'recebi via PIX'
    }
  } else if (tipo === 'pix' || tipo === 'pagamento' || pagou) {
    if (valor && nome) {
      comando = `paguei ${valor.toFixed(2)} para ${nome.trim()}`
    } else if (valor) {
      comando = `paguei ${valor.toFixed(2)}`
    } else if (nome) {
      comando = `paguei para ${nome.trim()}`
    } else {
      comando = dados.descricao || 'paguei via PIX'
    }
  } else {
    if (valor) {
      comando = `${tipo} de ${valor.toFixed(2)}`
      if (nome) {
        comando += ` para ${nome.trim()}`
      }
    } else {
      comando = dados.descricao || `transação ${tipo}`
    }
  }
  
  if (dados.observacoes) {
    comando += `. ${dados.observacoes}`
  }
  
  console.log('📝 [Media Processor] Comando formatado:', comando)
  return comando
}

/** Extrai comando de texto livre (legenda, OCR, etc.) */
function extrairComandoDeTexto(texto: string): string | null {
  if (!texto || typeof texto !== 'string') return null
  const t = normalizarNumerosPorExtenso(texto.trim())
  if (t.length < 2) return null

  // "gastei 50 no mercado", "gastei 50 em X", "paguei 50 no X"
  const gasteiMatch = t.match(/gastei\s+(\d+)[.,]?(\d*)\s+(?:no|na|em|para)\s+([A-Za-z0-9\s]+?)(?:\s*\.|$|\n)/i)
  if (gasteiMatch) {
    const v = parseFloat((gasteiMatch[1] || '0') + '.' + (gasteiMatch[2] || '00').padEnd(2, '0'))
    const nome = gasteiMatch[3]?.trim()
    if (nome) return `paguei ${v.toFixed(2)} para ${nome}`
    return `paguei ${v.toFixed(2)}`
  }
  const recebiMatch = t.match(/recebi\s+(\d+)[.,]?(\d*)\s+(?:de)\s+([A-Za-z0-9\s]+?)(?:\s*\.|$|\n)/i)
  if (recebiMatch) {
    const v = parseFloat((recebiMatch[1] || '0') + '.' + (recebiMatch[2] || '00').padEnd(2, '0'))
    const nome = recebiMatch[3]?.trim()
    if (nome) return `recebi ${v.toFixed(2)} de ${nome}`
    return `recebi ${v.toFixed(2)}`
  }

  // Priorizar valor em contexto explícito (R$, Valor, Total) para não pegar número de data/código
  const valorMatch =
    t.match(/R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+[.,]?\d*)/i) ||
    t.match(/(?:valor|total)\s*[:\s]*R?\$?\s*(\d+[.,]?\d*)/i) ||
    t.match(/(\d+)[.,]?(\d*)\s*reais/i) ||
    t.match(/(\d+)[.,](\d{2})/)
  let numValor: number | null = null
  if (valorMatch) {
    const g1 = valorMatch[1] ?? ''
    const g2 = valorMatch[2] ?? ''
    const s = g2 !== '' ? `${g1}.${g2.padEnd(2, '0')}` : g1.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    numValor = parseFloat(s)
    if (isNaN(numValor) || numValor <= 0) numValor = null
  }
  if (numValor == null) {
    const todosValores = [...t.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g)].map((m) => {
      const x = m[0].replace(/\./g, '').replace(',', '.')
      return parseFloat(x)
    }).filter((n) => !isNaN(n) && n > 0 && n < 10_000_000)
    if (todosValores.length > 0) numValor = Math.max(...todosValores)
  }
  const valorOk = numValor != null && numValor > 0
  const quemRecebeu = t.match(/(?:quem\s+recebeu|recebedor|beneficiário|nome_beneficiario)\s*[:\s]*([A-Za-z0-9\s.-]+?)(?:\n|,|\.|$)/i)?.[1]?.trim() || t.match(/para\s+([A-Za-z0-9\s.-]{2,}?)(?:\s*\.|$|\n)/i)?.[1]?.trim()
  const quemPagou = t.match(/(?:quem\s+pagou|pagador|nome_pagador)\s*[:\s]*([A-Za-z0-9\s.-]+?)(?:\n|,|\.|$)/i)?.[1]?.trim()
  const recebido = /recebido|recebi|recebeu\s+de/i.test(t) || (!!quemPagou && !quemRecebeu)
  if (valorOk) {
    if (recebido && quemPagou) return `recebi ${numValor!.toFixed(2)} de ${quemPagou}`
    if (quemRecebeu) return `paguei ${numValor!.toFixed(2)} para ${quemRecebeu}`
    if (quemPagou) return `recebi ${numValor!.toFixed(2)} de ${quemPagou}`
    return `paguei ${numValor!.toFixed(2)}`
  }
  if (quemRecebeu) return `paguei para ${quemRecebeu}`
  if (quemPagou) return `recebi de ${quemPagou}`
  return null
}

/** Extrai objeto JSON de texto (suporta ```json ... ``` e { ... }) */
function extrairJsonDaResposta(texto: string): any | null {
  if (!texto || typeof texto !== 'string') return null
  const t = texto.trim()
  const codeBlock = t.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = codeBlock ? codeBlock[1].trim() : t.match(/\{[\s\S]*\}/)?.[0]
  if (!jsonStr) return null
  try {
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

/** Extensão e MIME para Whisper (Groq/OpenAI aceitam: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm) */
function getAudioFileInfo(mimeType: string): { ext: string; mime: string } {
  const t = (mimeType || '').toLowerCase()
  if (t.includes('ogg') || t.includes('opus')) return { ext: '.ogg', mime: 'audio/ogg' }
  if (t.includes('webm')) return { ext: '.webm', mime: 'audio/webm' }
  if (t.includes('wav')) return { ext: '.wav', mime: 'audio/wav' }
  if (t.includes('mp4') || t.includes('m4a')) return { ext: '.m4a', mime: 'audio/mp4' }
  if (t.includes('mpeg') || t.includes('mp3')) return { ext: '.mp3', mime: 'audio/mpeg' }
  if (t.includes('flac')) return { ext: '.flac', mime: 'audio/flac' }
  return { ext: '.ogg', mime: 'audio/ogg' }
}

/** Verifica se o buffer parece ser áudio (evita enviar HTML/JSON de erro para a API). */
function looksLikeAudio(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 100) return false
  const head = buffer.subarray(0, 12)
  // Rejeitar HTML (<) e JSON ({)
  if (head[0] === 0x3c || head[0] === 0x7b) return false
  // Ogg/Opus
  if (head.toString('utf8', 0, 4) === 'OggS') return true
  // WebM/Matroska
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return true
  // MP3 (MPEG frame sync)
  if (head[0] === 0xff && (head[1] === 0xfb || head[1] === 0xfa || head[1] === 0xf3)) return true
  // ID3 tag
  if (head.toString('utf8', 0, 3) === 'ID3') return true
  // MP4/M4A (ftyp at offset 4)
  if (head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) return true
  // WAV (RIFF....WAVE)
  if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x41 && head[10] === 0x56 && head[11] === 0x45) return true
  return false
}

/**
 * Transcrever áudio usando Groq Whisper (GRATUITO)
 */
async function transcribeAudioWithGroq(audioBuffer: Buffer, mimeType: string): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) {
    console.log('⚠️ [Media Processor] GROQ_API_KEY não configurada')
    return null
  }

  try {
    if (!looksLikeAudio(audioBuffer)) {
      console.warn('🎤 [Media Processor] Buffer não parece ser áudio válido (pode ser HTML/erro do servidor)')
      return null
    }

    const { ext, mime } = getAudioFileInfo(mimeType)
    console.log('🎤 [Media Processor] Transcrevendo com Groq Whisper, tamanho:', audioBuffer.length, 'mime:', mime, 'ext:', ext)

    const groqWhisperModels = ['whisper-large-v3-turbo', 'whisper-large-v3']

    for (const model of groqWhisperModels) {
      for (const [extTry, mimeTry] of [[ext, mime], ['.webm', 'audio/webm'], ['.ogg', 'audio/ogg']] as [string, string][]) {
        try {
          const formData = new FormData()
          const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeTry })
          formData.append('file', blob, `audio${extTry}`)
          formData.append('model', model)
          formData.append('language', 'pt')
          formData.append('response_format', 'json')
          // Genérico: qualquer pedido de registro — valor em algarismos e frase completa (com X, no Y)
          formData.append('prompt', 'Transcrição em português: pessoa registrando GASTO (gastei, paguei) ou ENTRADA (ganhei, recebi) em reais. Regras: 1) VALORES sempre em algarismos completos (ex.: 50, 80, 200, 450, 1200) — nunca use 2 ou 2,00 para valores em reais. 2) Mantenha a frase completa incluindo a descrição: "com roupas", "no mercado", "em eletrônicos", "de mãe", etc. Exemplos: "gastei 50 no mercado", "paguei 450 com roupas", "recebi 300 de João".')
          const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            body: formData,
          })
          if (!response.ok) {
            if (extTry !== ext) console.log(`🎤 [Media Processor] Groq com ${extTry} falhou:`, response.status)
            continue
          }
          const data = await response.json()
          const text = (data.text || '').trim()
          if (text) {
            console.log('✅ [Media Processor] Groq transcreveu:', text.substring(0, 80))
            return text
          }
        } catch (err: any) {
          if (extTry === ext) console.error(`❌ [Media Processor] Groq ${model}:`, err.message)
          continue
        }
      }
    }
    return null
  } catch (err: any) {
    console.error('❌ [Media Processor] Erro Groq:', err.message)
    return null
  }
}

/**
 * Transcrever áudio usando Gemini (GRATUITO) - FALLBACK ou retry com prompt de frase completa
 */
async function transcribeAudioWithGemini(
  audioBuffer: Buffer,
  mimeType: string,
  customPrompt?: string
): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ [Media Processor] GEMINI_API_KEY não configurada')
    return null
  }

  try {
    console.log('🎤 [Media Processor] ==========================================')
    console.log('🎤 [Media Processor] Transcrevendo áudio com Gemini...')
    console.log('🎤 [Media Processor] Tamanho do buffer:', audioBuffer.length, 'bytes')
    console.log('🎤 [Media Processor] MIME type:', mimeType)
    
    const audioBase64 = audioBuffer.toString('base64')
    const geminiMimeType = mimeType || 'audio/webm'
    
    const geminiModels = ['gemini-1.5-flash', 'gemini-1.5-pro']
    
    const prompt = customPrompt ?? `Transcreva este áudio para português. A pessoa está registrando um GASTO (gastei, paguei) ou ENTRADA (ganhei, recebi) em reais.
Regras: 1) Valores em reais: escreva o número COMPLETO. Se ouvir "duzentos" ou "200" → escreva 200 (NUNCA 2 nem 2.00). Se ouvir "quatrocentos" ou "400" → escreva 400. 2) Exemplos corretos: "paguei 200", "gastei 400 com roupas", "paguei 80 no mercado". 3) Saída: apenas o texto transcrito.`
    
    for (const model of geminiModels) {
      try {
        console.log(`🎤 [Media Processor] Tentando transcrever com Gemini modelo: ${model}`)
        
        // Modelos 1.5 estão em v1beta; v1 retorna 404 para gemini-1.5-pro
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: geminiMimeType,
                      data: audioBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1000,
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ [Media Processor] Gemini modelo ${model} falhou:`, response.status, errorText.substring(0, 200))
          continue // Tentar próximo modelo
        }

        const data = await response.json()
        const transcribedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        
        if (transcribedText) {
          console.log(`✅ [Media Processor] Gemini modelo ${model} transcreveu com sucesso:`, transcribedText.substring(0, 100))
          return transcribedText.trim()
        }
      } catch (error: any) {
        console.error(`❌ [Media Processor] Erro ao chamar Gemini modelo ${model}:`, error.message)
        continue
      }
    }
    
    console.error('❌ [Media Processor] Todos os modelos Gemini falharam na transcrição')
    return null
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro geral ao transcrever áudio com Gemini:', error.message)
    return null
  }
}

/** Verifica se a transcrição parece incompleta (só verbo + número, sem descrição). */
function isTranscriptionIncomplete(text: string): boolean {
  const t = (text || '').trim()
  if (t.length < 10 || t.length > 120) return false
  // Parece "paguei 200" ou "gastei 50 reais" sem "no mercado", "com roupas", etc.
  const soVerboNumero = /^(gastei|paguei|ganhei|recebi)\s+[\d.,]+(\s*(reais?|r\$)?\.?)?$/i.test(t)
  const temDescricao = /\b(com|no|na|de|em)\s+[a-záàâãéêíóôõúç]{2,}/i.test(t)
  return soVerboNumero && !temDescricao
}

/** Corrige erro comum da transcrição: "paguei 2.00" ou "gastei 2" quando a pessoa disse 200. */
function corrigirValorDoisNaTranscricao(text: string): string {
  const t = (text || '').trim()
  // Só verbo + 2 ou 2.00 (sem descrição) → muito provável que seja 200
  if (/^(gastei|paguei|ganhei|recebi)\s+2(\.0{1,2})?(\s*(reais?|r\$)?\.?)?$/i.test(t)) {
    const verb = t.match(/^(gastei|paguei|ganhei|recebi)/i)?.[1] ?? 'paguei'
    const corrigido = `${verb} 200`
    console.log('🎤 [Media Processor] Transcrição corrigida (2/2.00 → 200):', t, '→', corrigido)
    return corrigido
  }
  return t
}

const PROMPT_AUDIO_FRASE_COMPLETA = `Transcreva este áudio para português. A pessoa está dizendo quanto GASTOU ou RECEBEU e EM QUE ou DE QUEM.
Inclua a frase COMPLETA: valor em algarismos e a descrição (ex.: "gastei 200 no mercado", "paguei 80 no posto", "ganhei 500 de mãe", "gastei 400 com roupas").
Saída: apenas o texto transcrito, sem explicações.`

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string | null> {
  console.log('🎤 [Media Processor] ==========================================')
  console.log('🎤 [Media Processor] INICIANDO TRANSCRIÇÃO DE ÁUDIO')
  console.log('🎤 [Media Processor] Tamanho do áudio:', audioBuffer.length, 'bytes')
  console.log('🎤 [Media Processor] MIME type:', mimeType)
  console.log('🎤 [Media Processor] GROQ_API_KEY configurada?', !!process.env.GROQ_API_KEY)
  console.log('🎤 [Media Processor] GEMINI_API_KEY configurada?', !!process.env.GEMINI_API_KEY)
  console.log('🎤 [Media Processor] ==========================================')
  
  let firstResult: string | null = null

  // Groq Whisper — único provedor de transcrição (Gemini retorna 404 na API atual)
  if (process.env.GROQ_API_KEY) {
    console.log('🎤 [Media Processor] Transcrevendo com Groq Whisper...')
    const r = await transcribeAudioWithGroq(audioBuffer, mimeType)
    if (r) {
      const corrigido = corrigirValorDoisNaTranscricao(r)
      // "quatrocentos"/"duzentos" → 400/200 para extração e interpretação
      const normalizado = normalizarNumerosPorExtenso(corrigido)
      console.log('✅ [Media Processor] Áudio transcrito:', normalizado.slice(0, 60))
      return normalizado
    }
  }
  console.error('❌ [Media Processor] Transcrição falhou. Configure GROQ_API_KEY para áudio.')
  return null
}

/** Resultado da extração direta de áudio (um único passo com Gemini). */
export type RegistroExtraidoDeAudio = {
  tipo: 'saida' | 'entrada'
  valor: number
  nome: string
}

const PROMPT_AUDIO_PARA_JSON = `Ouça este áudio em português. A pessoa está registrando um GASTO (gastei, paguei) ou uma ENTRADA (ganhei, recebi) em reais.

IMPORTANTE: Use o valor EXATO em reais que a pessoa FALOU. Se ela disse "quatrocentos" ou "400" ou "quatrocentos reais" → valor 400. Se disse "duzentos" ou "200" → valor 200. NUNCA troque 400 por 200 nem 200 por 400.

Responda APENAS com um JSON válido, sem outro texto:
{"tipo":"gasto","valor":NÚMERO,"nome":"descrição"}
ou entrada:
{"tipo":"entrada","valor":NÚMERO,"nome":"descrição"}

Regras:
- tipo: "gasto" se gastou/pagou; "entrada" se recebeu/ganhou.
- valor: o número em reais que a pessoa disse (50, 80, 100, 200, 300, 400, 500, etc.).
- nome: descrição em poucas palavras (Roupas, mercado, posto, mãe). Se não entender, use "Gasto" ou "Entrada".

Exemplos: áudio "gastei quatrocentos com roupas" → {"tipo":"gasto","valor":400,"nome":"Roupas"}
"paguei 80 no mercado" → {"tipo":"gasto","valor":80,"nome":"mercado"}
"ganhei 500 de mãe" → {"tipo":"entrada","valor":500,"nome":"mãe"}`

/** Extrai o primeiro objeto JSON da resposta de áudio (ex.: "Texto {\"tipo\":\"gasto\",...}" ou markdown). */
function parseAudioRegistroJson(raw: string): { tipo?: string; valor?: number; nome?: string } | null {
  const t = (raw ?? '').trim()
  const semMarkdown = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const candidatos = [semMarkdown, t]
  for (const s of candidatos) {
    const idx = s.indexOf('{')
    if (idx === -1) continue
    let depth = 0
    let end = -1
    for (let i = idx; i < s.length; i++) {
      if (s[i] === '{') depth++
      else if (s[i] === '}') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end === -1) continue
    try {
      const parsed = JSON.parse(s.slice(idx, end + 1)) as { tipo?: string; valor?: number; nome?: string }
      if (parsed && typeof parsed === 'object') return parsed
    } catch (_) {}
  }
  return null
}

/**
 * Nova solução: envia o áudio direto ao Gemini e recebe tipo + valor + nome em um passo.
 * Evita erros de transcrição + extração em cadeia. Requer GEMINI_API_KEY.
 */
export async function extrairRegistroDeAudioComGemini(
  audioBuffer: Buffer,
  mimeType: string
): Promise<RegistroExtraidoDeAudio | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.log('🎤 [Media Processor] Extração direta de áudio: GEMINI_API_KEY não configurada')
    return null
  }
  if (!audioBuffer?.length) {
    console.log('🎤 [Media Processor] Extração direta de áudio: buffer vazio')
    return null
  }

  const audioBase64 = audioBuffer.toString('base64')
  // WhatsApp/API Fácil costuma enviar audio/ogg (Opus). Gemini aceita ogg/opus.
  const geminiMimeType = mimeType && /^audio\//.test(mimeType) ? mimeType : 'audio/ogg'
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro']

  for (const model of models) {
    try {
      // Modelos 1.5 disponíveis em v1beta (v1 retorna 404)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT_AUDIO_PARA_JSON },
                { inline_data: { mime_type: geminiMimeType, data: audioBase64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 150, responseMimeType: 'application/json' },
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        console.log(`🎤 [Media Processor] Extração áudio ${model} HTTP ${res.status}:`, errText.slice(0, 180))
        continue
      }
      const data = await res.json()
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const parsed = parseAudioRegistroJson(raw)
      if (!parsed) {
        console.log(`🎤 [Media Processor] Extração áudio ${model}: resposta sem JSON válido:`, raw.slice(0, 200))
        continue
      }
      const tipo = parsed.tipo?.toLowerCase()
      const valor = typeof parsed.valor === 'number' ? parsed.valor : parseInt(String(parsed.valor), 10)
      const nome = String(parsed.nome ?? '').trim()
      if ((tipo === 'gasto' || tipo === 'entrada') && Number.isFinite(valor) && valor >= 1 && valor <= 500_000 && nome.length >= 1) {
        const tipoNorm: 'saida' | 'entrada' = tipo === 'entrada' ? 'entrada' : 'saida'
        const nomeNorm = nome.length >= 2 ? nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase() : nome
        console.log('✅ [Media Processor] Extração direta de áudio (Gemini):', { tipo: tipoNorm, valor, nome: nomeNorm })
        return { tipo: tipoNorm, valor, nome: nomeNorm }
      }
      console.log(`🎤 [Media Processor] Extração áudio ${model}: validação falhou (tipo=${tipo}, valor=${valor}, nome=${nome?.slice(0, 30)})`)
    } catch (e: any) {
      console.log(`🎤 [Media Processor] Extração áudio ${model} erro:`, e?.message ?? e)
    }
  }
  console.log('🎤 [Media Processor] Extração direta de áudio falhou; será usado fallback (transcrição).')
  return null
}



