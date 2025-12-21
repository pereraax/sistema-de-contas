/**
 * API Route para enviar mensagem via WhatsApp
 * Usa whatsapp-web.js (não precisa Docker!)
 */

import { NextRequest, NextResponse } from 'next/server'
import { enviarMensagemWebJS, isConnectedWebJS } from '@/lib/whatsapp-webjs'

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros "to" e "message" são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se está conectado
    if (!isConnectedWebJS()) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp não está conectado. Conecte primeiro.',
        },
        { status: 400 }
      )
    }

    // Enviar mensagem
    const result = await enviarMensagemWebJS(to, message)

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao enviar mensagem',
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [WhatsApp Send] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao enviar mensagem',
      },
      { status: 500 }
    )
  }
}

