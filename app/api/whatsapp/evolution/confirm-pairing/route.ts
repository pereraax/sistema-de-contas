import { NextRequest, NextResponse } from 'next/server'

/**
 * POST - Confirmar Pairing Code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName, pairingCode } = body

    if (!apiUrl || !apiKey || !instanceName || !pairingCode) {
      return NextResponse.json(
        { error: 'Parâmetros faltando: apiUrl, apiKey, instanceName, pairingCode' },
        { status: 400 }
      )
    }

    // Confirmar pairing code na Evolution API
    const response = await fetch(`${apiUrl}/instance/pairingCode/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: pairingCode,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao confirmar pairing code' }))
      return NextResponse.json(
        { error: error.message || 'Erro ao confirmar pairing code' },
        { status: response.status }
      )
    }

    // Verificar se está conectado
    const statusResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
      },
    })

    const instances = await statusResponse.json()
    const instance = instances?.find((inst: any) => inst.instance.instanceName === instanceName)

    const connected = instance?.instance?.status === 'open'

    return NextResponse.json({
      success: true,
      connected,
      message: connected ? 'WhatsApp conectado com sucesso!' : 'Aguardando conexão...',
    })
  } catch (error: any) {
    console.error('❌ [Evolution API] Erro ao confirmar pairing code:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao confirmar pairing code' },
      { status: 500 }
    )
  }
}












