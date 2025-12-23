import { NextRequest, NextResponse } from 'next/server'
import { solicitarPairingCode } from '@/lib/whatsapp-evolution-admin'

/**
 * POST - Solicitar pairing code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Número de telefone é obrigatório' },
        { status: 400 }
      )
    }

    const result = await solicitarPairingCode(phoneNumber)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao solicitar pairing code' },
      { status: 500 }
    )
  }
}













