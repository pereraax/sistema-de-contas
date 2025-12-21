/**
 * Teste direto na API do apifacil.dev para descobrir o formato correto
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const instanceId = process.env.APIFACIL_INSTANCE_ID
  const token = process.env.APIFACIL_TOKEN

  if (!instanceId || !token) {
    return NextResponse.json({
      error: 'Credenciais não configuradas'
    }, { status: 400 })
  }

  const baseUrl = 'https://apifacil.dev/api/v1'
  const results: any[] = []

  // Testar diferentes formatos de endpoint para ENVIAR mensagem
  const endpoints = [
    `/whatsapp/instancia/${instanceId}/enviar`,
    `/whatsapp/instancia/${instanceId}/enviar-texto`,
    `/whatsapp/instancia/${instanceId}/send`,
    `/whatsapp/instancia/${instanceId}/send-text`,
    `/whatsapp/enviar/${instanceId}`,
  ]

  const authFormats = [
    { type: 'Token direto', header: token },
    { type: 'Bearer', header: `Bearer ${token}` },
  ]

  for (const endpoint of endpoints) {
    for (const auth of authFormats) {
      try {
        const url = `${baseUrl}${endpoint}`
        console.log(`🧪 Testando: ${url} com ${auth.type}`)
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': auth.header,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: '5511999999999', // Número de teste
            text: 'Teste',
          }),
        })

        const responseText = await response.text()
        let responseData: any = {}
        
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText }
        }

        results.push({
          endpoint,
          authType: auth.type,
          url,
          status: response.status,
          ok: response.ok,
          response: responseData,
        })

        if (response.ok) {
          console.log(`✅ SUCESSO com ${endpoint} usando ${auth.type}`)
        }
      } catch (error: any) {
        results.push({
          endpoint,
          authType: auth.type,
          error: error.message,
        })
      }
    }
  }

  return NextResponse.json({
    instanceId,
    tokenLength: token.length,
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok && !r.error).length,
      errors: results.filter(r => r.error).length,
    }
  })
}










