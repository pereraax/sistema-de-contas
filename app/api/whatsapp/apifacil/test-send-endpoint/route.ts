/**
 * Testar diferentes endpoints de envio do apifacil.dev
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
    `/whatsapp/instancia/${instanceId}/mensagem/enviar`,
    `/whatsapp/instancia/${instanceId}/mensagem/enviar-texto`,
    `/whatsapp/enviar/${instanceId}`,
    `/whatsapp/enviar-texto/${instanceId}`,
  ]

  const payloads = [
    { number: '553194467805', text: 'Teste' },
    { numero: '553194467805', mensagem: 'Teste' },
    { destino: '553194467805', mensagem: 'Teste' },
    { to: '553194467805', message: 'Teste' },
  ]

  for (const endpoint of endpoints) {
    for (const payload of payloads) {
      try {
        const url = `${baseUrl}${endpoint}`
        console.log(`🧪 Testando: ${url} com payload:`, payload)
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const responseText = await response.text()
        let responseData: any = {}
        
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText.substring(0, 200) }
        }

        results.push({
          endpoint,
          payload,
          url,
          status: response.status,
          ok: response.ok,
          response: responseData,
        })

        if (response.ok) {
          console.log(`✅ SUCESSO com ${endpoint} usando payload:`, Object.keys(payload))
        }
      } catch (error: any) {
        results.push({
          endpoint,
          payload,
          error: error.message,
        })
      }
    }
  }

  return NextResponse.json({
    instanceId,
    results,
    summary: {
      total: results.length,
      success: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok && !r.error).length,
      errors: results.filter(r => r.error).length,
    }
  })
}











