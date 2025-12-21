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
export function detectMedia(body: any): MediaInfo | null {
  console.log('🔍 [Media Processor] Detectando mídia no body:', {
    keys: Object.keys(body),
    tipo_mensagem: body.tipo_mensagem,
    type: body.type,
    mimetype: body.mimetype,
    has_url_media: !!body.url_media,
    has_media_url: !!body.media_url,
    has_url: !!body.url,
  })
  
  // ESTRATÉGIA 1: Verificar campos de tipo de mensagem
  const isImage = 
    body.tipo_mensagem === 'image' || 
    body.tipo_mensagem === 'imagem' ||
    body.type === 'image' || 
    body.mimetype?.startsWith('image/') ||
    body.tipo === 'image' ||
    body.tipo === 'imagem' ||
    body.messageType === 'image' ||
    body.mediaType === 'image'
  
  // ESTRATÉGIA 2: Verificar se há URL de mídia E o campo mensagem está vazio ou parece ser URL
  const hasMediaUrl = body.url_media || body.media_url || body.url || body.image_url || body.mediaUrl || body.media
  const hasText = body.mensagem || body.message || body.text || body.body
  const isLikelyMedia = hasMediaUrl && (!hasText || (typeof hasText === 'string' && hasText.match(/^https?:\/\//)))
  
  if (isImage || isLikelyMedia) {
    const imageUrl = body.url_media || body.media_url || body.url || body.image_url || body.mediaUrl || body.media
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
      console.log('🔍 [Media Processor] URL suspeita de mídia (apifacil/S3) encontrada:', field.substring(0, 100))
      return {
        type: 'image',
        url: field.trim(),
        mimetype: 'image/jpeg',
        caption: '',
      }
    }
  }
  
  const isAudio = 
    body.tipo_mensagem === 'audio' || 
    body.tipo_mensagem === 'voice' ||
    body.type === 'audio' || 
    body.mimetype?.startsWith('audio/') ||
    body.tipo === 'audio' ||
    body.messageType === 'audio' ||
    body.mediaType === 'audio'
  
  if (isAudio) {
    const audioUrl = body.url_media || body.media_url || body.url || body.audio_url || body.mediaUrl || body.media
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
  
  // Verificar se há URL de mídia mesmo sem tipo explícito (pode ser imagem)
  const hasMediaUrlAlt = body.url_media || body.media_url || body.mediaUrl || body.url
  if (hasMediaUrlAlt && !body.mensagem && !body.text && !body.message && !isImage && !isAudio && !isDocument) {
    console.log('📎 [Media Processor] URL de mídia encontrada sem tipo explícito, assumindo imagem')
    return {
      type: 'image',
      url: hasMediaUrlAlt,
      mimetype: body.mimetype || 'image/jpeg',
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
 * Baixar mídia do apifacil.dev
 */
export async function downloadMedia(mediaUrl: string): Promise<Buffer | null> {
  try {
    console.log('📥 [Media Processor] Baixando mídia:', mediaUrl.substring(0, 100))
    
    // Se for base64, converter diretamente
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
    
    // Se não começar com http, pode ser um caminho relativo ou ID
    if (!mediaUrl.startsWith('http')) {
      console.log('⚠️ [Media Processor] URL não parece ser válida:', mediaUrl)
      return null
    }
    
    const response = await fetch(mediaUrl)
    if (!response.ok) {
      console.error('❌ [Media Processor] Erro ao baixar mídia:', response.status, response.statusText)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro ao baixar mídia:', error.message)
    return null
  }
}

/**
 * Processar imagem de comprovante usando IA
 */
export async function processComprovanteImage(imageBuffer: Buffer, caption?: string): Promise<string | null> {
  try {
    console.log('🔍 [Media Processor] Processando comprovante de imagem...')
    
    // Converter imagem para base64
    const base64Image = imageBuffer.toString('base64')
    
    // Prioridade: Gemini (Gratuito) → OpenAI GPT-4o Vision → Google Cloud Vision → Azure Vision
    
    // 1. Tentar Gemini primeiro (gratuito e funciona bem)
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

  const prompt = `Analise esta imagem de comprovante de pagamento PIX, boleto, ou comprovante de compra e extraia TODAS as informações disponíveis em formato JSON:

IMPORTANTE: Para comprovantes PIX, identifique:
- "Quem recebeu" / "Recebedor" = nome_beneficiario (para quem você PAGOU)
- "Quem pagou" / "Pagador" = nome_pagador (você ou quem pagou)
- "Valor" = valor da transação
- "Data" = data da transação

Para outros comprovantes, identifique:
- Valor pago/recebido
- Nome da pessoa/empresa
- Data
- Descrição do pagamento

Retorne JSON com esta estrutura:
{
  "tipo": "pix" | "boleto" | "comprovante_compra" | "pagamento" | "recebimento" | "outro",
  "valor": número em reais (ex: 150.50),
  "data": "YYYY-MM-DD" ou null,
  "descricao": "descrição do pagamento",
  "nome_beneficiario": "nome de QUEM RECEBEU (se você pagou) ou quem você vai pagar",
  "nome_pagador": "nome de QUEM PAGOU (você ou outro pagador)",
  "observacoes": "outras informações relevantes"
}

${caption ? `Legenda do usuário: "${caption}"` : ''}

Se for um PIX onde você PAGOU para alguém:
- tipo: "pix"
- nome_beneficiario: nome de quem recebeu
- valor: valor que você pagou

Se for um PIX onde você RECEBEU de alguém:
- tipo: "recebimento"  
- nome_pagador: nome de quem pagou para você
- valor: valor que você recebeu

Retorne APENAS o JSON válido, sem markdown, sem explicações, sem texto adicional.`

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
            
            // Tentar extrair JSON da resposta
            const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              try {
                const jsonData = JSON.parse(jsonMatch[0])
                console.log('✅ [Media Processor] JSON extraído:', JSON.stringify(jsonData))
                return formatarComprovante(jsonData)
              } catch (parseError: any) {
                console.error('❌ [Media Processor] Erro ao fazer parse do JSON:', parseError.message)
                console.error('❌ [Media Processor] Texto que falhou no parse:', extractedText.substring(0, 200))
                // Retornar texto mesmo assim
                return extractedText
              }
            }
            
            return extractedText
          } else {
            console.log('⚠️ [Media Processor] Gemini retornou resposta vazia')
            console.log('⚠️ [Media Processor] Data completa:', JSON.stringify(data))
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

  const prompt = `Analise esta imagem de comprovante de pagamento PIX, boleto, ou comprovante de compra e extraia TODAS as informações disponíveis em formato JSON:

IMPORTANTE: Para comprovantes PIX, identifique:
- "Quem recebeu" / "Recebedor" = nome_beneficiario (para quem você PAGOU)
- "Quem pagou" / "Pagador" = nome_pagador (você ou quem pagou)
- "Valor" = valor da transação
- "Data" = data da transação

Para outros comprovantes, identifique:
- Valor pago/recebido
- Nome da pessoa/empresa
- Data
- Descrição do pagamento

Retorne JSON com esta estrutura:
{
  "tipo": "pix" | "boleto" | "comprovante_compra" | "pagamento" | "recebimento" | "outro",
  "valor": número em reais (ex: 150.50),
  "data": "YYYY-MM-DD" ou null,
  "descricao": "descrição do pagamento",
  "nome_beneficiario": "nome de QUEM RECEBEU (se você pagou) ou quem você vai pagar",
  "nome_pagador": "nome de QUEM PAGOU (você ou outro pagador)",
  "observacoes": "outras informações relevantes"
}

${caption ? `Legenda do usuário: "${caption}"` : ''}

Se for um PIX onde você PAGOU para alguém:
- tipo: "pix"
- nome_beneficiario: nome de quem recebeu
- valor: valor que você pagou

Se for um PIX onde você RECEBEU de alguém:
- tipo: "recebimento"  
- nome_pagador: nome de quem pagou para você
- valor: valor que você recebeu

Retorne APENAS o JSON válido, sem markdown, sem explicações, sem texto adicional.`

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
    
    // Tentar extrair JSON da resposta
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0])
        console.log('✅ [Media Processor] JSON extraído:', jsonData)
        return formatarComprovante(jsonData)
      } catch (parseError: any) {
        console.error('❌ [Media Processor] Erro ao fazer parse do JSON:', parseError.message)
        return extractedText
      }
    }
    
    return extractedText
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

/**
 * Transcrever áudio usando OpenAI Whisper
 */
/**
 * Transcrever áudio usando Groq Whisper (GRATUITO)
 */
async function transcribeAudioWithGroq(audioBuffer: Buffer, mimeType: string): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) {
    console.log('⚠️ [Media Processor] GROQ_API_KEY não configurada')
    return null
  }

  try {
    console.log('🎤 [Media Processor] ==========================================')
    console.log('🎤 [Media Processor] Transcrevendo áudio com Groq Whisper...')
    console.log('🎤 [Media Processor] API Key (primeiros 10 chars):', process.env.GROQ_API_KEY.substring(0, 10) + '...')
    console.log('🎤 [Media Processor] Tamanho do buffer:', audioBuffer.length, 'bytes')
    console.log('🎤 [Media Processor] MIME type:', mimeType)
    
    // Groq Whisper usa API compatível com OpenAI
    // Modelos: whisper-large-v3-turbo (rápido) ou whisper-large-v3 (preciso)
    const groqWhisperModels = [
      'whisper-large-v3-turbo',  // Rápido
      'whisper-large-v3'         // Preciso
    ]
    
    for (const model of groqWhisperModels) {
      try {
        console.log(`🎤 [Media Processor] Tentando transcrever com Groq Whisper modelo: ${model}`)
        
        // Criar FormData para enviar arquivo (formato OpenAI-compatible)
        const formData = new FormData()
        // Converter Buffer para Uint8Array para compatibilidade com Blob
        const uint8Array = new Uint8Array(audioBuffer)
        const blob = new Blob([uint8Array], { type: mimeType || 'audio/webm' })
        formData.append('file', blob, 'audio.webm')
        formData.append('model', model)
        formData.append('language', 'pt') // Português
        
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ [Media Processor] Groq Whisper modelo ${model} falhou:`, response.status, errorText.substring(0, 200))
          continue // Tentar próximo modelo
        }

        const data = await response.json()
        const transcribedText = data.text || ''
        
        if (transcribedText) {
          console.log(`✅ [Media Processor] Groq Whisper modelo ${model} transcreveu com sucesso:`, transcribedText.substring(0, 100))
          return transcribedText.trim()
        }
      } catch (error: any) {
        console.error(`❌ [Media Processor] Erro ao chamar Groq Whisper modelo ${model}:`, error.message)
        continue
      }
    }
    
    console.error('❌ [Media Processor] Todos os modelos Groq Whisper falharam na transcrição')
    return null
  } catch (error: any) {
    console.error('❌ [Media Processor] Erro geral ao transcrever áudio com Groq:', error.message)
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
  console.log('🎤 [Media Processor] OPENAI_API_KEY configurada?', !!process.env.OPENAI_API_KEY)
  console.log('🎤 [Media Processor] ==========================================')
  
  // PRIORIDADE 1: Tentar Groq Whisper primeiro (GRATUITO)
  if (process.env.GROQ_API_KEY) {
    console.log('🎤 [Media Processor] Tentando transcrever com Groq Whisper (gratuito)...')
    const resultadoGroq = await transcribeAudioWithGroq(audioBuffer, mimeType)
    if (resultadoGroq) {
      console.log('✅ [Media Processor] Groq Whisper transcreveu áudio com sucesso!')
      return resultadoGroq
    }
    console.log('⚠️ [Media Processor] Groq Whisper falhou, tentando OpenAI Whisper...')
  } else {
    console.log('⚠️ [Media Processor] GROQ_API_KEY não configurada, pulando Groq')
  }
  
  // PRIORIDADE 2: Fallback para OpenAI Whisper (se tiver créditos)
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('🎤 [Media Processor] Transcrevendo áudio com OpenAI Whisper...')
      
      // Criar FormData para enviar arquivo
      const formData = new FormData()
      // Converter Buffer para Uint8Array para compatibilidade com Blob
      const uint8Array = new Uint8Array(audioBuffer)
      const blob = new Blob([uint8Array], { type: mimeType || 'audio/webm' })
      formData.append('file', blob, 'audio.webm')
      formData.append('model', 'whisper-1')
      formData.append('language', 'pt') // Português
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [Media Processor] OpenAI Whisper error:', response.status, errorText.substring(0, 200))
        return null
      }

      const data = await response.json()
      const transcribedText = data.text || ''
      
      if (transcribedText) {
        console.log('✅ [Media Processor] Áudio transcrito com sucesso (OpenAI):', transcribedText.substring(0, 100))
        return transcribedText
      }
      
      return null
    } catch (error: any) {
      console.error('❌ [Media Processor] Erro ao transcrever áudio com OpenAI:', error.message)
      return null
    }
  }
  
  console.error('❌ [Media Processor] Nenhuma IA configurada para transcrever áudio (GEMINI_API_KEY ou OPENAI_API_KEY)')
  return null
}




