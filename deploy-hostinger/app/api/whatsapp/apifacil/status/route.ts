/**
 * API Route para verificar status da instância apifacil.dev
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkInstanceStatus, isApifacilConfigured } from '@/lib/whatsapp-apifacil'

export async function GET() {
  try {
    if (!isApifacilConfigured()) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: 'Apifacil não está configurado',
      })
    }

    const status = await checkInstanceStatus()

    return NextResponse.json({
      success: status.success,
      connected: status.connected || false,
      configured: true,
      error: status.error,
    })
  } catch (error: any) {
    console.error('❌ [Apifacil Status] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao verificar status',
      },
      { status: 500 }
    )
  }
}








