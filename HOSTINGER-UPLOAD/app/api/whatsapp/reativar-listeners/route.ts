/**
 * API Route para REATIVAR listeners sem desconectar
 * Útil quando o cliente está conectado mas não está recebendo mensagens
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/whatsapp-client-store'
import { ensureMessageListeners } from '@/lib/whatsapp-webjs'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [WhatsApp Reativar] Reativando listeners sem desconectar...')
    
    const client = getClient()
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'Cliente não encontrado. Precisa conectar primeiro.',
      }, { status: 400 })
    }
    
    // Verificar se está realmente conectado
    if (!client.info) {
      return NextResponse.json({
        success: false,
        error: 'Cliente não está conectado. Precisa conectar primeiro.',
      }, { status: 400 })
    }
    
    // Verificar estado atual dos listeners
    const events = (client as any)._events || {}
    const hasMessageListener = !!(events.message || events.message_create)
    
    console.log('🔍 [WhatsApp Reativar] Estado ANTES:', {
      hasMessageListener,
      events: Object.keys(events),
    })
    
    // CRÍTICO: Verificar se WhatsApp Web está realmente carregado ANTES de reconfigurar listeners
    let whatsappWebReady = false
    if (client.pupPage) {
      try {
        whatsappWebReady = await client.pupPage.evaluate(() => {
          try {
            const win = window as any
            return typeof window !== 'undefined' && 
                   typeof win.Store !== 'undefined' && 
                   typeof win.Store.Chat !== 'undefined' &&
                   typeof win.Store.Msg !== 'undefined'
          } catch (e) {
            return false
          }
        }).catch(() => false)
        
        console.log('🔍 [WhatsApp Reativar] WhatsApp Web está pronto?', whatsappWebReady)
        
        if (!whatsappWebReady) {
          console.warn('⚠️ [WhatsApp Reativar] WhatsApp Web NÃO está pronto! Aguardando 5 segundos...')
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          // Verificar novamente
          whatsappWebReady = await client.pupPage.evaluate(() => {
            try {
              const win = window as any
              return typeof window !== 'undefined' && 
                     typeof win.Store !== 'undefined' && 
                     typeof win.Store.Chat !== 'undefined'
            } catch (e) {
              return false
            }
          }).catch(() => false)
          
          if (!whatsappWebReady) {
            console.error('❌ [WhatsApp Reativar] WhatsApp Web AINDA não está pronto após espera!')
            return NextResponse.json({
              success: false,
              error: 'WhatsApp Web não está totalmente carregado. Tente reconectar completamente.',
              diagnostic: {
                whatsappWebLoaded: false,
                hasPupPage: !!client.pupPage,
                hasInfo: !!client.info,
              }
            }, { status: 500 })
          }
        }
      } catch (e: any) {
        console.warn('⚠️ [WhatsApp Reativar] Erro ao verificar WhatsApp Web:', e.message)
      }
    } else {
      console.warn('⚠️ [WhatsApp Reativar] Cliente não tem pupPage. Pode não estar totalmente inicializado.')
    }
    
    // Forçar reconfiguração dos listeners
    const result = await ensureMessageListeners()
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Não foi possível reconfigurar listeners.',
      }, { status: 500 })
    }
    
    // Verificar estado DEPOIS
    const eventsAfter = (client as any)._events || {}
    const hasMessageListenerAfter = !!(eventsAfter.message || eventsAfter.message_create)
    
    console.log('🔍 [WhatsApp Reativar] Estado DEPOIS:', {
      hasMessageListenerAfter,
      events: Object.keys(eventsAfter),
    })
    
    // Verificar se WhatsApp Web está carregado
    let whatsappWebLoaded = false
    try {
      if (client.pupPage) {
        whatsappWebLoaded = await client.pupPage.evaluate(() => {
          try {
            const win = window as any
            return typeof window !== 'undefined' && 
                   typeof win.Store !== 'undefined' && 
                   typeof win.Store.Chat !== 'undefined'
          } catch (e) {
            return false
          }
        }).catch(() => false)
      }
    } catch (e: any) {
      console.warn('⚠️ [WhatsApp Reativar] Erro ao verificar WhatsApp Web:', e.message)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Listeners reativados com sucesso!',
      diagnostic: {
        hadListenersBefore: hasMessageListener,
        hasListenersAfter: hasMessageListenerAfter,
        whatsappWebLoaded,
        events: Object.keys(eventsAfter),
      },
    })
  } catch (error: any) {
    console.error('❌ [WhatsApp Reativar] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao reativar listeners',
      },
      { status: 500 }
    )
  }
}

