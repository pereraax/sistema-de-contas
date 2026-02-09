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
    // public/build-time.txt é sempre copiado no Docker; cwd=/app no Railway
    const candidates = [
      join(process.cwd(), 'public', 'build-time.txt'),
      '/app/public/build-time.txt',
      process.env.BUILD_TIME_PATH,
      '/app/build-time.txt',
      join(process.cwd(), 'build-time.txt'),
    ].filter(Boolean) as string[]
    for (const buildTimePath of candidates) {
      if (existsSync(buildTimePath)) {
        const buildTime = readFileSync(buildTimePath, 'utf-8').trim()
        return NextResponse.json(
          {
            buildTime,
            source: 'railway',
            hint: 'Compare com a URL direta do Railway. Se forem diferentes, o DNS do domínio não está apontando para o deploy atual.',
          },
          { status: 200, headers }
        )
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json(
    {
      buildTime: 'development',
      source: 'local',
      hint: 'Em produção (Railway) este endpoint mostra a data do build.',
      _debug: process.env.NODE_ENV === 'production' ? { cwd: process.cwd(), BUILD_TIME_PATH: process.env.BUILD_TIME_PATH || '(não definido)' } : undefined,
    },
    { status: 200, headers }
  )
}
