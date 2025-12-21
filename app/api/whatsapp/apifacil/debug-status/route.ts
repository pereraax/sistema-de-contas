/**
 * Debug: Ver resposta bruta da API do apifacil.dev
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

  try {
    const url = `https://apifacil.dev/api/v1/whatsapp/instancia/${instanceId}/status`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
    })

    const responseText = await response.text()
    let responseData: any = {}
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    return NextResponse.json({
      url,
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      response: responseData,
      responseText,
      analysis: {
        hasError: responseData.error === true || responseData.error === false,
        hasStatus: !!responseData.status,
        hasConnected: !!responseData.connected,
        hasConectado: !!responseData.conectado,
        hasAtivo: !!responseData.ativo,
        statusValue: responseData.status,
        message: responseData.message,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}










