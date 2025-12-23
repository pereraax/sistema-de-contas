/**
 * API Route para enviar mensagem via apifacil.dev
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTextMessage, isApifacilConfigured } from '@/lib/whatsapp-apifacil'

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros "to" e "message" são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se está configurado
    if (!isApifacilConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Apifacil não está configurado. Configure as credenciais primeiro.',
        },
        { status: 400 }
      )
    }

    // Enviar mensagem
    const result = await sendTextMessage(to, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        messageId: result.messageId,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Erro ao enviar mensagem',
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ [Apifacil Send] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao enviar mensagem',
      },
      { status: 500 }
    )
  }
}











