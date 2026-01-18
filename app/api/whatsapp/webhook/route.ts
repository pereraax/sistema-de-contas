/**
 * Webhook para receber mensagens do WhatsApp (whatsapp-web.js)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processWhatsAppMessage } from '@/lib/whatsapp-plen-handler'
import { enviarMensagemWebJS, getClientWebJS } from '@/lib/whatsapp-webjs'

export async function POST(request: NextRequest) {
  // Logar IMEDIATAMENTE no início - SEMPRE EXECUTA
  const timestamp = new Date().toISOString()
  console.log('='.repeat(80))
  console.log('📨📨📨 [WhatsApp Webhook] WEBHOOK POST CHAMADO! 📨📨📨')
  console.log('📨 [WhatsApp Webhook] Timestamp:', timestamp)
  console.log('='.repeat(80))
  
  try {
    const { addLog } = await import('@/lib/server-logs')
    addLog('info', `📨📨📨 [WhatsApp Webhook] WEBHOOK POST CHAMADO! ${timestamp}`)
    
    const body = await request.json()
    
    console.log('📨 [WhatsApp Webhook] Body recebido:', JSON.stringify(body).substring(0, 500))
    addLog('info', `📨 [WhatsApp Webhook] Body recebido: ${JSON.stringify(body).substring(0, 200)}`)

    // whatsapp-web.js envia mensagens neste formato:
    // { key: { remoteJid: "...", ... }, message: { conversation: "...", ... } }
    
    // Verificar se é formato do whatsapp-web.js
    if (body.key && body.message) {
      const message = body
      
      // Extrair texto da mensagem
      const texto = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
      
      const phoneNumber = message.key.remoteJid || 'N/A'
      const text = message.message?.conversation || message.message?.extendedTextMessage?.text || 'N/A'
      
      // Logar IMEDIATAMENTE no console E no sistema
      console.log('='.repeat(80))
      console.log('🔄🔄🔄 [WhatsApp Webhook] MENSAGEM RECEBIDA! 🔄🔄🔄')
      console.log('🔄 [WhatsApp Webhook] Phone:', phoneNumber)
      console.log('🔄 [WhatsApp Webhook] Text:', text.substring(0, 150))
      console.log('='.repeat(80))
      
      const { addLog: addLog2 } = await import('@/lib/server-logs')
      addLog2('info', `🔄🔄🔄 [WhatsApp Webhook] MENSAGEM RECEBIDA! Phone: ${phoneNumber}, Text: ${text.substring(0, 100)}`)
      
      if (!texto || texto.trim() === '') {
        addLog2('info', '⚠️ [WhatsApp Webhook] Mensagem sem texto - ignorando')
        return NextResponse.json({ success: true, message: 'Ignorado (mensagem sem texto)' })
      }

      // CRÍTICO: Processar mensagem de forma SÍNCRONA para garantir que logs apareçam
      // Logar ANTES de processar
      console.log('='.repeat(80))
      console.log('🔄 [WhatsApp Webhook] INICIANDO PROCESSAMENTO SÍNCRONO')
      console.log('🔄 [WhatsApp Webhook] Phone:', phoneNumber)
      console.log('🔄 [WhatsApp Webhook] Text:', text)
      console.log('='.repeat(80))
      
      // CRÍTICO: Logar no stdout também
      process.stdout.write('\n')
      process.stdout.write('='.repeat(80) + '\n')
      process.stdout.write('[WhatsApp Webhook] INICIANDO PROCESSAMENTO\n')
      process.stdout.write('[WhatsApp Webhook] Phone: ' + phoneNumber + '\n')
      process.stdout.write('[WhatsApp Webhook] Text: ' + text + '\n')
      process.stdout.write('='.repeat(80) + '\n')
      
      try {
        const { addLog: addLog3 } = await import('@/lib/server-logs')
        addLog3('info', `🔄 [WhatsApp Webhook] Processando mensagem: ${text.substring(0, 100)}`)
        
        const result = await processWhatsAppMessage(message)
        
        const resultLogMsg = `📥 [WhatsApp Webhook] Resultado: Success=${result?.success}, HasMessage=${!!result?.message}`
        console.log('📥 [WhatsApp Webhook] Resultado:', {
          hasResult: !!result,
          success: result?.success,
          hasMessage: !!result?.message,
          preview: result?.message?.substring(0, 100),
        })
        addLog('info', resultLogMsg)
        
        // CRÍTICO: Logar no stdout também
        process.stdout.write('\n')
        process.stdout.write('[WhatsApp Webhook] RESULTADO DO PROCESSAMENTO\n')
        process.stdout.write('[WhatsApp Webhook] Success: ' + (result?.success ? 'true' : 'false') + '\n')
        process.stdout.write('[WhatsApp Webhook] HasMessage: ' + (!!result?.message ? 'true' : 'false') + '\n')
        if (result?.message) {
          process.stdout.write('[WhatsApp Webhook] Message: ' + result.message.substring(0, 200) + '\n')
        }
        process.stdout.write('='.repeat(80) + '\n')
        
        if (result && result.success && result.message) {
          // Enviar resposta via whatsapp-web.js
          const phoneNumberToSend = message.key.remoteJid?.split('@')[0] || message.key.remoteJid
          console.log('📤 [WhatsApp Webhook] Tentando enviar resposta para:', phoneNumberToSend)
          
          // Verificar se cliente está disponível ANTES de tentar enviar
          const clientCheck = getClientWebJS()
          console.log('🔍 [WhatsApp Webhook] Verificação do cliente:', {
            hasClient: !!clientCheck,
            hasSendMessage: clientCheck ? typeof clientCheck.sendMessage === 'function' : false,
          })
          
          // Aguardar um pouco para garantir que o módulo está carregado
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const sent = await enviarMensagemWebJS(phoneNumberToSend, result.message)
          
          if (sent) {
            console.log('✅ [WhatsApp Webhook] Resposta enviada com sucesso para:', phoneNumberToSend)
            process.stdout.write('[WhatsApp Webhook] ✅ RESPOSTA ENVIADA!\n')
            const { addLog: addLogSuccess } = await import('@/lib/server-logs')
            addLogSuccess('info', `✅ [WhatsApp Webhook] Resposta enviada para ${phoneNumberToSend}`)
          } else {
            console.error('❌ [WhatsApp Webhook] FALHOU ao enviar resposta para:', phoneNumberToSend)
            console.error('❌ [WhatsApp Webhook] Verifique se o cliente WhatsApp está conectado')
            console.error('❌ [WhatsApp Webhook] Pode ser necessário reconectar o WhatsApp')
            
            // Fazer diagnóstico detalhado
            const { isConnectedWebJS, getClientInfoWebJS } = await import('@/lib/whatsapp-webjs')
            const connected = isConnectedWebJS()
            const clientInfo = getClientInfoWebJS()
            const clientCheck = getClientWebJS()
            
            console.error('🔍 [WhatsApp Webhook] Diagnóstico:', {
              connected,
              hasClient: !!clientCheck,
              hasSendMessage: clientCheck ? typeof clientCheck.sendMessage === 'function' : false,
              hasPupPage: clientCheck ? !!(clientCheck as any).pupPage : false,
              phoneNumber: clientInfo?.wid || null,
            })
            
            const { addLog: addLogError } = await import('@/lib/server-logs')
            addLogError('error', `❌ [WhatsApp Webhook] Falhou ao enviar para ${phoneNumberToSend}. Connected: ${connected}, HasClient: ${!!clientCheck}`)
            
            process.stdout.write('[WhatsApp Webhook] ❌ FALHOU AO ENVIAR RESPOSTA\n')
            
            // Tentar novamente após um segundo (pode ser problema de timing)
            await new Promise(resolve => setTimeout(resolve, 1000))
            console.log('🔄 [WhatsApp Webhook] Tentando enviar novamente...')
            const retrySent = await enviarMensagemWebJS(phoneNumberToSend, result.message)
            if (retrySent) {
              console.log('✅ [WhatsApp Webhook] Resposta enviada na segunda tentativa!')
              process.stdout.write('[WhatsApp Webhook] ✅ RESPOSTA ENVIADA NA SEGUNDA TENTATIVA!\n')
              const { addLog: addLogRetry } = await import('@/lib/server-logs')
              addLogRetry('info', `✅ [WhatsApp Webhook] Resposta enviada na segunda tentativa para ${phoneNumberToSend}`)
            } else {
              const { addLog: addLogRetryFail } = await import('@/lib/server-logs')
              addLogRetryFail('error', `❌ [WhatsApp Webhook] Falhou também na segunda tentativa para ${phoneNumberToSend}`)
            }
          }
        } else {
          console.warn('⚠️ [WhatsApp Webhook] Resultado inválido ou sem mensagem:', result)
          process.stdout.write('[WhatsApp Webhook] ⚠️ RESULTADO INVÁLIDO OU SEM MENSAGEM\n')
        }
      } catch (error: any) {
        console.error('❌ [WhatsApp Webhook] Erro ao processar mensagem:', {
          message: error.message,
          stack: error.stack?.substring(0, 300),
        })
        process.stdout.write('[WhatsApp Webhook] ❌ ERRO: ' + error.message + '\n')
        addLog('error', `❌ [WhatsApp Webhook] Erro: ${error.message}`)
      }

      // Responder após processar
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
