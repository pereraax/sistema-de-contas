import { NextRequest, NextResponse } from 'next/server'
import { connectWhapi, getWhapiStatus } from '@/lib/whatsapp-whapi'

/**
 * Endpoint para conectar WhatsApp via Whapi.Cloud
 * GET: Verificar status
 * POST: Conectar e obter QR Code
 */
export async function GET(request: NextRequest) {
  try {
    const status = await getWhapiStatus()
    
    if (status.error) {
      return NextResponse.json(
        { error: status.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      connected: status.connected,
      status: status.status,
      hasQR: !!status.qr,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { apiKey, instanceId } = body
    
    // Se API Key foi enviada no body, usar temporariamente
    // (em produção, deve estar no .env.local)
    if (apiKey) {
      process.env.WHAPI_API_KEY = apiKey
    }
    if (instanceId) {
      process.env.WHAPI_INSTANCE_ID = instanceId
    }
    
    const result = await connectWhapi()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      qr: result.qr,
      message: result.message,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}










