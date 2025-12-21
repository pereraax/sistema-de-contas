/**
 * API Route para verificar status da conexão WhatsApp
 * Usa whatsapp-web.js (não precisa Docker!)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isConnectedWebJS, getQRCodeWebJS, getClientInfoWebJS } from '@/lib/whatsapp-webjs'

// Cache para evitar múltiplas verificações pesadas simultâneas
let lastListenerCheck = 0
const LISTENER_CHECK_INTERVAL = 10000 // Verificar listeners apenas a cada 10 segundos

export async function GET(request: NextRequest) {
  try {
    const connected = isConnectedWebJS()
    const qrCode = getQRCodeWebJS()
    const clientInfo = getClientInfoWebJS()

    // CRÍTICO: Se tem QR code, não está realmente conectado
    // O status pode estar errado devido à verificação periódica
    // Se está conectado mas ainda tem QR code, limpar o QR code
    let realmenteConectado = connected && !qrCode && clientInfo?.wid
    
    // Se está conectado mas ainda tem QR code, limpar o QR code
    if (connected && clientInfo?.wid && qrCode) {
      console.log('🧹 [WhatsApp Status] Limpando QR code obsoleto (está conectado mas ainda tem QR)')
      const { setQRCode } = await import('@/lib/whatsapp-client-store')
      setQRCode(null)
      realmenteConectado = true
    }
    
    // Verificar listeners apenas ocasionalmente (não a cada requisição)
    const { getClient } = await import('@/lib/whatsapp-client-store')
    const client = getClient()
    let temListeners = false
    
    const now = Date.now()
    const shouldCheckListeners = (now - lastListenerCheck) > LISTENER_CHECK_INTERVAL
    
    if (client && shouldCheckListeners) {
      const events = (client as any)._events || {}
      temListeners = !!(events.message || events.message_create)
      lastListenerCheck = now
      
      // DESABILITADO - estava causando abertura de Chromium
      // Verificar e garantir listeners apenas ocasionalmente (não bloqueante)
      // if (realmenteConectado && !temListeners) {
      //   // Fazer em background sem bloquear a resposta
      //   setImmediate(async () => {
      //     try {
      //       const { ensureMessageListeners } = await import('@/lib/whatsapp-webjs')
      //       await ensureMessageListeners()
      //     } catch (err: any) {
      //       // Ignorar erros silenciosamente
      //     }
      //   })
      // }
      
      // Log apenas ocasionalmente para não poluir
      if (now % 30000 < 5000) { // Log a cada ~30 segundos
        console.log('📊 [WhatsApp Status] Verificando status:', {
          connected,
          temQR: !!qrCode,
          temPhone: !!clientInfo?.wid,
          realmenteConectado,
          temListeners,
        })
      }
    } else if (client && !shouldCheckListeners) {
      // Usar valor cached
      const events = (client as any)._events || {}
      temListeners = !!(events.message || events.message_create)
    }
    
    // Retornar resposta IMEDIATAMENTE (sem bloqueios)
    return NextResponse.json({
      success: true,
      connected: realmenteConectado,
      status: realmenteConectado ? 'connected' : (qrCode ? 'connecting' : 'disconnected'),
      phoneNumber: clientInfo?.wid || null,
      qrCode,
      hasListeners: temListeners,
    })
  } catch (error: any) {
    console.error('❌ [WhatsApp Status] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        connected: false,
        status: 'error',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
