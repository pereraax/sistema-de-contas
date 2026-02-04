import { NextResponse } from 'next/server'

/**
 * Health check endpoint para manter a aplicação acordada no Render
 * Este endpoint é chamado periodicamente pelo Render para evitar que a aplicação entre em sleep mode
 */
export async function GET() {
  // Resposta rápida e simples para health check
  // Não fazer nenhuma operação pesada aqui
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'plenipay',
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  )
}


