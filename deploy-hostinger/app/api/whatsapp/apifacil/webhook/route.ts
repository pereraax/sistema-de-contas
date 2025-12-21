/**
 * Webhook para receber mensagens do apifacil.dev
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage, registerSentMessage } from '@/lib/whatsapp-plen-handler'
import { sendTextMessage, getApifacilConfig, getMediaUrl } from '@/lib/whatsapp-apifacil'
import { addWebhookLog } from '@/lib/webhook-logs'
import { addSendLog, getSendLogs } from '@/lib/send-logs'
import { detectMedia, downloadMedia, processComprovanteImage, transcribeAudio } from '@/lib/whatsapp-media-processor'

export const dynamic = 'force-dynamic'

/**
 * Verificar se o texto é uma URL de imagem e processar
 */
async function processImageUrlIfPresent(text: string): Promise<string | null> {
  if (!text || typeof text !== 'string') {
    return null
  }
  
  // Verificar se é uma URL de imagem (S3, apifacil.dev, etc)
  const imageUrlPattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?/i
  const urlMatch = text.match(imageUrlPattern)
  
  if (urlMatch) {
    const imageUrl = urlMatch[0]
    console.log('🖼️ [Apifacil Webhook] URL de imagem detectada no texto:', imageUrl.substring(0, 100))
    
    try {
      const mediaBuffer = await downloadMedia(imageUrl)
      
      if (mediaBuffer) {
        console.log('✅ [Apifacil Webhook] Imagem baixada da URL, tamanho:', mediaBuffer.length, 'bytes')
        console.log('🖼️ [Apifacil Webhook] Processando imagem de comprovante...')
        const processedText = await processComprovanteImage(mediaBuffer, '')
        
        if (processedText) {
          console.log('✅ [Apifacil Webhook] Imagem processada com sucesso!')
          console.log('📝 [Apifacil Webhook] Texto extraído:', processedText.substring(0, 200))
          return processedText
        } else {
          console.log('⚠️ [Apifacil Webhook] Imagem processada mas sem resultado')
        }
      } else {
        console.error('❌ [Apifacil Webhook] Falha ao baixar imagem da URL')
      }
    } catch (error: any) {
      console.error('❌ [Apifacil Webhook] Erro ao processar URL de imagem:', error.message)
      console.error('❌ [Apifacil Webhook] Stack:', error.stack?.substring(0, 500))
    }
  }
  
  return null
}

// Cache de mensagens processadas recentemente (evitar loops)
const processedMessages = new Map<string, number>()
const MESSAGE_CACHE_TTL = 60000 // 1 minuto

// Cache de mensagens já enviadas (evitar duplicação)
const sentMessagesCache = new Map<string, number>()
const SENT_MESSAGE_CACHE_TTL = 30000 // 30 segundos

// Limpar cache antigo periodicamente
setInterval(() => {
  const now = Date.now()
  const processedEntries = Array.from(processedMessages.entries())
  for (const [key, timestamp] of processedEntries) {
    if (now - timestamp > MESSAGE_CACHE_TTL) {
      processedMessages.delete(key)
    }
  }
  const sentEntries = Array.from(sentMessagesCache.entries())
  for (const [key, timestamp] of sentEntries) {
    if (now - timestamp > SENT_MESSAGE_CACHE_TTL) {
      sentMessagesCache.delete(key)
    }
  }
}, 30000) // Limpar a cada 30 segundos

