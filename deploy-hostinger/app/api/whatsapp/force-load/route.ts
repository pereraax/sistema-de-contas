/**
 * API Route para FORÇAR WhatsApp Web a carregar completamente
 * Aguarda até que window.Store esteja disponível
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/whatsapp-client-store'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [WhatsApp Force Load] Forçando WhatsApp Web a carregar...')
    
    const client = getClient()
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Cliente não encontrado. Precisa conectar primeiro.',
      }, { status: 400 })
    }
    
    if (!client.info) {
      return NextResponse.json({
        success: false,
        error: 'Cliente não está conectado. Precisa conectar primeiro.',
      }, { status: 400 })
    }
    
    if (!client.pupPage) {
      return NextResponse.json({
        success: false,
        error: 'Cliente não tem pupPage. Pode não estar totalmente inicializado.',
      }, { status: 400 })
    }
    
    // Aguardar WhatsApp Web carregar com múltiplas tentativas
    let whatsappWebReady = false
    let tentativas = 0
    const maxTentativas = 10
    
    console.log('⏳ [WhatsApp Force Load] Aguardando WhatsApp Web carregar...')
    
    while (!whatsappWebReady && tentativas < maxTentativas) {
      tentativas++
      
      try {
        whatsappWebReady = await client.pupPage.evaluate(() => {
          try {
            const win = window as any
            return typeof window !== 'undefined' && 
                   typeof win.Store !== 'undefined' && 
                   typeof win.Store.Chat !== 'undefined' &&
                   typeof win.Store.Msg !== 'undefined' &&
                   typeof win.Store.SendMessage !== 'undefined'
          } catch (e) {
            return false
          }
        }).catch(() => false)
        
        if (whatsappWebReady) {
          console.log(`✅ [WhatsApp Force Load] WhatsApp Web carregado após ${tentativas} tentativa(s)!`)
          break
        }
        
        if (tentativas < maxTentativas) {
          console.log(`⏳ [WhatsApp Force Load] Tentativa ${tentativas}/${maxTentativas}... Aguardando 3 segundos...`)
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      } catch (e: any) {
        console.warn(`⚠️ [WhatsApp Force Load] Erro na tentativa ${tentativas}:`, e.message)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    if (!whatsappWebReady) {
      return NextResponse.json({
        success: false,
        error: `WhatsApp Web não carregou após ${maxTentativas} tentativas. Pode precisar reconectar.`,
        diagnostic: {
          tentativas,
          hasPupPage: !!client.pupPage,
          hasInfo: !!client.info,
        }
      }, { status: 500 })
    }
    
    // Verificar listeners
    const events = (client as any)._events || {}
    const hasMessageListener = !!(events.message || events.message_create)
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp Web carregado com sucesso!',
      diagnostic: {
        whatsappWebLoaded: true,
        tentativas,
        hasMessageListener,
        events: Object.keys(events),
      },
    })
  } catch (error: any) {
    console.error('❌ [WhatsApp Force Load] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao forçar carregamento do WhatsApp Web',
      },
      { status: 500 }
    )
  }
}






