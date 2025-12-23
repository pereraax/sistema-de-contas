import { NextRequest, NextResponse } from 'next/server'

/**
 * POST - Criar Instância na Evolution API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = body

    if (!apiUrl || !apiKey || !instanceName) {
      return NextResponse.json(
        { error: 'Parâmetros faltando: apiUrl, apiKey, instanceName' },
        { status: 400 }
      )
    }

    // Verificar se instância já existe
    const checkResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
      },
    })

    if (checkResponse.ok) {
      const instances = await checkResponse.json()
      const exists = instances?.some((inst: any) => inst.instance.instanceName === instanceName)
      
      if (exists) {
        return NextResponse.json({
          success: true,
          message: 'Instância já existe',
        })
      }
    }

    // Criar nova instância
    const response = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName: instanceName,
        token: apiKey,
        qrcode: false, // Não precisamos de QR Code!
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText || 'Erro ao criar instância' }
      }
      
      console.error('❌ [Evolution API] Erro ao criar instância:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      
      return NextResponse.json(
        { 
          error: errorData.message || errorData.error || 'Erro ao criar instância',
          details: errorData 
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Instância criada com sucesso!',
      data,
    })
  } catch (error: any) {
    console.error('❌ [Evolution API] Erro ao criar instância:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar instância' },
      { status: 500 }
    )
  }
}













