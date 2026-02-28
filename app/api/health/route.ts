import { NextResponse } from 'next/server'

/**
 * Health check endpoint para manter a aplicação acordada no Render
 * Este endpoint é chamado periodicamente pelo Render para evitar que a aplicação entre em sleep mode
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  // Resposta rápida e simples para health check (e para a extensão testar conexão)
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'plenipay',
    },
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  )
}


