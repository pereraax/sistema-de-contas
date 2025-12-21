import { NextResponse } from 'next/server'
import { verificarStatusInstancia } from '@/lib/whatsapp-evolution-admin'

/**
 * GET - Verificar status da conexão WhatsApp
 */
export async function GET() {
  try {
    const status = await verificarStatusInstancia()
    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}










