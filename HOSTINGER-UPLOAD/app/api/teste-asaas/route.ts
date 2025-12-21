import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // IMPORTANTE: Next.js pode não carregar variáveis que começam com $ do .env.local
    // Vamos tentar ler diretamente do arquivo como fallback
    let apiKey = process.env.ASAAS_API_KEY
    
    // Se não encontrou no process.env, tentar ler do arquivo diretamente
    if (!apiKey) {
      try {
        const fs = require('fs')
        const path = require('path')
        const envPath = path.join(process.cwd(), '.env.local')
        const envContent = fs.readFileSync(envPath, 'utf8')
        const match = envContent.match(/^ASAAS_API_KEY=(.+)$/m)
        if (match) {
          apiKey = match[1].trim()
          console.log('✅ API Key carregada diretamente do arquivo .env.local')
        }
      } catch (fileError: any) {
        console.error('❌ Erro ao ler .env.local:', fileError.message)
      }
    }
    
    const apiUrl = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
    
    console.log('🔑 Verificando API Key do Asaas...')
    console.log('📋 Configuração:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A',
      apiUrl,
    })
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'ASAAS_API_KEY não está configurada nas variáveis de ambiente',
        details: {
          hasApiKey: false,
          apiUrl,
        }
      }, { status: 500 })
    }
    
    // Limpar API key - remover aspas e escapes
    let cleanApiKey = apiKey.trim()
    // Remover aspas no início e fim se houver
    if (cleanApiKey.startsWith('"') && cleanApiKey.endsWith('"')) {
      cleanApiKey = cleanApiKey.slice(1, -1)
    }
    if (cleanApiKey.startsWith("'") && cleanApiKey.endsWith("'")) {
      cleanApiKey = cleanApiKey.slice(1, -1)
    }
    // Remover escape de $ se houver
    if (cleanApiKey.startsWith('\\$')) {
      cleanApiKey = cleanApiKey.substring(1)
    }
    
    // Testar a API key fazendo uma chamada simples (buscar customers)
    console.log('🧪 Testando API key com chamada de teste...')
    const testUrl = `${apiUrl}/customers?limit=1`
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'access_token': cleanApiKey,
      },
    })
    
    console.log('📡 Resposta do Asaas:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText }
      }
      
      console.error('❌ Erro na resposta do Asaas:', {
        status: response.status,
        error: errorData,
      })
      
      return NextResponse.json({
        success: false,
        error: 'API Key inválida ou sem permissão',
        details: {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          apiUrl: testUrl,
        }
      }, { status: 401 })
    }
    
    const data = await response.json()
    console.log('✅ API Key funcionando! Resposta:', {
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
    })
    
    return NextResponse.json({
      success: true,
      message: 'API Key do Asaas está funcionando corretamente!',
      details: {
        apiUrl,
        hasApiKey: true,
        apiKeyLength: cleanApiKey.length,
        testResponse: {
          status: response.status,
          hasData: !!data,
        }
      }
    })
  } catch (error: any) {
    console.error('❌ Erro ao testar API Key:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao testar API Key: ' + error.message,
      details: {
        message: error.message,
        stack: error.stack,
      }
    }, { status: 500 })
  }
}

