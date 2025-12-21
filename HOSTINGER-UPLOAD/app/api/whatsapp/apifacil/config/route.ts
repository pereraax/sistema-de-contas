/**
 * API Route para configurar credenciais do apifacil.dev
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { instanceId, token } = await request.json()

    if (!instanceId || !token) {
      return NextResponse.json(
        { success: false, error: 'instanceId e token são obrigatórios' },
        { status: 400 }
      )
    }

    // TODO: Implementar configuração do Apifacil
    // A configuração deve ser feita via variáveis de ambiente (APIFACIL_INSTANCE_ID e APIFACIL_TOKEN)

    return NextResponse.json({
      success: true,
      message: 'Configure APIFACIL_INSTANCE_ID e APIFACIL_TOKEN nas variáveis de ambiente do Vercel',
    })
  } catch (error: any) {
    console.error('❌ [Apifacil Config] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao configurar',
      },
      { status: 500 }
    )
  }
}




