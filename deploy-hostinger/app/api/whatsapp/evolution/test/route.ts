import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET - Testar conexão com Evolution API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apiUrl = searchParams.get('apiUrl')
    const apiKey = searchParams.get('apiKey')

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Parâmetros faltando: apiUrl e apiKey' },
        { status: 400 }
      )
    }

    // Teste 1: Health check
    console.log('🧪 [Test] Testando health check...')
    try {
      const healthResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      })

      const healthData = await healthResponse.json().catch(() => ({ status: 'unknown' }))
      console.log('✅ [Test] Health check:', healthData)

      if (!healthResponse.ok) {
        return NextResponse.json({
          success: false,
          error: 'API não está respondendo corretamente',
          details: {
            status: healthResponse.status,
            statusText: healthResponse.statusText,
            data: healthData,
          },
        })
      }
    } catch (healthError: any) {
      console.error('❌ [Test] Erro no health check:', healthError)
      return NextResponse.json({
        success: false,
        error: 'Não foi possível conectar à API',
        details: {
          message: healthError.message,
          type: healthError.name,
        },
      }, { status: 500 })
    }

    // Teste 2: Listar instâncias
    console.log('🧪 [Test] Testando listar instâncias...')
    try {
      const instancesResponse = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
        },
        signal: AbortSignal.timeout(10000),
      })

      const instancesData = await instancesResponse.json().catch(() => [])
      console.log('✅ [Test] Instâncias:', instancesData)

      return NextResponse.json({
        success: true,
        message: 'API está funcionando!',
        details: {
          health: 'ok',
          instances: Array.isArray(instancesData) ? instancesData.length : 0,
          url: apiUrl,
        },
      })
    } catch (instancesError: any) {
      console.error('❌ [Test] Erro ao listar instâncias:', instancesError)
      return NextResponse.json({
        success: false,
        error: 'API respondeu mas erro ao listar instâncias',
        details: {
          message: instancesError.message,
          health: 'ok',
        },
      })
    }
  } catch (error: any) {
    console.error('❌ [Test] Erro geral:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro ao testar API',
        details: error 
      },
      { status: 500 }
    )
  }
}







