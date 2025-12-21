import { NextRequest, NextResponse } from 'next/server'

/**
 * POST - Solicitar Pairing Code (número + SMS)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName, phoneNumber } = body

    if (!apiUrl || !apiKey || !instanceName || !phoneNumber) {
      return NextResponse.json(
        { error: 'Parâmetros faltando: apiUrl, apiKey, instanceName, phoneNumber' },
        { status: 400 }
      )
    }

    // Solicitar pairing code na Evolution API
    const response = await fetch(`${apiUrl}/instance/pairingCode/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phoneNumber.replace(/\D/g, ''), // Apenas números
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText || 'Erro ao solicitar pairing code' }
      }
      
      console.error('❌ [Evolution API] Erro ao solicitar pairing code:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: `${apiUrl}/instance/pairingCode/${instanceName}`,
      })
      
      return NextResponse.json(
        { 
          error: errorData.message || errorData.error || 'Erro ao solicitar pairing code',
          details: errorData 
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      pairingCode: data.pairingCode || data.code,
      message: 'Pairing code solicitado. Verifique seu SMS.',
    })
  } catch (error: any) {
    console.error('❌ [Evolution API] Erro ao solicitar pairing code:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao solicitar pairing code' },
      { status: 500 }
    )
  }
}