export async function POST(request: NextRequest) {
  // CRÍTICO: Sempre retornar status 200 para apifacil.dev não marcar como erro
  const timestamp = new Date().toISOString()
  
  // LOG INICIAL - SEMPRE executa, mesmo se houver erro
  // IMPORTANTE: Este log DEVE aparecer no terminal quando o webhook for chamado
  const logPrefix = `[${new Date().toLocaleTimeString('pt-BR')}]`
  console.log('='.repeat(80))
  console.log(`${logPrefix} 🚀 [Apifacil Webhook] WEBHOOK CHAMADO!`)
  console.log(`${logPrefix} 🚀 [Apifacil Webhook] Timestamp:`, timestamp)
  console.log(`${logPrefix} 🚀 [Apifacil Webhook] Se você vê esta mensagem, o webhook está sendo chamado!`)
  console.log(`${logPrefix} 🚀 [Apifacil Webhook] Method:`, request.method)
  console.log(`${logPrefix} 🚀 [Apifacil Webhook] URL:`, request.url)
  console.log('='.repeat(80))
  
  // Também logar no stderr para garantir que aparece
  console.error(`${logPrefix} 🚀 [Apifacil Webhook] WEBHOOK CHAMADO (stderr)!`, timestamp)
  
  // Logar também no arquivo de log do sistema (se possível)
  process.stdout.write(`\n${logPrefix} 🚀 [Apifacil Webhook] WEBHOOK CHAMADO! ${timestamp}\n`)
  
  // Registrar log IMEDIATAMENTE (antes de qualquer processamento)
  try {
    addWebhookLog({
      timestamp,
      method: 'POST',
      body: { recebido: true, timestamp },
      response: { status: 'processing' },
    })
    console.log('✅ [Apifacil Webhook] Log inicial registrado')
  } catch (logErr: any) {
    console.error('❌ [Apifacil Webhook] Erro ao registrar log inicial:', logErr.message)
  }
  
  // CRÍTICO: Registrar log de envio IMEDIATAMENTE quando webhook é chamado
  // Isso garante que sempre apareça algo nos logs, mesmo antes de processar
  try {
    console.log('📝 [Apifacil Webhook] Tentando registrar log de webhook recebido...')
    addSendLog({
      timestamp,
      phoneNumber: 'webhook-recebido',
      message: 'Webhook chamado - aguardando processamento',
      endpoint: '/api/whatsapp/apifacil/webhook',
      method: 'POST',
      payload: { timestamp, webhookReceived: true },
      status: 200,
      statusText: 'Webhook Recebido',
      success: undefined,
    })
    console.log('✅ [Apifacil Webhook] Log de webhook recebido registrado com sucesso')
    
    // Verificar se foi realmente adicionado
    const logsAfter = getSendLogs()
    console.log('📊 [Apifacil Webhook] Total de logs após adicionar webhook:', logsAfter.length)
    if (logsAfter.length > 0) {
      console.log('📊 [Apifacil Webhook] Último log:', {
        phone: logsAfter[0].phoneNumber,
        message: logsAfter[0].message?.substring(0, 50),
        statusText: logsAfter[0].statusText,
        timestamp: logsAfter[0].timestamp,
      })
    }
  } catch (sendLogErr: any) {
    console.error('❌ [Apifacil Webhook] Erro ao registrar log de webhook:', sendLogErr.message)
    console.error('❌ [Apifacil Webhook] Stack:', sendLogErr.stack?.substring(0, 500))
  }
  
  try {
    // Tentar fazer parse do body de forma segura
    let body: any = {}
    try {
      const rawBody = await request.text()
      if (rawBody) {
        body = JSON.parse(rawBody)
      }
    } catch (parseError: any) {
      console.error('⚠️ [Apifacil Webhook] Erro ao fazer parse do JSON:', parseError.message)
      // Continuar mesmo com erro no parse
    }
    
    // LOG DETALHADO para debug
    console.log('='.repeat(80))
    console.log('📨 [Apifacil Webhook] ==========================================')
    console.log('📨 [Apifacil Webhook] MENSAGEM RECEBIDA!')
    console.log('📨 [Apifacil Webhook] Timestamp:', timestamp)
    console.log('📨 [Apifacil Webhook] Body completo:', JSON.stringify(body, null, 2))
    console.log('📨 [Apifacil Webhook] Chaves do body:', Object.keys(body))
    console.log('📨 [Apifacil Webhook] Tipo do body:', typeof body)
    console.log('📨 [Apifacil Webhook] Body é array?', Array.isArray(body))
    if (body.event) console.log('📨 [Apifacil Webhook] Event:', body.event)
    if (body.tipo) console.log('📨 [Apifacil Webhook] Tipo:', body.tipo)
    if (body.tipo_envio) console.log('📨 [Apifacil Webhook] Tipo Envio:', body.tipo_envio)
    if (body.tipo_mensagem) console.log('📨 [Apifacil Webhook] Tipo Mensagem:', body.tipo_mensagem)
    if (body.mimetype) console.log('📨 [Apifacil Webhook] MimeType:', body.mimetype)
    if (body.url_media) console.log('📨 [Apifacil Webhook] URL Media:', body.url_media)
    if (body.media_url) console.log('📨 [Apifacil Webhook] Media URL:', body.media_url)
    if (body.media_id) console.log('📨 [Apifacil Webhook] Media ID:', body.media_id)
    if (body.id) console.log('📨 [Apifacil Webhook] ID:', body.id)
    if (body.image) console.log('📨 [Apifacil Webhook] Image object:', JSON.stringify(body.image, null, 2))
    if (body.base64) console.log('📨 [Apifacil Webhook] Base64 (primeiros 100 chars):', body.base64?.substring(0, 100))
    if (body.data) console.log('📨 [Apifacil Webhook] Data (primeiros 100 chars):', typeof body.data === 'string' ? body.data.substring(0, 100) : JSON.stringify(body.data).substring(0, 100))
    console.log('📨 [Apifacil Webhook] ==========================================')
    console.log('='.repeat(80))
    
    // Atualizar log com body completo
    try {
      addWebhookLog({
        timestamp,
        method: 'POST',
        body: body,
        response: { status: 'processing', bodyReceived: true, bodyKeys: Object.keys(body) },
      })
      console.log('✅ [Apifacil Webhook] Log atualizado com body completo')
      console.log('✅ [Apifacil Webhook] Chaves do body:', Object.keys(body))
      console.log('✅ [Apifacil Webhook] Body completo (primeiros 500 chars):', JSON.stringify(body).substring(0, 500))
    } catch (logError: any) {
      console.error('❌ [Apifacil Webhook] Erro ao atualizar log:', logError.message)
      console.error('❌ [Apifacil Webhook] Stack:', logError.stack)
    }

    // Formato do apifacil.dev pode variar, vamos suportar múltiplos formatos
    let messageData: any = null
    let phoneNumber: string | null = null
    let text: string = ''

    // Verificar se há mídia (imagem, áudio, documento) ANTES de processar texto
    // Esta verificação é feita uma vez e o resultado é usado em todos os formatos
    let mediaInfo: any = null
    let processedMediaText: string | null = null
    
    // Detectar mídia no body principal (com tratamento de erro para não quebrar o fluxo)
    try {
      console.log('🔍 [Apifacil Webhook] ==========================================')
      console.log('🔍 [Apifacil Webhook] INICIANDO DETECÇÃO DE MÍDIA')
      console.log('🔍 [Apifacil Webhook] Body keys:', Object.keys(body))
      console.log('🔍 [Apifacil Webhook] Tipo mensagem:', body.tipo_mensagem)
      console.log('🔍 [Apifacil Webhook] Type:', body.type)
      console.log('🔍 [Apifacil Webhook] MimeType:', body.mimetype)
      console.log('🔍 [Apifacil Webhook] URL Media:', body.url_media)
      console.log('🔍 [Apifacil Webhook] Media URL:', body.media_url)
      console.log('🔍 [Apifacil Webhook] ==========================================')
      
      mediaInfo = detectMedia(body)
      
      if (mediaInfo) {
        console.log('✅ [Apifacil Webhook] Mídia detectada no body principal!')
      } else {
        console.log('ℹ️ [Apifacil Webhook] Nenhuma mídia no body principal, verificando campos aninhados...')
      }
      
      // Se não encontrou, tentar em campos aninhados
      if (!mediaInfo && body.data) {
        console.log('🔍 [Apifacil Webhook] Verificando body.data...')
        mediaInfo = detectMedia(body.data)
        if (mediaInfo) {
          console.log('✅ [Apifacil Webhook] Mídia detectada em body.data!')
        }
      }
      
      if (!mediaInfo && body.message) {
        console.log('🔍 [Apifacil Webhook] Verificando body.message...')
        mediaInfo = detectMedia(body.message)
        if (mediaInfo) {
          console.log('✅ [Apifacil Webhook] Mídia detectada em body.message!')
        }
      }
      
      if (!mediaInfo) {
        console.log('ℹ️ [Apifacil Webhook] Nenhuma mídia detectada - processando como mensagem de texto normal')
      }
      
      // Processar mídia se encontrada
      if (mediaInfo) {
        console.log('📎 [Apifacil Webhook] ==========================================')
        console.log('📎 [Apifacil Webhook] MÍDIA DETECTADA!')
        console.log('📎 [Apifacil Webhook] Tipo:', mediaInfo.type)
        console.log('📎 [Apifacil Webhook] URL/ID:', mediaInfo.url ? mediaInfo.url.substring(0, 100) : 'N/A')
        console.log('📎 [Apifacil Webhook] MimeType:', mediaInfo.mimetype)
        console.log('📎 [Apifacil Webhook] Caption:', mediaInfo.caption ? mediaInfo.caption.substring(0, 100) : 'N/A')
        console.log('📎 [Apifacil Webhook] ==========================================')
        
        let mediaUrl = mediaInfo.url
        
        // Se a URL parece ser um ID (não começa com http ou data:), tentar obter URL real
        if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('data:')) {
          console.log('🔍 [Apifacil Webhook] URL parece ser um ID, tentando obter URL real...')
          const messageId = body.id || body.message_id || body.messageId || body.id_mensagem
          try {
            const mediaUrlResult = await getMediaUrl(mediaUrl, messageId)
            if (mediaUrlResult.success && mediaUrlResult.url) {
              mediaUrl = mediaUrlResult.url
              console.log('✅ [Apifacil Webhook] URL da mídia obtida:', mediaUrl.substring(0, 100))
            } else {
              console.log('⚠️ [Apifacil Webhook] Não foi possível obter URL da mídia, tentando usar ID como URL')
            }
          } catch (urlError: any) {
            console.error('❌ [Apifacil Webhook] Erro ao obter URL da mídia:', urlError.message)
            // Continuar tentando processar mesmo se falhar ao obter URL
          }
        }
        
        if (mediaUrl) {
          try {
            console.log('⬇️ [Apifacil Webhook] Baixando mídia...')
            const mediaBuffer = await downloadMedia(mediaUrl)
            
            if (mediaBuffer) {
              console.log('✅ [Apifacil Webhook] Mídia baixada com sucesso, tamanho:', mediaBuffer.length, 'bytes')
              
              if (mediaInfo.type === 'image') {
                console.log('🖼️ [Apifacil Webhook] Imagem detectada - será enviada para API PLEN com OpenAI Vision')
                // Converter para base64 para enviar para API PLEN
                const imageBase64 = mediaBuffer.toString('base64')
                // Armazenar base64 para enviar junto com a mensagem
                // Não processar aqui, deixar a API PLEN processar com OpenAI Vision
                processedMediaText = `[IMAGEM_BASE64:${imageBase64}]` // Marcador especial
                console.log('✅ [Apifacil Webhook] Imagem convertida para base64, tamanho:', imageBase64.length, 'caracteres')
              } else if (mediaInfo.type === 'audio') {
                console.log('🎤 [Apifacil Webhook] Transcrevendo áudio...')
                try {
                  const transcribed = await transcribeAudio(mediaBuffer, mediaInfo.mimetype || 'audio/ogg')
                  if (transcribed) {
                    processedMediaText = transcribed // Não adicionar prefixo, deixar o PLEN processar naturalmente
                    console.log('✅ [Apifacil Webhook] ==========================================')
                    console.log('✅ [Apifacil Webhook] ÁUDIO TRANSCRITO COM SUCESSO!')
                    console.log('✅ [Apifacil Webhook] Texto transcrito (primeiros 100 chars):', transcribed.substring(0, 100))
                    console.log('✅ [Apifacil Webhook] ==========================================')
                  } else {
                    console.log('⚠️ [Apifacil Webhook] Falha ao transcrever áudio - usando caption como fallback')
                    // Se não conseguiu transcrever, usar caption se disponível
                    if (mediaInfo.caption) {
                      processedMediaText = mediaInfo.caption
                      console.log('✅ [Apifacil Webhook] Usando caption como texto:', processedMediaText?.substring(0, 100) || '')
                    }
                  }
                } catch (audioError: any) {
                  console.error('❌ [Apifacil Webhook] Erro ao transcrever áudio:', audioError.message)
                  // Se falhar, usar caption como fallback
                  if (mediaInfo.caption) {
                    processedMediaText = mediaInfo.caption
                    console.log('✅ [Apifacil Webhook] Usando caption como fallback:', processedMediaText?.substring(0, 100) || '')
                  }
                }
              } else {
                console.log('⚠️ [Apifacil Webhook] Tipo de mídia não suportado:', mediaInfo.type)
                // Para documentos, usar caption se disponível
                if (mediaInfo.caption) {
                  processedMediaText = mediaInfo.caption
                    console.log('✅ [Apifacil Webhook] Usando caption do documento:', processedMediaText?.substring(0, 100) || '')
                }
              }
            } else {
              console.error('❌ [Apifacil Webhook] Falha ao baixar mídia da URL:', mediaUrl.substring(0, 100))
              // Se falhar ao baixar, usar caption como fallback
              if (mediaInfo.caption) {
                processedMediaText = mediaInfo.caption
                console.log('✅ [Apifacil Webhook] Usando caption como fallback:', processedMediaText?.substring(0, 100) || '')
              }
            }
          } catch (error: any) {
            console.error('❌ [Apifacil Webhook] Erro ao processar mídia:', error.message)
            console.error('❌ [Apifacil Webhook] Stack:', error.stack?.substring(0, 500))
            // Se falhar completamente, usar caption como fallback para não perder a mensagem
            if (mediaInfo.caption) {
              processedMediaText = mediaInfo.caption
              console.log('✅ [Apifacil Webhook] Usando caption como fallback após erro:', processedMediaText?.substring(0, 100) || '')
            }
          }
        } else {
          console.log('⚠️ [Apifacil Webhook] Mídia detectada mas sem URL disponível')
          // Se não tem URL mas tem caption, usar caption
          if (mediaInfo.caption) {
            processedMediaText = mediaInfo.caption
            console.log('✅ [Apifacil Webhook] Usando caption da mídia:', processedMediaText?.substring(0, 100) || '')
          }
        }
      } else {
        console.log('ℹ️ [Apifacil Webhook] Nenhuma mídia detectada no body - processando como mensagem de texto normal')
      }
    } catch (detectError: any) {
      // Se houver erro na detecção, continuar como mensagem de texto normal
      console.error('❌ [Apifacil Webhook] Erro ao detectar mídia (continuando como texto):', detectError.message)
      mediaInfo = null
      processedMediaText = null
    }
    
    // Formato 1: Formato REAL do apifacil.dev (whatsapp_insert)
    // Documentação: https://apifacil.dev/documentacao/whatsapp
    // Formato: { event: "whatsapp_insert", remetente: "5511999999999", mensagem: "texto", ... }
    if (body.event === 'whatsapp_insert' || body.tipo === 'whatsapp_insert') {
      console.log('✅ [Apifacil Webhook] Formato apifacil.dev detectado (whatsapp_insert)')
      console.log('✅ [Apifacil Webhook] Body keys:', Object.keys(body))
      console.log('✅ [Apifacil Webhook] Event:', body.event)
      console.log('✅ [Apifacil Webhook] Tipo:', body.tipo)
      console.log('✅ [Apifacil Webhook] Remetente:', body.remetente)
      console.log('✅ [Apifacil Webhook] Mensagem:', body.mensagem)
      console.log('✅ [Apifacil Webhook] Caption:', body.caption)
      console.log('✅ [Apifacil Webhook] Tipo Envio:', body.tipo_envio)
      console.log('✅ [Apifacil Webhook] Enviado:', body.enviado)
      console.log('✅ [Apifacil Webhook] Origem:', body.origem)
      console.log('✅ [Apifacil Webhook] Destino:', body.destino)
      console.log('✅ [Apifacil Webhook] Tipo Mensagem:', body.tipo_mensagem)
      console.log('✅ [Apifacil Webhook] URL Media:', body.url_media)
      console.log('✅ [Apifacil Webhook] Media URL:', body.media_url)
      console.log('✅ [Apifacil Webhook] Mensagem completa (primeiros 500 chars):', JSON.stringify({
        mensagem: body.mensagem,
        caption: body.caption,
        message: body.message,
        text: body.text,
        tipo_envio: body.tipo_envio,
        tipo_mensagem: body.tipo_mensagem,
        url_media: body.url_media,
        media_url: body.media_url,
        enviado: body.enviado,
        origem: body.origem,
        destino: body.destino,
      }).substring(0, 500))
      
      // CRÍTICO: Se tipo_envio é IMAGEM_RECEBIDA, processar ANTES de verificar se é mensagem enviada
      // IMPORTANTE: Fazer isso ANTES de verificar se é mensagem enviada
      if (body.tipo_envio === 'IMAGEM_RECEBIDA' && body.mensagem && typeof body.mensagem === 'string') {
        console.log('🖼️ [Apifacil Webhook] ==========================================')
        console.log('🖼️ [Apifacil Webhook] IMAGEM RECEBIDA DETECTADA via tipo_envio!')
        console.log('🖼️ [Apifacil Webhook] URL no campo mensagem:', body.mensagem.substring(0, 200))
        console.log('🖼️ [Apifacil Webhook] ==========================================')
        
        try {
          const mediaBuffer = await downloadMedia(body.mensagem)
          if (mediaBuffer) {
            const imageBase64 = mediaBuffer.toString('base64')
            processedMediaText = `[IMAGEM_BASE64:${imageBase64}]`
            console.log('✅ [Apifacil Webhook] Imagem baixada e convertida para base64 via tipo_envio IMAGEM_RECEBIDA!')
          }
        } catch (error: any) {
          console.error('❌ [Apifacil Webhook] Erro ao processar imagem via tipo_envio:', error.message)
        }
      }
      
      // CRÍTICO: Detectar áudio de múltiplas formas ANTES de verificar se é mensagem enviada
      // IMPORTANTE: Fazer isso ANTES de verificar se é mensagem enviada
      const isAudioMessage = 
        body.tipo_envio === 'AUDIO_RECEBIDO' || 
        body.tipo_envio === 'AUDIO' ||
        body.tipo_mensagem === 'audio' ||
        body.tipo_mensagem === 'voice' ||
        body.type === 'audio' ||
        body.mimetype?.startsWith('audio/')
      
      if (isAudioMessage && body.mensagem && typeof body.mensagem === 'string') {
        console.log('🎤 [Apifacil Webhook] ==========================================')
        console.log('🎤 [Apifacil Webhook] ÁUDIO RECEBIDO DETECTADO!')
        console.log('🎤 [Apifacil Webhook] Tipo envio:', body.tipo_envio)
        console.log('🎤 [Apifacil Webhook] Tipo mensagem:', body.tipo_mensagem)
        console.log('🎤 [Apifacil Webhook] Type:', body.type)
        console.log('🎤 [Apifacil Webhook] MimeType:', body.mimetype)
        console.log('🎤 [Apifacil Webhook] URL no campo mensagem:', body.mensagem.substring(0, 200))
        console.log('🎤 [Apifacil Webhook] ==========================================')
        
        try {
          const audioBuffer = await downloadMedia(body.mensagem)
          if (audioBuffer) {
            console.log('✅ [Apifacil Webhook] Áudio baixado com sucesso, tamanho:', audioBuffer.length, 'bytes')
            const transcribed = await transcribeAudio(audioBuffer, body.mimetype || 'audio/ogg')
            if (transcribed) {
              processedMediaText = transcribed
              console.log('✅ [Apifacil Webhook] ==========================================')
              console.log('✅ [Apifacil Webhook] ÁUDIO TRANSCRITO COM SUCESSO!')
              console.log('✅ [Apifacil Webhook] Texto transcrito (primeiros 100 chars):', transcribed.substring(0, 100))
              console.log('✅ [Apifacil Webhook] ==========================================')
            } else {
              console.log('⚠️ [Apifacil Webhook] Falha ao transcrever áudio')
            }
          } else {
            console.error('❌ [Apifacil Webhook] Falha ao baixar áudio')
          }
        } catch (error: any) {
          console.error('❌ [Apifacil Webhook] Erro ao processar áudio:', error.message)
          console.error('❌ [Apifacil Webhook] Stack:', error.stack?.substring(0, 500))
        }
      } else {
        // Log para debug se não detectou como áudio mas pode ser
        if (body.mensagem && typeof body.mensagem === 'string' && (body.mensagem.includes('audio') || body.mensagem.includes('ogg') || body.mensagem.includes('mp3'))) {
          console.log('🔍 [Apifacil Webhook] Mensagem pode ser áudio mas não foi detectado:', {
            tipo_envio: body.tipo_envio,
            tipo_mensagem: body.tipo_mensagem,
            type: body.type,
            mimetype: body.mimetype,
            mensagem: body.mensagem.substring(0, 200)
          })
        }
      }
        
      // CRÍTICO: Ignorar mensagens ENVIADAS por nós (não recebidas)
      // O apifacil.dev envia webhooks tanto para mensagens recebidas quanto enviadas
      // IMPORTANTE: Verificar apenas se tipo_envio === 'MENSAGEM_ENVIADA' (não verificar 'enviado' pois pode ser true para mensagens recebidas também)
      if (body.tipo_envio === 'MENSAGEM_ENVIADA') {
        console.log('⚠️ [Apifacil Webhook] Mensagem ENVIADA por nós detectada, ignorando')
        console.log('⚠️ [Apifacil Webhook] Tipo Envio:', body.tipo_envio)
        console.log('⚠️ [Apifacil Webhook] Origem:', body.origem)
        console.log('⚠️ [Apifacil Webhook] Destino:', body.destino)
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem enviada por nós)' }, { status: 200 })
      }
      
      // Verificar se origem e destino são iguais (mensagem para si mesmo)
      // Mas apenas se tipo_envio não for MENSAGEM_RECEBIDA
      if (body.origem && body.destino && body.origem === body.destino && body.tipo_envio !== 'MENSAGEM_RECEBIDA') {
        console.log('⚠️ [Apifacil Webhook] Mensagem para si mesmo detectada (origem === destino), ignorando')
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem para si mesmo)' }, { status: 200 })
      }
      
      // Se chegou aqui, é uma mensagem RECEBIDA - processar normalmente
      console.log('✅ [Apifacil Webhook] Mensagem RECEBIDA confirmada (não enviada por nós)')
      console.log('✅ [Apifacil Webhook] Tipo Envio:', body.tipo_envio || 'não especificado')
      console.log('✅ [Apifacil Webhook] Origem:', body.origem)
      console.log('✅ [Apifacil Webhook] Destino:', body.destino)
      
      // Extrair número do remetente (formato oficial do apifacil.dev)
      // IMPORTANTE: Para mensagens RECEBIDAS, o remetente é quem enviou para nós
      console.log('🔍 [Apifacil Webhook] Tentando extrair phoneNumber de:', {
        remetente: body.remetente,
        origem: body.origem,
        numero_telefone_origem: body.numero_telefone_origem,
        numero_origem_lid: body.numero_origem_lid,
        jid_contato: body.jid_contato,
        from: body.from,
        destino: body.destino,
        allKeys: Object.keys(body),
      })
      
      phoneNumber = body.remetente || body.origem || body.numero_telefone_origem || body.numero_origem_lid || body.jid_contato || body.from || body.destino
      
      if (phoneNumber) {
        // Remover sufixos do WhatsApp e caracteres não numéricos
        const phoneNumberOriginal = phoneNumber.toString()
        phoneNumber = phoneNumberOriginal
          .replace('@s.whatsapp.net', '')
          .replace('@c.us', '')
          .replace('@g.us', '')
          .replace('@lid', '')
          .replace(/\D/g, '')
        
        console.log('✅ [Apifacil Webhook] PhoneNumber extraído:', {
          original: phoneNumberOriginal,
          limpo: phoneNumber,
        })
      } else {
        console.error('❌ [Apifacil Webhook] PhoneNumber NÃO encontrado no body!')
        console.error('❌ [Apifacil Webhook] Body completo:', JSON.stringify(body, null, 2).substring(0, 1000))
      }
      
      console.log('✅ [Apifacil Webhook] Mensagem RECEBIDA (não enviada por nós)')
      console.log('✅ [Apifacil Webhook] PhoneNumber final:', phoneNumber)

      // CRÍTICO: Se processou mídia, SEMPRE usar o texto processado PRIMEIRO
      // Se não processou mídia ainda, verificar se o texto é uma URL de imagem
      if (!processedMediaText) {
        // Extrair texto dos campos normais
        text = body.mensagem || body.message || body.text || body.body || body.caption || body.legenda || ''
        
        // Garantir que text é string
        if (text && typeof text !== 'string') {
          text = String(text)
        }
        
        // Verificar se o texto é uma URL de imagem
        const allTextFields = [
          body.mensagem,
          body.message,
          body.text,
          body.body,
          body.caption,
          body.legenda,
          body.description,
          body.content,
          body.conteudo,
          body.descricao,
          // Verificar também em campos aninhados
          body.data?.mensagem,
          body.data?.message,
          body.data?.text,
          body.message?.mensagem,
          body.message?.text,
        ].filter(field => field && typeof field === 'string')
        
        console.log('🔍 [Apifacil Webhook] Verificando TODOS os campos para URL de imagem:', {
          totalFields: allTextFields.length,
          sampleFields: allTextFields.slice(0, 3).map(f => f.substring(0, 100)),
        })
        
        // Verificar cada campo para URL de imagem
        for (const textField of allTextFields) {
          if (textField && typeof textField === 'string') {
            // Verificar se contém URL de imagem
            const imageUrlPattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp)(\?[^\s]*)?/i
            if (imageUrlPattern.test(textField)) {
              console.log('✅ [Apifacil Webhook] URL de imagem encontrada em campo de texto!')
              const processedFromUrl = await processImageUrlIfPresent(textField)
              if (processedFromUrl) {
                processedMediaText = processedFromUrl
                console.log('✅ [Apifacil Webhook] URL de imagem processada com sucesso!')
                break
              }
            }
          }
        }
      }
      
      // CRÍTICO: Se processou mídia (imagem ou áudio), SEMPRE usar o texto processado
      if (processedMediaText) {
        text = processedMediaText
        console.log('✅ [Apifacil Webhook] ==========================================')
        console.log('✅ [Apifacil Webhook] USANDO TEXTO PROCESSADO DA MÍDIA')
        console.log('✅ [Apifacil Webhook] Texto (primeiros 200 chars):', text.substring(0, 200))
        console.log('✅ [Apifacil Webhook] ==========================================')
      } else {
        // Se não processou mídia, usar texto normal
        text = body.mensagem || body.message || body.text || body.body || body.caption || body.legenda || ''
        
        // Garantir que text é string
        if (text && typeof text !== 'string') {
          text = String(text)
        }
      }
      
      // Log detalhado do que foi extraído
      console.log('📝 [Apifacil Webhook] Texto extraído:', {
        processedMediaText: processedMediaText ? processedMediaText.substring(0, 100) : null,
        bodyMensagem: body.mensagem ? body.mensagem.substring(0, 100) : null,
        textFinal: text ? text.substring(0, 100) : null,
        hasMediaInfo: !!mediaInfo,
      })
      
      // REMOVIDO: Bloqueio de processamento automático de imagens
      // Agora o Gemini está configurado e deve processar automaticamente
      // Se não processou, continuar normalmente (não pedir descrição manual)
      
      // Ignorar mensagens sem texto
      if (!text || (typeof text === 'string' && text.trim() === '')) {
        if (!mediaInfo) {
          console.log('⚠️ [Apifacil Webhook] Mensagem sem texto e sem mídia, ignorando')
          return NextResponse.json({ success: true, message: 'Ignorado (mensagem sem texto)' }, { status: 200 })
        }
      }

      // CRÍTICO: Verificar se é mensagem própria (enviada por nós)
      // Múltiplas verificações para garantir que não processamos nossas próprias mensagens
      const isOwnMessage = 
        body.enviado_por_mim === true ||
        body.from_me === true ||
        body.fromMe === true ||
        body.is_from_me === true ||
        body.isFromMe === true ||
        body.own === true ||
        body.self === true ||
        body.sent_by_me === true ||
        body.sentByMe === true
      
      if (isOwnMessage) {
        console.log('⚠️ [Apifacil Webhook] Mensagem própria detectada (enviada por nós), ignorando')
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem própria)' }, { status: 200 })
      }
      
      // Verificar se o número do remetente é o mesmo da instância (mensagem para si mesmo)
      const cfg = getApifacilConfig()
      if (cfg && phoneNumber) {
        // Verificar se o número do remetente começa com o mesmo código da instância
        // Se a mensagem está sendo enviada para o próprio número, ignorar
        const remetenteNormalizado = phoneNumber.replace(/\D/g, '')
        
        // Verificar se há algum campo que indique o número de destino
        const destinatario = body.destinatario || body.to || body.para || body.number || body.numero
        if (destinatario) {
          const destinatarioNormalizado = destinatario.toString().replace(/\D/g, '')
          if (remetenteNormalizado === destinatarioNormalizado) {
            console.log('⚠️ [Apifacil Webhook] Mensagem para si mesmo detectada, ignorando')
            return NextResponse.json({ success: true, message: 'Ignorado (mensagem para si mesmo)' }, { status: 200 })
          }
        }
      }
      
      // Verificar se já processamos esta mensagem recentemente (evitar loops)
      const messageId = body.message_id || body.id || body.messageId || `${phoneNumber}-${text?.substring(0, 50)}-${Date.now()}`
      const messageKey = `${phoneNumber}-${messageId}`
      
      if (processedMessages.has(messageKey)) {
        const lastProcessed = processedMessages.get(messageKey)!
        const timeSinceProcessed = Date.now() - lastProcessed
        
        if (timeSinceProcessed < MESSAGE_CACHE_TTL) {
          console.log('⚠️ [Apifacil Webhook] Mensagem já processada recentemente, ignorando (evitar loop)')
          return NextResponse.json({ success: true, message: 'Ignorado (já processada)' }, { status: 200 })
        }
      }
      
      // Marcar mensagem como processada
      processedMessages.set(messageKey, Date.now())
      
      // Log para debug: ver se "respondido" está vindo como true
      if (body.respondido === true) {
        console.log('⚠️ [Apifacil Webhook] Campo "respondido" está true, mas processando mesmo assim (pode ser nova mensagem)')
      }

      // CRÍTICO: Se processou mídia, SEMPRE usar o texto processado (mesmo se já tiver texto)
      if (processedMediaText) {
        text = processedMediaText
        console.log('✅ [Apifacil Webhook] Usando texto processado da mídia (formato 1):', text.substring(0, 100))
      }
      
      // Formatar para o handler do PLEN
      messageData = {
        key: {
          remoteJid: body.remote_jid || body.remote_jid_alt || `${phoneNumber}@s.whatsapp.net`,
          id: body.message_id || body.id || Date.now().toString(),
        },
        message: {
          conversation: text,
          extendedTextMessage: {
            text: text,
          },
        },
        messageTimestamp: body.created_at ? new Date(body.created_at).getTime() : Date.now(),
        pushName: body.pushName || body.nome || 'Usuário',
      }
      
      console.log('✅ [Apifacil Webhook] Mensagem formatada:', {
        phoneNumber,
        text: typeof text === 'string' ? text.substring(0, 100) : String(text).substring(0, 100),
        pushName: messageData.pushName,
        hasProcessedMedia: !!processedMediaText,
      })
    }
    // Formato 2: Evento de mensagem recebida (outros formatos)
    else if (body.event === 'MENSAGEM_RECEBIDA' || body.event === 'message' || body.type === 'message' || body.tipo === 'MENSAGEM_RECEBIDA') {
      const message = body.data || body.message || body
      
      // Extrair número
      phoneNumber = message.from || message.fromNumber || message.remoteJid || message.key?.remoteJid || message.numero || message.number
      if (phoneNumber) {
        // Remover sufixos do WhatsApp e caracteres não numéricos
        phoneNumber = phoneNumber.toString().replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@g.us', '').replace(/\D/g, '')
      }

      // CRÍTICO: Se processou mídia, SEMPRE usar o texto processado PRIMEIRO
      if (processedMediaText) {
        text = processedMediaText
        console.log('✅ [Apifacil Webhook] Usando texto processado da mídia (formato 2):', text.substring(0, 200))
      } else {
        // Se não processou mídia, extrair texto normal
        text = message.body || message.text || message.message?.conversation || message.message?.extendedTextMessage?.text || message.mensagem || message.caption || message.legenda || ''
        
        // Garantir que text é string
        if (text && typeof text !== 'string') {
          text = String(text)
        }
        
        // Verificar se o texto é uma URL de imagem
        if (text && typeof text === 'string') {
          const processedFromUrl = await processImageUrlIfPresent(text)
          if (processedFromUrl) {
            processedMediaText = processedFromUrl
            text = processedMediaText
            console.log('✅ [Apifacil Webhook] URL de imagem encontrada e processada (formato 2)!')
          }
        }
      }
      
      // REMOVIDO: Bloqueio de processamento automático de imagens
      // Agora o Gemini está configurado e deve processar automaticamente
      // Se não processou, continuar normalmente (não pedir descrição manual)
      
      // Ignorar mensagens sem texto
      if (!text || (typeof text === 'string' && text.trim() === '')) {
        if (!mediaInfo) {
          console.log('⚠️ [Apifacil Webhook] Mensagem sem texto e sem mídia, ignorando')
          return NextResponse.json({ success: true, message: 'Ignorado (mensagem sem texto)' }, { status: 200 })
        }
      }

      // CRÍTICO: Verificar se é mensagem própria (enviada por nós)
      const isOwnMessage = 
        message.fromMe === true ||
        message.key?.fromMe === true ||
        message.enviado_por_mim === true ||
        message.from_me === true ||
        message.is_from_me === true ||
        message.own === true ||
        message.self === true ||
        message.sent_by_me === true ||
        message.sentByMe === true
      
      if (isOwnMessage) {
        console.log('⚠️ [Apifacil Webhook] Mensagem própria detectada (formato 2), ignorando')
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem própria)' }, { status: 200 })
      }
      
      // Verificar se já processamos esta mensagem recentemente
      const messageId = message.id || message.key?.id || message.messageId || `${phoneNumber}-${text?.substring(0, 50)}-${Date.now()}`
      const messageKey = `${phoneNumber}-${messageId}`
      
      if (processedMessages.has(messageKey)) {
        const lastProcessed = processedMessages.get(messageKey)!
        const timeSinceProcessed = Date.now() - lastProcessed
        
        if (timeSinceProcessed < MESSAGE_CACHE_TTL) {
          console.log('⚠️ [Apifacil Webhook] Mensagem já processada recentemente (formato 2), ignorando')
          return NextResponse.json({ success: true, message: 'Ignorado (já processada)' }, { status: 200 })
        }
      }
      
      // Marcar mensagem como processada
      processedMessages.set(messageKey, Date.now())

      // Formatar para o handler do PLEN
      messageData = {
        key: {
          remoteJid: message.from || message.remoteJid || `${phoneNumber}@s.whatsapp.net`,
          id: message.id || message.key?.id || message.messageId || Date.now().toString(),
        },
        message: {
          conversation: text,
          extendedTextMessage: {
            text: text,
          },
        },
        messageTimestamp: message.timestamp || message.data_envio || Date.now(),
        pushName: message.pushName || message.notifyName || message.name || message.nome,
      }
    }
    // Formato 2: Webhook direto (formato simples)
    else if (body.from || body.number || body.numero || body.phone || body.telefone) {
      phoneNumber = body.from || body.number || body.numero || body.phone || body.telefone
      if (phoneNumber) {
        phoneNumber = phoneNumber.toString().replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@g.us', '').replace(/\D/g, '')
      }
      
      // CRÍTICO: Se processou mídia, SEMPRE usar o texto processado PRIMEIRO
      if (processedMediaText) {
        text = processedMediaText
        console.log('✅ [Apifacil Webhook] Usando texto processado da mídia (formato 3):', text.substring(0, 200))
      } else {
        // Se não processou mídia, extrair texto normal
        text = body.text || body.body || body.message || body.mensagem || body.content || body.conteudo || body.caption || body.legenda || ''
        
        // Garantir que text é string
        if (text && typeof text !== 'string') {
          text = String(text)
        }
        
        // Verificar se o texto é uma URL de imagem
        if (text && typeof text === 'string') {
          const processedFromUrl = await processImageUrlIfPresent(text)
          if (processedFromUrl) {
            processedMediaText = processedFromUrl
            text = processedMediaText
            console.log('✅ [Apifacil Webhook] URL de imagem encontrada e processada (formato 3)!')
          }
        }
      }
      
      if (!text || (typeof text === 'string' && text.trim() === '')) {
        if (!mediaInfo) {
          console.log('⚠️ [Apifacil Webhook] Mensagem sem texto (formato 2), ignorando')
          return NextResponse.json({ success: true, message: 'Ignorado (mensagem sem texto)' }, { status: 200 })
        }
      }

      messageData = {
        key: {
          remoteJid: `${phoneNumber}@s.whatsapp.net`,
          id: body.id || body.messageId || body.message_id || Date.now().toString(),
        },
        message: {
          conversation: text,
          extendedTextMessage: {
            text: text,
          },
        },
        messageTimestamp: body.timestamp || body.timestamp_ms || body.data_envio || Date.now(),
        pushName: body.pushName || body.name || body.nome || body.contactName,
      }
    }
    // Formato 3: Formato aninhado do apifacil.dev
    else if (body.data && (body.data.from || body.data.number || body.data.numero)) {
      const data = body.data
      phoneNumber = data.from || data.number || data.numero || data.phone || data.telefone
      if (phoneNumber) {
        phoneNumber = phoneNumber.toString().replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@g.us', '').replace(/\D/g, '')
      }
      
      // CRÍTICO: Se processou mídia, SEMPRE usar o texto processado PRIMEIRO
      if (processedMediaText) {
        text = processedMediaText
        console.log('✅ [Apifacil Webhook] Usando texto processado da mídia (formato 4):', text.substring(0, 200))
      } else {
        // Se não processou mídia, extrair texto normal
        text = data.text || data.body || data.message || data.mensagem || data.content || data.conteudo || ''
        
        // Garantir que text é string
        if (text && typeof text !== 'string') {
          text = String(text)
        }
        
        // Verificar se o texto é uma URL de imagem
        if (text && typeof text === 'string') {
          const processedFromUrl = await processImageUrlIfPresent(text)
          if (processedFromUrl) {
            processedMediaText = processedFromUrl
            text = processedMediaText
            console.log('✅ [Apifacil Webhook] URL de imagem encontrada e processada (formato 4)!')
          }
        }
      }
      
      // Garantir que text é string
      if (text && typeof text !== 'string') {
        text = String(text)
      }
      
      if (!text || (typeof text === 'string' && text.trim() === '')) {
        console.log('⚠️ [Apifacil Webhook] Mensagem sem texto (formato 3), ignorando')
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem sem texto)' }, { status: 200 })
      }

      messageData = {
        key: {
          remoteJid: `${phoneNumber}@s.whatsapp.net`,
          id: data.id || data.messageId || data.message_id || Date.now().toString(),
        },
        message: {
          conversation: text,
          extendedTextMessage: {
            text: text,
          },
        },
        messageTimestamp: data.timestamp || data.timestamp_ms || data.data_envio || Date.now(),
        pushName: data.pushName || data.name || data.nome || data.contactName,
      }
    }

    // Formato 4: Tentar extrair de QUALQUER formato (última tentativa)
    if (!messageData || !phoneNumber) {
      console.log('='.repeat(80))
      console.log('⚠️ [Apifacil Webhook] ==========================================')
      console.log('⚠️ [Apifacil Webhook] FORMATO NÃO RECONHECIDO - Tentando extrair de qualquer forma!')
      console.log('⚠️ [Apifacil Webhook] Body completo recebido:')
      console.log(JSON.stringify(body, null, 2))
      console.log('⚠️ [Apifacil Webhook] Chaves do body:', Object.keys(body))
      
      // Tentar extrair número de qualquer lugar
      const bodyString = JSON.stringify(body)
      const phoneMatches = bodyString.match(/(?:55)?(\d{10,11})/g)
      if (phoneMatches && phoneMatches.length > 0) {
        phoneNumber = phoneMatches[0].replace(/\D/g, '')
        console.log('📞 [Apifacil Webhook] Número extraído:', phoneNumber)
      }
      
      // Tentar extrair texto de qualquer lugar
      const textFields = ['text', 'body', 'message', 'mensagem', 'content', 'conteudo', 'texto', 'msg']
      for (const field of textFields) {
        if (body[field] && typeof body[field] === 'string' && body[field].trim()) {
          text = body[field]
          console.log('📝 [Apifacil Webhook] Texto extraído do campo:', field, '=', text.substring(0, 100))
          
          // CRÍTICO: Verificar se o texto é uma URL de imagem
          if (!processedMediaText) {
            const processedFromUrl = await processImageUrlIfPresent(text)
            if (processedFromUrl) {
              processedMediaText = processedFromUrl
              text = processedFromUrl
            }
          }
          
          break
        }
        // Tentar em objetos aninhados
        if (body.data && body.data[field]) {
          text = body.data[field]
          console.log('📝 [Apifacil Webhook] Texto extraído de data.', field, '=', text.substring(0, 100))
          
          // CRÍTICO: Verificar se o texto é uma URL de imagem
          if (!processedMediaText) {
            const processedFromUrl = await processImageUrlIfPresent(text)
            if (processedFromUrl) {
              processedMediaText = processedFromUrl
              text = processedFromUrl
            }
          }
          
          break
        }
      }
      
      // CRÍTICO: Se processou mídia, SEMPRE usar o texto processado (mesmo se já tiver texto)
      if (processedMediaText) {
        text = processedMediaText
        console.log('✅ [Apifacil Webhook] Usando texto processado da mídia (formato 3):', text.substring(0, 100))
      }
      
      if (phoneNumber && text && (typeof text === 'string' ? text.trim() : String(text).trim())) {
        console.log('✅ [Apifacil Webhook] Conseguiu extrair número e texto! Processando...')
        console.log('📝 [Apifacil Webhook] Texto que será processado:', text.substring(0, 200))
        messageData = {
          key: {
            remoteJid: `${phoneNumber}@s.whatsapp.net`,
            id: body.id || body.messageId || body.message_id || Date.now().toString(),
          },
          message: {
            conversation: text,
            extendedTextMessage: {
              text: text,
            },
          },
          messageTimestamp: body.timestamp || body.timestamp_ms || body.data_envio || Date.now(),
          pushName: body.pushName || body.name || body.nome || body.contactName,
        }
      } else {
        console.log('❌ [Apifacil Webhook] Não conseguiu extrair número ou texto')
        console.log('❌ [Apifacil Webhook] PhoneNumber:', phoneNumber)
        console.log('❌ [Apifacil Webhook] Text:', text)
        console.log('❌ [Apifacil Webhook] ProcessedMediaText:', processedMediaText)
        console.log('❌ [Apifacil Webhook] MediaInfo:', mediaInfo)
        console.log('⚠️ [Apifacil Webhook] ==========================================')
        console.log('='.repeat(80))
        
        // Salvar em arquivo para análise
        try {
          const fs = await import('fs/promises')
          const path = await import('path')
          const debugFile = path.join(process.cwd(), 'webhook-debug.json')
          await fs.writeFile(debugFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            body: body,
          }, null, 2))
          console.log('💾 [Apifacil Webhook] Body salvo em: webhook-debug.json')
        } catch (e) {
          // Ignorar erro ao salvar
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Formato não reconhecido - verifique webhook-debug.json',
          receivedKeys: Object.keys(body),
          bodyPreview: JSON.stringify(body).substring(0, 500),
        }, { status: 200 })
      }
    }

    console.log('🔄 [Apifacil Webhook] Processando mensagem:', {
      from: phoneNumber,
      textPreview: typeof text === 'string' ? text.substring(0, 50) : String(text).substring(0, 50),
    })

    // CRÍTICO: Registrar log IMEDIATAMENTE quando recebe mensagem (antes de processar)
    // Isso garante que sempre apareça nos logs, mesmo se o processamento falhar
    // Registrar SEMPRE que tiver phoneNumber, mesmo sem messageData completo
    if (phoneNumber) {
      const initialLogTimestamp = new Date().toISOString()
      console.log('📝 [Apifacil Webhook] Tentando registrar log inicial...', {
        phoneNumber,
        hasMessageData: !!messageData,
        hasText: !!text,
        textPreview: text?.substring(0, 50),
      })
      
      try {
        addSendLog({
          timestamp: initialLogTimestamp,
          phoneNumber: phoneNumber,
          message: `Mensagem recebida: ${text ? text.substring(0, 100) : 'sem texto'}`,
          endpoint: '/api/whatsapp/apifacil/webhook',
          method: 'POST',
          payload: { phoneNumber, text: text?.substring(0, 100), hasMessageData: !!messageData },
          status: 200,
          statusText: 'Recebida - Aguardando processamento',
          success: undefined,
        })
        console.log('✅ [Apifacil Webhook] Log inicial registrado com sucesso:', initialLogTimestamp, 'Phone:', phoneNumber)
        
        // Verificar se foi realmente adicionado
        const logsAfter = getSendLogs()
        console.log('📊 [Apifacil Webhook] Total de logs após adicionar:', logsAfter.length)
        if (logsAfter.length > 0) {
          console.log('📊 [Apifacil Webhook] Último log:', {
            phone: logsAfter[0].phoneNumber,
            message: logsAfter[0].message?.substring(0, 50),
            statusText: logsAfter[0].statusText,
          })
        }
      } catch (logError: any) {
        console.error('❌ [Apifacil Webhook] Erro ao registrar log inicial:', logError.message)
        console.error('❌ [Apifacil Webhook] Stack:', logError.stack?.substring(0, 500))
      }
    } else {
      console.error('⚠️ [Apifacil Webhook] Não foi possível registrar log inicial - phoneNumber está vazio')
      console.error('⚠️ [Apifacil Webhook] Debug info:', {
        hasMessageData: !!messageData,
        phoneNumberValue: phoneNumber,
        textValue: text?.substring(0, 50),
        bodyKeys: Object.keys(body || {}),
      })
      
      // Registrar log mesmo sem phoneNumber para debug
      try {
        addSendLog({
          timestamp: new Date().toISOString(),
          phoneNumber: 'desconhecido',
          message: `Webhook recebido mas phoneNumber vazio. Text: ${text?.substring(0, 50) || 'sem texto'}`,
          endpoint: '/api/whatsapp/apifacil/webhook',
          method: 'POST',
          payload: { body: JSON.stringify(body || {}).substring(0, 200) },
          status: 200,
          statusText: 'Erro: phoneNumber vazio',
          success: false,
          error: 'phoneNumber não foi extraído do webhook',
        })
        console.log('📝 [Apifacil Webhook] Log de erro registrado (phoneNumber vazio)')
      } catch (logError: any) {
        console.error('❌ [Apifacil Webhook] Erro ao registrar log de erro:', logError.message)
      }
    }

    // CRÍTICO: Sempre retornar resposta imediata (status 200) para não ficar pendente
    // Processar mensagem em background DEPOIS
    
    // Log detalhado do que temos
    console.log('🔍 [Apifacil Webhook] Verificando dados antes de processar:', {
      hasMessageData: !!messageData,
      phoneNumber: phoneNumber || 'vazio',
      hasText: !!text,
      textPreview: text ? text.substring(0, 50) : 'vazio',
      messageDataKeys: messageData ? Object.keys(messageData) : [],
    })
    
    // Se não temos dados completos, ainda assim tentar processar o que temos
    // Mas registrar log de erro
    if (!messageData || !phoneNumber || !text) {
      console.log('⚠️ [Apifacil Webhook] Dados incompletos, mas tentando processar mesmo assim')
      
      // Registrar log de erro
      addSendLog({
        timestamp: new Date().toISOString(),
        phoneNumber: phoneNumber || 'desconhecido',
        message: `Erro: Dados incompletos - messageData: ${!!messageData}, phoneNumber: ${!!phoneNumber}, text: ${!!text}`,
        endpoint: '/api/whatsapp/apifacil/webhook',
        method: 'POST',
        payload: { phoneNumber, text: text?.substring(0, 100), hasMessageData: !!messageData },
        status: 500,
        statusText: 'Dados Incompletos',
        success: false,
        error: 'Dados incompletos para processamento',
      })
      
      // Retornar mas continuar tentando processar se tiver pelo menos phoneNumber
      if (!phoneNumber) {
      return NextResponse.json({ 
        success: true, 
          message: 'Webhook recebido (sem phoneNumber)',
        timestamp: new Date().toISOString() 
      }, { status: 200 })
      }
    }

    // CRÍTICO: Atualizar log inicial com phoneNumber real (se foi extraído)
    // Buscar o log mais recente que tem "webhook-recebido" e atualizar com dados reais
    if (phoneNumber && phoneNumber !== 'webhook-recebido') {
      const sendLogs = getSendLogs()
      const webhookLog = sendLogs.find(log => 
        log.phoneNumber === 'webhook-recebido' && 
        log.statusText === 'Webhook Recebido'
      )
      
      if (webhookLog) {
        webhookLog.phoneNumber = phoneNumber
        webhookLog.message = `Mensagem recebida: ${text ? text.substring(0, 100) : 'sem texto'}`
        webhookLog.statusText = 'Recebida - Aguardando processamento'
        webhookLog.payload = { phoneNumber, text: text?.substring(0, 100), hasMessageData: !!messageData }
        console.log('✅ [Apifacil Webhook] Log inicial atualizado com phoneNumber real:', phoneNumber)
      }
    }
    
    // CRÍTICO: Registrar log IMEDIATAMENTE quando recebe mensagem (antes de processar)
    // Isso garante que sempre apareça nos logs, mesmo se o processamento falhar
    const initialLogTimestamp = new Date().toISOString()
    addSendLog({
      timestamp: initialLogTimestamp,
      phoneNumber: phoneNumber || 'desconhecido',
      message: `Mensagem recebida: ${text ? text.substring(0, 100) : 'sem texto'}`,
      endpoint: '/api/whatsapp/apifacil/webhook',
      method: 'POST',
      payload: { phoneNumber, text: text?.substring(0, 100), messageData: !!messageData },
      status: 200,
      statusText: 'Recebida - Aguardando processamento',
      success: undefined,
    })
    console.log('📝 [Apifacil Webhook] Log inicial registrado:', initialLogTimestamp, 'Phone:', phoneNumber)
    
    // CRÍTICO: Garantir que o processamento seja executado
    // Usar setImmediate para garantir execução no próximo tick do event loop
    // Mas não bloquear a resposta
    setImmediate(async () => {
      try {
        // Registrar log de início do processamento
        const processStartTimestamp = new Date().toISOString()
        console.log('🔄 [Apifacil Webhook] ==========================================')
        console.log('🔄 [Apifacil Webhook] INICIANDO PROCESSAMENTO EM BACKGROUND')
        console.log('🔄 [Apifacil Webhook] Timestamp:', processStartTimestamp)
        console.log('🔄 [Apifacil Webhook] PhoneNumber:', phoneNumber)
        console.log('🔄 [Apifacil Webhook] Text:', text?.substring(0, 100))
        console.log('🔄 [Apifacil Webhook] ==========================================')
        
        // CRÍTICO: Se messageData não existe, criar um básico para processar
        if (!messageData) {
          console.warn('⚠️ [Apifacil Webhook] messageData é null, criando messageData básico...')
          
          // Criar messageData básico se não existe
          if (phoneNumber && text) {
            messageData = {
              key: {
                remoteJid: `${phoneNumber}@s.whatsapp.net`,
                id: Date.now().toString(),
              },
              message: {
                conversation: text,
                extendedTextMessage: {
                  text: text,
                },
              },
              messageTimestamp: Date.now(),
              pushName: 'Usuário',
            }
            console.log('✅ [Apifacil Webhook] messageData básico criado:', {
              phoneNumber,
              textLength: text.length,
            })
          } else {
            console.error('❌ [Apifacil Webhook] Não é possível criar messageData - faltam phoneNumber ou text')
          console.error('❌ [Apifacil Webhook] PhoneNumber:', phoneNumber)
          console.error('❌ [Apifacil Webhook] Text:', text)
            
            // Registrar log de erro
            addSendLog({
              timestamp: processStartTimestamp,
              phoneNumber: phoneNumber || 'desconhecido',
              message: 'Erro: Não é possível processar - faltam dados essenciais',
              endpoint: '/api/whatsapp/apifacil/webhook',
              method: 'POST',
              payload: { phoneNumber, text: text?.substring(0, 100) },
              status: 500,
              statusText: 'Error',
              success: false,
              error: 'Faltam phoneNumber ou text para processar',
            })
          return
          }
        }
        
        console.log('🔄 [Apifacil Webhook] ==========================================')
        console.log('🔄 [Apifacil Webhook] INICIANDO PROCESSAMENTO')
        console.log('🔄 [Apifacil Webhook] PhoneNumber:', phoneNumber)
        console.log('🔄 [Apifacil Webhook] Texto da mensagem:', messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || 'N/A')
        console.log('🔄 [Apifacil Webhook] MessageData completo:', JSON.stringify(messageData, null, 2).substring(0, 500))
        console.log('🔄 [Apifacil Webhook] ==========================================')
        
        console.log('🔄 [Apifacil Webhook] ==========================================')
        console.log('🔄 [Apifacil Webhook] INICIANDO PROCESSAMENTO')
        console.log('🔄 [Apifacil Webhook] PhoneNumber:', phoneNumber)
        console.log('🔄 [Apifacil Webhook] Text:', text ? text.substring(0, 100) : 'null')
        console.log('🔄 [Apifacil Webhook] MessageData:', JSON.stringify(messageData, null, 2).substring(0, 500))
        console.log('🔄 [Apifacil Webhook] ==========================================')
        
        // Atualizar log inicial com status "Processando"
        // Buscar o log mais recente para este phoneNumber
        const sendLogsBefore = getSendLogs()
        const initialLog = sendLogsBefore.find(log => 
          (log.phoneNumber === phoneNumber || log.phoneNumber === 'webhook-recebido') && 
          (log.statusText === 'Recebida - Aguardando processamento' || 
           log.statusText === 'Processing' ||
           log.statusText === 'Webhook Recebido')
        )
        
        if (initialLog) {
          // Atualizar phoneNumber se ainda estiver como "webhook-recebido"
          if (initialLog.phoneNumber === 'webhook-recebido' && phoneNumber) {
            initialLog.phoneNumber = phoneNumber
          }
          initialLog.statusText = 'Processando mensagem...'
          initialLog.message = `Processando: ${text?.substring(0, 50) || 'sem texto'}...`
          console.log('✅ [Apifacil Webhook] Log inicial atualizado para "Processando"', {
            phoneNumber: initialLog.phoneNumber,
            timestamp: initialLog.timestamp,
          })
        } else {
          console.warn('⚠️ [Apifacil Webhook] Log inicial não encontrado para atualizar', {
            phoneNumber,
            totalLogs: sendLogsBefore.length,
            logsPreview: sendLogsBefore.slice(0, 3).map(l => ({
              phone: l.phoneNumber,
              status: l.statusText,
              timestamp: l.timestamp,
            })),
          })
        }
        
        const result = await processWhatsAppMessage(messageData)
        
        console.log('🔄 [Apifacil Webhook] ==========================================')
        console.log('🔄 [Apifacil Webhook] RESULTADO DO PROCESSAMENTO')
        console.log('🔄 [Apifacil Webhook] Result é null?', result === null)
        console.log('🔄 [Apifacil Webhook] Result tem success?', result?.success)
        console.log('🔄 [Apifacil Webhook] Result tem message?', !!result?.message)
        console.log('🔄 [Apifacil Webhook] Result completo:', result ? JSON.stringify(result, null, 2).substring(0, 1000) : 'null')
        console.log('🔄 [Apifacil Webhook] ==========================================')
        
        // Atualizar log inicial com resultado
        // Buscar novamente o log (pode ter mudado)
        const sendLogsAfter = getSendLogs()
        const logToUpdate = sendLogsAfter.find(log => 
          (log.phoneNumber === phoneNumber || log.phoneNumber === 'webhook-recebido') &&
          log.timestamp === (initialLog?.timestamp || initialLogTimestamp)
        ) || initialLog
        
        if (logToUpdate) {
          // Atualizar phoneNumber se ainda estiver como "webhook-recebido"
          if (logToUpdate.phoneNumber === 'webhook-recebido' && phoneNumber) {
            logToUpdate.phoneNumber = phoneNumber
          }
        
        if (result && result.success && result.message) {
            logToUpdate.statusText = 'Resposta gerada - Aguardando envio'
            logToUpdate.message = `Resposta gerada: ${result.message.substring(0, 100)}`
            console.log('✅ [Apifacil Webhook] Log atualizado: Resposta gerada')
          } else {
            logToUpdate.statusText = 'Processamento concluído - Sem resposta'
            logToUpdate.message = result === null ? 'Resultado null' : (result?.message || 'Sem resposta')
            logToUpdate.error = 'Processamento não gerou resposta válida'
            logToUpdate.success = false
            console.log('⚠️ [Apifacil Webhook] Log atualizado: Sem resposta')
          }
        } else {
          console.warn('⚠️ [Apifacil Webhook] Não foi possível atualizar log com resultado')
        }
        
        if (result && result.success && result.message) {
          console.log('✅ [Apifacil Webhook] Resultado válido - tem sucesso e mensagem!')
          console.log('📤 [Apifacil Webhook] Enviando resposta:', result.message.substring(0, 100))
          
          // CRÍTICO: Verificar se já enviamos esta mensagem recentemente (evitar duplicação)
          const messageKey = `${phoneNumber}-${result.message.substring(0, 50)}`
          const lastSent = sentMessagesCache.get(messageKey)
          const now = Date.now()
          
          if (lastSent && (now - lastSent) < SENT_MESSAGE_CACHE_TTL) {
            console.log('⚠️ [Apifacil Webhook] Mensagem já foi enviada recentemente, ignorando para evitar duplicação')
            console.log('⚠️ [Apifacil Webhook] MessageKey:', messageKey)
            console.log('⚠️ [Apifacil Webhook] Último envio:', new Date(lastSent).toISOString())
            console.log('⚠️ [Apifacil Webhook] Tempo desde último envio:', now - lastSent, 'ms')
            return // Não processar novamente
          }
          
          // Marcar como enviada ANTES de enviar
          sentMessagesCache.set(messageKey, now)
          
          // Limpar cache antigo
          for (const [key, timestamp] of Array.from(sentMessagesCache.entries())) {
            if (now - timestamp > SENT_MESSAGE_CACHE_TTL) {
              sentMessagesCache.delete(key)
            }
          }
          
          try {
            // CRÍTICO: Registrar mensagem enviada ANTES de enviar (para evitar loop)
            registerSentMessage(phoneNumber, result.message)
            
            // Registrar log de envio ANTES de tentar enviar
            const sendTimestamp = new Date().toISOString()
            console.log('📝 [Apifacil Webhook] Criando log de envio...', {
              phoneNumber,
              messageLength: result.message.length,
              timestamp: sendTimestamp,
            })
            
            addSendLog({
              timestamp: sendTimestamp,
              phoneNumber,
              message: result.message,
              endpoint: '/api/whatsapp/apifacil/webhook',
              method: 'POST',
              payload: { phoneNumber, message: result.message },
              status: undefined,
              statusText: 'Enviando...',
              success: undefined,
            })
            
            console.log('✅ [Apifacil Webhook] Log de envio criado:', sendTimestamp)
            
            // Verificar se foi adicionado
            const logsAfterAdd = getSendLogs()
            console.log('📊 [Apifacil Webhook] Total de logs após criar log de envio:', logsAfterAdd.length)
            if (logsAfterAdd.length > 0) {
              const lastLog = logsAfterAdd[0]
              console.log('📊 [Apifacil Webhook] Último log:', {
                phone: lastLog.phoneNumber,
                statusText: lastLog.statusText,
                timestamp: lastLog.timestamp,
              })
            }
            
            console.log('📤 [Apifacil Webhook] ==========================================')
            console.log('📤 [Apifacil Webhook] TENTANDO ENVIAR RESPOSTA')
            console.log('📤 [Apifacil Webhook] PhoneNumber:', phoneNumber)
            console.log('📤 [Apifacil Webhook] Message:', result.message.substring(0, 200))
            console.log('📤 [Apifacil Webhook] ==========================================')
            
            const sendResult = await sendTextMessage(phoneNumber, result.message)
            
            console.log('📤 [Apifacil Webhook] ==========================================')
            console.log('📤 [Apifacil Webhook] RESULTADO DO ENVIO')
            console.log('📤 [Apifacil Webhook] Success:', sendResult?.success)
            console.log('📤 [Apifacil Webhook] Error:', sendResult?.error || 'Nenhum')
            console.log('📤 [Apifacil Webhook] Data:', sendResult ? JSON.stringify(sendResult, null, 2).substring(0, 500) : 'null')
            console.log('📤 [Apifacil Webhook] ==========================================')
            
            // Atualizar log com resultado
            const sendLogs = getSendLogs()
            const lastLog = sendLogs[0]
            if (lastLog && lastLog.timestamp === sendTimestamp) {
              lastLog.status = sendResult?.success ? 200 : 500
              lastLog.statusText = sendResult?.success ? 'OK' : 'Error'
              lastLog.response = sendResult
              lastLog.success = sendResult?.success || false
              if (sendResult?.error) {
                lastLog.error = sendResult.error
              }
            }
            
            if (sendResult && sendResult.success) {
              console.log('✅ [Apifacil Webhook] Resposta enviada com sucesso!')
            } else {
              console.error('❌ [Apifacil Webhook] Erro ao enviar resposta:', sendResult?.error || 'Erro desconhecido')
              console.error('❌ [Apifacil Webhook] SendResult completo:', JSON.stringify(sendResult, null, 2))
            }
          } catch (sendError: any) {
            console.error('❌ [Apifacil Webhook] Erro ao enviar mensagem:', sendError.message)
            console.error('❌ [Apifacil Webhook] Stack:', sendError.stack?.substring(0, 500))
            
            // Atualizar log com erro
            const sendLogs = getSendLogs()
            const lastLog = sendLogs[0]
            if (lastLog) {
              lastLog.status = 500
              lastLog.statusText = 'Error'
              lastLog.error = sendError.message
              lastLog.success = false
            }
          }
        } else {
          console.log('⚠️ [Apifacil Webhook] ==========================================')
          console.log('⚠️ [Apifacil Webhook] RESULTADO INVÁLIDO - NÃO VAI ENVIAR RESPOSTA')
          console.log('⚠️ [Apifacil Webhook] Result é null?', result === null)
          console.log('⚠️ [Apifacil Webhook] Result tem success?', result?.success)
          console.log('⚠️ [Apifacil Webhook] Result tem message?', !!result?.message)
          if (result) {
            console.log('⚠️ [Apifacil Webhook] Result completo:', JSON.stringify(result, null, 2).substring(0, 1000))
          } else {
            console.log('⚠️ [Apifacil Webhook] Result é null - mensagem foi ignorada ou houve erro')
            console.log('⚠️ [Apifacil Webhook] Possíveis causas:')
            console.log('⚠️ [Apifacil Webhook] - Mensagem foi enviada por nós (loop prevention)')
            console.log('⚠️ [Apifacil Webhook] - Usuário não autenticado')
            console.log('⚠️ [Apifacil Webhook] - Erro no processamento PLEN')
            console.log('⚠️ [Apifacil Webhook] - Mensagem sem texto')
          }
          console.log('⚠️ [Apifacil Webhook] ==========================================')
          
          // CRÍTICO: Registrar log mesmo quando não há resposta válida
          // Isso permite ver no log o que aconteceu
          const sendTimestamp = new Date().toISOString()
          let logMessage = 'Nenhuma resposta gerada'
          if (result === null) {
            logMessage = 'Resultado null - mensagem ignorada ou erro no processamento'
          } else if (!result.success) {
            logMessage = `Erro no processamento: ${result.message || 'Erro desconhecido'}`
          } else if (!result.message) {
            logMessage = 'Processamento OK mas sem mensagem de resposta'
          }
          
          addSendLog({
            timestamp: sendTimestamp,
            phoneNumber: phoneNumber || 'desconhecido',
            message: logMessage,
            endpoint: '/api/whatsapp/apifacil/webhook',
            method: 'POST',
            payload: { phoneNumber, text: text?.substring(0, 100) },
            status: 200,
            statusText: 'No Response',
            success: false,
            error: result === null ? 'Resultado null' : (result?.message || 'Sem resposta'),
            response: result,
          })
        }
      } catch (error: any) {
        console.error('❌ [Apifacil Webhook] ==========================================')
        console.error('❌ [Apifacil Webhook] ERRO NO PROCESSAMENTO')
        console.error('❌ [Apifacil Webhook] Error:', error.message)
        console.error('❌ [Apifacil Webhook] Stack:', error.stack?.substring(0, 500))
        console.error('❌ [Apifacil Webhook] ==========================================')
        
        // Registrar log de erro
        const sendTimestamp = new Date().toISOString()
        addSendLog({
          timestamp: sendTimestamp,
          phoneNumber: phoneNumber || 'desconhecido',
          message: `Erro no processamento: ${error.message}`,
          endpoint: '/api/whatsapp/apifacil/webhook',
          method: 'POST',
          payload: { phoneNumber, text: text?.substring(0, 100) },
          status: 500,
          statusText: 'Error',
          success: false,
          error: error.message,
        })
      }
    })

    // CRÍTICO: Tentar enviar resposta diretamente no corpo da resposta do webhook
    // Alguns serviços permitem enviar resposta no próprio webhook
    // Se o apifacil.dev suportar, podemos retornar a resposta aqui
    
    // CRÍTICO: Processar APENAS em background para evitar duplicação
    // Não processar síncrono para evitar que a mensagem seja enviada duas vezes
    // O processamento em background já cuida de tudo
    
    // Se não conseguiu processar síncrono ou não gerou resposta, processar em background
    // Retornar resposta IMEDIATA (não aguardar processamento)
    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem recebida',
      timestamp: new Date().toISOString() 
    }, { status: 200 })
  } catch (error: any) {
    console.error('='.repeat(80))
    console.error('❌ [Apifacil Webhook] ==========================================')
    console.error('❌ [Apifacil Webhook] ERRO NO WEBHOOK!')
    console.error('❌ [Apifacil Webhook] Error:', error.message)
    console.error('❌ [Apifacil Webhook] Stack:', error.stack?.substring(0, 500))
    console.error('❌ [Apifacil Webhook] ==========================================')
    console.error('='.repeat(80))
    
    // Tentar registrar erro no log também
    try {
      addWebhookLog({
        timestamp,
        method: 'POST',
        body: { error: 'Erro no processamento' },
        response: { error: error.message },
        error: error.message,
      })
    } catch (logError) {
      // Ignorar erro ao registrar log de erro
    }
    
    // CRÍTICO: Retornar status 200 mesmo com erro para não ficar pendente
    // O apifacil.dev marca como erro se retornar 500/400, então sempre retornar 200
    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook recebido (erro no processamento)',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // Sempre 200, mesmo com erro
    )
  }
}

// GET para verificação (alguns serviços verificam)
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Apifacil Webhook ativo',
    service: 'PLEN Assistant'
  }, { status: 200 })
}

