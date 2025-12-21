import { NextResponse } from 'next/server'
import { desconectarInstancia } from '@/lib/whatsapp-evolution-admin'

/**
 * POST - Desconectar WhatsApp
 */
export async function POST() {
  try {
    const result = await desconectarInstancia()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao desconectar' },
      { status: 500 }
    )
  }
}










