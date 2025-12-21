import { NextResponse } from 'next/server'
import { criarInstancia } from '@/lib/whatsapp-evolution-admin'

/**
 * POST - Criar instância WhatsApp
 */
export async function POST() {
  try {
    const result = await criarInstancia()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar instância' },
      { status: 500 }
    )
  }
}












