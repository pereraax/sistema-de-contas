import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Ler arquivo .env.local diretamente
    const envPath = path.join(process.cwd(), '.env.local')
    let envFileContent = ''
    let envFileExists = false
    
    try {
      envFileContent = fs.readFileSync(envPath, 'utf8')
      envFileExists = true
    } catch (error: any) {
      envFileExists = false
    }
    
    // Extrair ASAAS_API_KEY do arquivo
    let apiKeyFromFile = ''
    if (envFileContent) {
      const match = envFileContent.match(/^ASAAS_API_KEY=(.+)$/m)
      if (match) {
        apiKeyFromFile = match[1].trim()
      }
    }
    
    // Verificar variável de ambiente do processo
    const apiKeyFromEnv = process.env.ASAAS_API_KEY || ''
    
    return NextResponse.json({
      debug: {
        envFileExists,
        envFileLocation: envPath,
        apiKeyFromFile: {
          found: !!apiKeyFromFile,
          length: apiKeyFromFile.length,
          firstChars: apiKeyFromFile.substring(0, 30) + '...',
          hasDollar: apiKeyFromFile.startsWith('$'),
        },
        apiKeyFromEnv: {
          found: !!apiKeyFromEnv,
          length: apiKeyFromEnv.length,
          firstChars: apiKeyFromEnv.substring(0, 30) + '...',
          hasDollar: apiKeyFromEnv.startsWith('$'),
        },
        match: apiKeyFromFile === apiKeyFromEnv,
        allEnvVars: {
          ASAAS_API_KEY: process.env.ASAAS_API_KEY ? 'EXISTS' : 'MISSING',
          ASAAS_API_URL: process.env.ASAAS_API_URL || 'NOT SET',
          NODE_ENV: process.env.NODE_ENV || 'NOT SET',
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}















