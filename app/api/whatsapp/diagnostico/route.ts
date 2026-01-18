/**
 * Rota de diagnóstico para verificar status do WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClientWebJS, isConnectedWebJS, getQRCodeWebJS, getClientInfoWebJS } from '@/lib/whatsapp-webjs'
import { getClient } from '@/lib/whatsapp-client-store'

export async function GET(request: NextRequest) {
  try {
    const client = getClientWebJS()
    const connected = isConnectedWebJS()
    const qrCode = getQRCodeWebJS()
    const clientInfo = getClientInfoWebJS()
    const clientFromStore = getClient()

    // Verificar se tem listeners de mensagens
    let hasListeners = false
    if (client) {
      const events = (client as any)._events || {}
      hasListeners = !!(events.message || events.message_create || events.message_create.any)
    }

    // Verificar se o cliente tem sendMessage
    const hasSendMessage = client ? typeof client.sendMessage === 'function' : false

    // Verificar se tem pupPage (indica que Puppeteer está rodando)
    const hasPupPage = client ? !!(client as any).pupPage : false
    const hasPupBrowser = client ? !!(client as any).pupBrowser : false

    // Verificar se WhatsApp Web está pronto (se tiver pupPage)
    let whatsappWebReady = false
    if (hasPupPage && client) {
      try {
        whatsappWebReady = await (client as any).pupPage.evaluate(() => {
          return typeof window !== 'undefined' &&
                 typeof (window as any).Store !== 'undefined' &&
                 typeof (window as any).Store?.Chat !== 'undefined'
        }).catch(() => false)
      } catch (e) {
        // Ignorar erro
      }
    }

    const diagnostico = {
      timestamp: new Date().toISOString(),
      cliente: {
        existe: !!client,
        existeNoStore: !!clientFromStore,
        temSendMessage: hasSendMessage,
        temPupPage: hasPupPage,
        temPupBrowser: hasPupBrowser,
        temInfo: !!clientInfo,
        phoneNumber: clientInfo?.wid || null,
      },
      conexao: {
        status: connected ? 'conectado' : (qrCode ? 'conectando' : 'desconectado'),
        conectado: connected,
        temQRCode: !!qrCode,
        whatsappWebPronto: whatsappWebReady,
      },
      listeners: {
        temListeners: hasListeners,
        eventos: client ? Object.keys((client as any)._events || {}) : [],
      },
      problemas: [] as string[],
    }

    // Identificar problemas
    if (!client) {
      diagnostico.problemas.push('❌ Cliente WhatsApp não existe')
    } else {
      if (!hasSendMessage) {
        diagnostico.problemas.push('❌ Cliente não tem método sendMessage')
      }
      if (!hasPupPage && !hasPupBrowser) {
        diagnostico.problemas.push('⚠️ Cliente não tem pupPage/pupBrowser (Puppeteer pode não estar rodando)')
      }
      if (hasPupPage && !whatsappWebReady) {
        diagnostico.problemas.push('⚠️ WhatsApp Web não está pronto (Store não carregado)')
      }
    }

    if (!connected && !qrCode) {
      diagnostico.problemas.push('❌ WhatsApp não está conectado e não há QR code')
    }

    if (!hasListeners) {
      diagnostico.problemas.push('⚠️ Não há listeners de mensagens configurados')
    }

    if (connected && !hasSendMessage) {
      diagnostico.problemas.push('❌ Status indica conectado mas não pode enviar mensagens')
    }

    return NextResponse.json({
      success: true,
      diagnostico,
      recomendacoes: diagnostico.problemas.length > 0 ? [
        '1. Verifique se o WhatsApp está conectado na página de configurações',
        '2. Se não estiver conectado, escaneie o QR code novamente',
        '3. Se o problema persistir, tente reconectar o WhatsApp',
        '4. Verifique os logs do servidor para mais detalhes',
      ] : ['✅ Tudo parece estar funcionando corretamente'],
    })
  } catch (error: any) {
    console.error('❌ [Diagnóstico WhatsApp] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
