/**
 * Webhook para receber mensagens do WhatsApp (whatsapp-web.js)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage } from '@/lib/whatsapp-plen-handler'
import { enviarMensagemWebJS, getClientWebJS } from '@/lib/whatsapp-webjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📨 [WhatsApp Webhook] Mensagem recebida:', JSON.stringify(body).substring(0, 500))

    // whatsapp-web.js envia mensagens neste formato:
    // { key: { remoteJid: "...", ... }, message: { conversation: "...", ... } }
    
    // Verificar se é formato do whatsapp-web.js
    if (body.key && body.message) {
      const message = body
      
      // Extrair texto da mensagem
      const texto = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
      
      if (!texto || texto.trim() === '') {
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem sem texto)' })
      }

      // Processar mensagem com PLEN (async para não bloquear resposta)
      // IMPORTANTE: Aguardar um pouco para garantir que o módulo está carregado
      setTimeout(async () => {
        try {
          console.log('🔄 [WhatsApp Webhook] Iniciando processamento da mensagem...')
          const result = await processWhatsAppMessage(message)
          
          console.log('📥 [WhatsApp Webhook] Resultado do processamento:', {
            hasResult: !!result,
            success: result?.success,
            hasMessage: !!result?.message,
            messagePreview: result?.message?.substring(0, 100),
          })
          
          if (result && result.success && result.message) {
            // Enviar resposta via whatsapp-web.js
            const phoneNumber = message.key.remoteJid?.split('@')[0] || message.key.remoteJid
            console.log('📤 [WhatsApp Webhook] Tentando enviar resposta para:', phoneNumber)
            
            // Verificar se cliente está disponível ANTES de tentar enviar
            const clientCheck = getClientWebJS()
            console.log('🔍 [WhatsApp Webhook] Verificação do cliente:', {
              hasClient: !!clientCheck,
              hasSendMessage: clientCheck ? typeof clientCheck.sendMessage === 'function' : false,
            })
            
            // Aguardar um pouco para garantir que o módulo está carregado
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const sent = await enviarMensagemWebJS(phoneNumber, result.message)
            
            if (sent) {
              console.log('✅ [WhatsApp Webhook] Resposta enviada com sucesso para:', phoneNumber)
            } else {
              console.error('❌ [WhatsApp Webhook] FALHOU ao enviar resposta para:', phoneNumber)
              console.error('❌ [WhatsApp Webhook] Verifique se o cliente WhatsApp está conectado')
              console.error('❌ [WhatsApp Webhook] Pode ser necessário reconectar o WhatsApp')
              
              // Tentar novamente após um segundo (pode ser problema de timing)
              await new Promise(resolve => setTimeout(resolve, 1000))
              console.log('🔄 [WhatsApp Webhook] Tentando enviar novamente...')
              const retrySent = await enviarMensagemWebJS(phoneNumber, result.message)
              if (retrySent) {
                console.log('✅ [WhatsApp Webhook] Resposta enviada na segunda tentativa!')
              }
            }
          } else {
            console.warn('⚠️ [WhatsApp Webhook] Resultado inválido ou sem mensagem:', result)
          }
        } catch (error: any) {
          console.error('❌ [WhatsApp Webhook] Erro ao processar mensagem:', {
            message: error.message,
            stack: error.stack?.substring(0, 300),
          })
        }
      }, 100)

      // Responder imediatamente
      return NextResponse.json({ success: true, message: 'Mensagem processada' })
    }

    // Formato Evolution API (mantido para compatibilidade)
    if (body.event === 'messages.upsert') {
      const message = body.data
      
      if (message.key.fromMe) {
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem enviada)' })
      }

      const hasText = message.message?.conversation || message.message?.extendedTextMessage?.text
      if (!hasText) {
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem sem texto)' })
      }

      processWhatsAppMessage(message)
        .then(async (result) => {
          if (result && result.success && result.message) {
            const phoneNumber = message.key.remoteJid?.split('@')[0] || message.key.remoteJid
            const sent = await enviarMensagemWebJS(phoneNumber, result.message)
            if (sent) {
              console.log('✅ [WhatsApp Webhook] Resposta enviada para:', phoneNumber)
            }
          }
        })
        .catch((error) => {
          console.error('❌ [WhatsApp Webhook] Erro:', error)
        })

      return NextResponse.json({ success: true, message: 'Mensagem processada' })
    }

    return NextResponse.json({ success: true, message: 'Formato não reconhecido' })
  } catch (error: any) {
    console.error('❌ [WhatsApp Webhook] Erro:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// GET para verificação (alguns serviços verificam)
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'WhatsApp Webhook ativo',
    service: 'PLEN Assistant'
  })
}
