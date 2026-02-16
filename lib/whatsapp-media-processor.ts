/**
 * Processamento de mídia (imagens e áudios) para WhatsApp
 */

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

/** OCR puro: pede só o texto da imagem (sem IA interpretar). Depois extraímos comando com regras. */
async function ocrImageSóTexto(base64Image: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY || !base64Image || base64Image.length < 100) return null
  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Transcreva todo o texto visível nesta imagem, na ordem. Apenas o texto, linha por linha, sem explicação nem JSON.' }, { inline_data: { mime_type: 'image/jpeg', data: base64Image } }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 1024 },
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    return text || null
  } catch {
    return null
  }
}

export async function processComprovanteImage(imageBuffer: Buffer, caption?: string): Promise<string | null> {
  try {
    console.log('🔍 [Media Processor] Processando comprovante de imagem...')
    if (!looksLikeImage(imageBuffer)) {
      console.error('❌ [Media Processor] Buffer não parece imagem (pode ser HTML/erro do servidor)')
      return null
    }
    const base64Image = imageBuffer.toString('base64')

    // 1) OCR primeiro (só texto, sem pedir JSON à IA) → nossas regras extraem valor/nome
    if (process.env.GEMINI_API_KEY) {
      console.log('🔍 [Media Processor] Tentando OCR só texto (sem IA interpretar)...')
      const ocrText = await ocrImageSóTexto(base64Image)
      if (ocrText) {
        const cmd = extrairComandoDeTexto(ocrText)
        if (cmd) {
          console.log('✅ [Media Processor] Comando extraído do OCR:', cmd)
          return cmd
        }
        if (caption) {
          const cmdLegenda = extrairComandoDeTexto(ocrText + '\n' + caption)
          if (cmdLegenda) return cmdLegenda
        }
      }
    }

    // 2) Fallback: IA que tenta retornar JSON (pode falhar ou atrapalhar)
    
    // Tentar Gemini (gratuito)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('🔍 [Media Processor] Tentando Gemini (gratuito)...')
        const result = await processImageWithGemini(base64Image, caption)
        if (result) {
          console.log('✅ [Media Processor] Gemini processou com sucesso!')
          return result
        }
      } catch (error: any) {
        console.error('❌ [Media Processor] Erro ao processar com Gemini:', error.message)
      }
    }
    
    // 2. Tentar OpenAI GPT-4o Vision (mais confiável, mas pago)
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('🔍 [Media Processor] Tentando OpenAI GPT-4o Vision (mais confiável)...')
        const result = await processImageWithOpenAI(base64Image, caption)
        if (result) {
          console.log('✅ [Media Processor] OpenAI GPT-4o Vision processou com sucesso!')
          return result
        }
      } catch (error: any) {
        console.error('❌ [Media Processor] Erro ao processar com OpenAI:', error.message)
      }
    }
    
    // 3. Tentar Google Cloud Vision (gratuito - 1000/mês)
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
    
    // 4. Tentar Azure Computer Vision (gratuito - 5000/mês)
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
    
    // Se nenhuma funcionou, retornar null
    console.log('⚠️ [Media Processor] Nenhum provedor de IA funcionou. Configure GEMINI_API_KEY, OPENAI_API_KEY, GOOGLE_CLOUD_VISION_API_KEY ou AZURE_VISION_API_KEY.')
    return null
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro ao processar imagem:', error.message)
    return null
  }
}

/**
 * Processar imagem com Google Gemini (Gratuito e Funcional)
 */
