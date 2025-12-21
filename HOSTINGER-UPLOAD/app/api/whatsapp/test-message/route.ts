/**
 * API Route para testar se o WhatsApp está realmente funcionando
 * Tenta verificar o estado real do cliente e enviar uma mensagem de teste
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/whatsapp-client-store'
import { enviarMensagemWebJS } from '@/lib/whatsapp-webjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [WhatsApp Test] Testando funcionalidade do cliente...')
    
    const { numero } = await request.json()
    
    if (!numero) {
      return NextResponse.json(
        { success: false, error: 'Número não fornecido' },
        { status: 400 }
      )
    }
    
    const client = getClient()
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Cliente não encontrado',
        diagnostic: {
          clientExists: false,
          clientInfo: null,
        }
      }, { status: 400 })
    }
    
    // Diagnosticar estado do cliente
    const diagnostic: any = {
      clientExists: true,
      hasInfo: !!client.info,
      hasPupPage: !!client.pupPage,
      hasPupBrowser: !!client.pupBrowser,
      isReady: client.info ? true : false,
      phoneNumber: null,
      pushName: null,
    }
    
    if (client.info) {
      const wid = client.info.wid
      if (wid) {
        if (typeof wid === 'string') {
          diagnostic.phoneNumber = wid.split('@')[0]
        } else if (wid.user) {
          diagnostic.phoneNumber = wid.user
        }
      }
      diagnostic.pushName = client.info.pushname
    }
    
    // Verificar eventos registrados
    const events = (client as any)._events || {}
    diagnostic.events = Object.keys(events)
    diagnostic.hasMessageListener = !!(events.message)
    diagnostic.hasMessageCreateListener = !!(events.message_create)
    
    // Tentar verificar se Puppeteer está realmente conectado
    try {
      if (client.pupPage) {
        const pageUrl = await client.pupPage.url().catch(() => null)
        diagnostic.pupPageUrl = pageUrl
        
        // Tentar verificar se WhatsApp Web está carregado
        const whatsappLoaded = await client.pupPage.evaluate(() => {
          const win = window as any
          return typeof window !== 'undefined' && 
                 typeof win.Store !== 'undefined' && 
                 typeof win.Store.Chat !== 'undefined'
        }).catch(() => false)
        
        diagnostic.whatsappWebLoaded = whatsappLoaded
      }
    } catch (e: any) {
      diagnostic.pupPageError = e.message
    }
    
    // Tentar enviar uma mensagem de teste
    console.log('🧪 [WhatsApp Test] Tentando enviar mensagem de teste...')
    const testResult = await enviarMensagemWebJS(numero, '🧪 Mensagem de teste do sistema')
    
    return NextResponse.json({
      success: testResult,
      diagnostic,
      message: testResult 
        ? 'Cliente está funcionando! Mensagem de teste enviada.'
        : 'Cliente pode estar em estado inválido. Verifique diagnostic.',
    })
  } catch (error: any) {
    console.error('❌ [WhatsApp Test] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao testar cliente',
      },
      { status: 500 }
    )
  }
}

