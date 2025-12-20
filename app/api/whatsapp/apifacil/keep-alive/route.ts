/**
 * API Route para gerenciar o keep-alive do apifacil.dev
 * Mantém o WhatsApp sempre online mesmo quando o celular está desligado
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  checkInstanceStatus,
  isApifacilConfigured 
} from '@/lib/whatsapp-apifacil'

/**
 * GET - Verificar status do keep-alive
 */
export async function GET() {
  try {
    const configured = isApifacilConfigured()
    
    let currentStatus: { success: boolean; connected?: boolean; error?: string } | null = null
    if (configured) {
      currentStatus = await checkInstanceStatus()
    }

    return NextResponse.json({
      success: true,
      keepAliveActive: false, // TODO: Implementar keep-alive
      configured,
      lastCheck: null,
      currentStatus: currentStatus ? {
        connected: currentStatus.connected,
        configured: currentStatus.success,
      } : null,
      message: 'Keep-alive não está implementado. Configure via variáveis de ambiente.',
    })
  } catch (error: any) {
    console.error('❌ [Apifacil Keep-Alive] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao verificar keep-alive',
      },
      { status: 500 }
    )
  }
}

/**
 * POST - Iniciar ou parar o keep-alive
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { action, intervalMinutes } = body

    if (!isApifacilConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Apifacil não está configurado. Configure APIFACIL_INSTANCE_ID e APIFACIL_TOKEN primeiro.',
        },
        { status: 400 }
      )
    }

    if (action === 'start') {
      // TODO: Implementar keep-alive
      return NextResponse.json({
        success: true,
        message: 'Keep-alive não está implementado. Configure via variáveis de ambiente.',
        intervalMinutes: intervalMinutes || 5,
      })
    } else if (action === 'stop') {
      // TODO: Implementar parada do keep-alive
      return NextResponse.json({
        success: true,
        message: 'Keep-alive não está implementado.',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Ação inválida. Use "start" ou "stop"',
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('❌ [Apifacil Keep-Alive] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao gerenciar keep-alive',
      },
      { status: 500 }
    )
  }
}