async function processImageWithGemini(base64Image: string, caption?: string): Promise<string | null> {
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

  const prompt = `Analise esta imagem de comprovante (PIX, boleto, recibo). Extraia em JSON.

PIX enviado (você pagou): "Quem recebeu" = nome_beneficiario, valor em reais. tipo = "pix".
PIX recebido (você recebeu): "Quem pagou" = nome_pagador, valor. tipo = "recebimento".
Valor: use número (ex: R$ 80,00 → 80). Data: YYYY-MM-DD se possível.

Retorne SOMENTE um JSON válido, sem markdown: {"tipo":"pix"|"recebimento","valor":número,"data":null ou "YYYY-MM-DD","nome_beneficiario":"","nome_pagador":"","descricao":""}
${caption ? ` Legenda: ${caption}` : ''}`

  try {
    console.log('🔍 [Media Processor] Chamando Gemini API...')
    
    // Modelos disponíveis (tentar na ordem)
    const geminiModels = [
      'gemini-1.5-flash',      // Mais estável e amplamente disponível
      'gemini-1.5-pro',       // Mais avançado
      'gemini-2.0-flash-exp', // Experimental
    ]
    
    let lastError: any = null
    
    for (const model of geminiModels) {
      try {
        console.log(`🔍 [Media Processor] Tentando modelo Gemini: ${model}`)
        
        // Endpoint: usar v1 para modelos 1.5, v1beta para 2.0+
        const apiVersion = model.startsWith('gemini-2') ? 'v1beta' : 'v1'
        const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
        
        console.log(`🔍 [Media Processor] URL da API: ${apiUrl.replace(process.env.GEMINI_API_KEY, 'KEY_HIDDEN')}`)
        
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
 * Processar imagem com OpenAI GPT-4o Vision
 */
async function processImageWithOpenAI(base64Image: string, caption?: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  const prompt = `Analise esta imagem de comprovante (PIX, boleto, recibo). Extraia em JSON.
PIX enviado (você pagou): "Quem recebeu" = nome_beneficiario, valor em reais. tipo = "pix".
PIX recebido (você recebeu): "Quem pagou" = nome_pagador, valor. tipo = "recebimento".
Valor: número (ex: R$ 80,00 → 80). Data: YYYY-MM-DD se possível.
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

/** Extrai comando de texto livre quando a IA não retorna JSON */
function extrairComandoDeTexto(texto: string): string | null {
  if (!texto || typeof texto !== 'string') return null
  const t = texto.trim()
  if (t.length < 3) return null
  const valorMatch = t.match(/R\$\s*(\d+)[.,]?(\d*)/i) || t.match(/valor[:\s]+(\d+)[.,]?(\d*)/i) || t.match(/(\d+)[.,](\d{2})/)
  const numValor = valorMatch ? parseFloat((valorMatch[1] || '0') + '.' + (valorMatch[2] || '00').padEnd(2, '0')) : null
  const valorOk = numValor != null && !isNaN(numValor) && numValor > 0
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
 * Transcrever áudio usando Gemini (GRATUITO) - FALLBACK
 */
async function transcribeAudioWithGemini(audioBuffer: Buffer, mimeType: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ [Media Processor] GEMINI_API_KEY não configurada')
    return null
  }

  try {
    console.log('🎤 [Media Processor] ==========================================')
    console.log('🎤 [Media Processor] Transcrevendo áudio com Gemini...')
    console.log('🎤 [Media Processor] API Key (primeiros 10 chars):', process.env.GEMINI_API_KEY.substring(0, 10) + '...')
    console.log('🎤 [Media Processor] Tamanho do buffer:', audioBuffer.length, 'bytes')
    console.log('🎤 [Media Processor] MIME type:', mimeType)
    
    // Converter Buffer para base64
    const audioBase64 = audioBuffer.toString('base64')
    
    // Mapear MIME type do áudio
    const geminiMimeType = mimeType || 'audio/webm'
    
    // Modelos Gemini que suportam áudio
    const geminiModels = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp'
    ]
    
    const prompt = 'Transcreva este áudio para português. Retorne apenas o texto transcrito, sem explicações ou marcações adicionais.'
    
    for (const model of geminiModels) {
      try {
        console.log(`🎤 [Media Processor] Tentando transcrever com Gemini modelo: ${model}`)
        
        const apiVersion = model.startsWith('gemini-2') ? 'v1beta' : 'v1'
        const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
        
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

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string | null> {
  console.log('🎤 [Media Processor] ==========================================')
  console.log('🎤 [Media Processor] INICIANDO TRANSCRIÇÃO DE ÁUDIO')
  console.log('🎤 [Media Processor] Tamanho do áudio:', audioBuffer.length, 'bytes')
  console.log('🎤 [Media Processor] MIME type:', mimeType)
  console.log('🎤 [Media Processor] GROQ_API_KEY configurada?', !!process.env.GROQ_API_KEY)
  console.log('🎤 [Media Processor] GEMINI_API_KEY configurada?', !!process.env.GEMINI_API_KEY)
  console.log('🎤 [Media Processor] OPENAI_API_KEY configurada?', !!process.env.OPENAI_API_KEY)
  console.log('🎤 [Media Processor] ==========================================')
  
  // 1) Gemini primeiro: aceita áudio inline, menos exigente com formato (evita 400 do Groq)
  if (process.env.GEMINI_API_KEY) {
    console.log('🎤 [Media Processor] Tentando Gemini (áudio inline)...')
    const r = await transcribeAudioWithGemini(audioBuffer, mimeType)
    if (r) {
      console.log('✅ [Media Processor] Gemini transcreveu áudio')
      return r
    }
  }

  // 2) Groq Whisper (pode dar 400 com alguns formatos)
  if (process.env.GROQ_API_KEY) {
    console.log('🎤 [Media Processor] Tentando Groq Whisper...')
    const r = await transcribeAudioWithGroq(audioBuffer, mimeType)
    if (r) return r
  }

  // 3) OpenAI Whisper
  if (process.env.OPENAI_API_KEY) {
    try {
      if (!looksLikeAudio(audioBuffer)) return null
      const { ext, mime } = getAudioFileInfo(mimeType)
      const formData = new FormData()
      const uint8Array = new Uint8Array(audioBuffer)
      const blob = new Blob([uint8Array], { type: mime })
      formData.append('file', blob, `audio${ext}`)
      formData.append('model', 'whisper-1')
      formData.append('language', 'pt')

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [Media Processor] OpenAI Whisper:', response.status, errorText.substring(0, 300))
        return null
      }

      const data = await response.json()
      const text = (data.text || '').trim()
      if (text) {
        console.log('✅ [Media Processor] OpenAI transcreveu:', text.substring(0, 80))
        return text
      }
    } catch (err: any) {
      console.error('❌ [Media Processor] Erro OpenAI Whisper:', err.message)
    }
  }
  
  console.error('❌ [Media Processor] Nenhuma IA configurada para transcrever áudio (GEMINI_API_KEY ou OPENAI_API_KEY)')
  return null
}




