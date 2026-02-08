import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Retorna o horário do último build (gerado no Docker/Railway).
 * Use para verificar se o domínio está servindo o deploy mais recente:
 * - Abra https://plenipay.com/api/build-info
 * - Abra https://SEU-PROJETO.up.railway.app/api/build-info
 * Se as datas forem diferentes, o domínio não está apontando para o Railway atual.
 */
export async function GET() {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  }

  try {
    // No Docker/Railway o arquivo fica na raiz do app (/app/build-time.txt)
    const path = join(process.cwd(), 'build-time.txt')
    if (existsSync(path)) {
      const buildTime = readFileSync(path, 'utf-8').trim()
      return NextResponse.json(
        {
          buildTime,
          source: 'railway',
          hint: 'Compare com a URL direta do Railway. Se forem diferentes, o DNS do domínio não está apontando para o deploy atual.',
        },
        { status: 200, headers }
      )
    }
  } catch {
    // ignore
  }

  return NextResponse.json(
    {
      buildTime: 'development',
      source: 'local',
      hint: 'Em produção (Railway) este endpoint mostra a data do build.',
    },
    { status: 200, headers }
  )
}
