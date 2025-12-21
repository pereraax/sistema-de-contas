import { NextRequest, NextResponse } from 'next/server'
import { confirmarPairingCode } from '@/lib/whatsapp-evolution-admin'

/**
 * POST - Confirmar pairing code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pairingCode } = body

    if (!pairingCode) {
      return NextResponse.json(
        { error: 'Código de pairing é obrigatório' },
        { status: 400 }
      )
    }

    const result = await confirmarPairingCode(pairingCode)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao confirmar pairing' },
      { status: 500 }
    )
  }
}










