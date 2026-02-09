import { NextResponse } from 'next/server'

/**
 * Em produção (NODE_ENV=production) sempre retorna source: "railway".
 * Não depende de nenhuma variável de ambiente.
 */
export async function GET() {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  }

  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    return NextResponse.json(
      {
        source: 'railway',
        ok: true,
        hint: 'Deploy ativo. Se plenipay.com mostrar o mesmo, o domínio está certo.',
      },
      { status: 200, headers }
    )
  }

  return NextResponse.json(
    {
      source: 'local',
      hint: 'Em produção este endpoint mostra source: "railway".',
    },
    { status: 200, headers }
  )
}
