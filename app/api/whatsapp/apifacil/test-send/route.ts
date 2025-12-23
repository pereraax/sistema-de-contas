/**
 * Rota de teste para descobrir o endpoint correto de envio
 * Use esta rota para testar diferentes formatos de envio
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApifacilConfig } from '@/lib/whatsapp-apifacil'

const APIFACIL_BASE_URL = 'https://apifacil.dev/api/v1'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()
    
    if (!phoneNumber || !message) {
      return NextResponse.json({ 
        error: 'phoneNumber e message são obrigatórios' 
      }, { status: 400 })
    }

    const cfg = getApifacilConfig()
    if (!cfg) {
      return NextResponse.json({ 
        error: 'Apifacil não configurado. Configure APIFACIL_INSTANCE_ID e APIFACIL_TOKEN' 
      }, { status: 400 })
    }

    // Limpar número de telefone
    let cleanPhone = phoneNumber.replace(/\D/g, '')
    if (!cleanPhone.startsWith('55') && (cleanPhone.length === 10 || cleanPhone.length === 11)) {
      cleanPhone = `55${cleanPhone}`
    }

    console.log('🧪 [Test Send] Testando envio para:', cleanPhone)
    console.log('🧪 [Test Send] Instância:', cfg.instanceId)
    console.log('🧪 [Test Send] Token:', cfg.token.substring(0, 10) + '...')

    // Lista de TODOS os possíveis endpoints e formatos
    const testCases = [
      // Formato 1: POST /whatsapp/mensagem (instancia_id como string)
      {
        name: 'POST /whatsapp/mensagem (instancia_id string)',
        url: `${APIFACIL_BASE_URL}/whatsapp/mensagem`,
        method: 'POST',
        payload: {
          instancia_id: cfg.instanceId,
          numero_destino: cleanPhone,
          mensagem: message,
        }
      },
      // Formato 2: POST /whatsapp/mensagem (instancia_id como número)
      {
        name: 'POST /whatsapp/mensagem (instancia_id number)',
        url: `${APIFACIL_BASE_URL}/whatsapp/mensagem`,
        method: 'POST',
        payload: {
          instancia_id: parseInt(cfg.instanceId),
          numero_destino: cleanPhone,
          mensagem: message,
        }
      },
      // Formato 3: POST /whatsapp/mensagem (destino ao invés de numero_destino)
      {
        name: 'POST /whatsapp/mensagem (destino)',
        url: `${APIFACIL_BASE_URL}/whatsapp/mensagem`,
        method: 'POST',
        payload: {
          instancia_id: cfg.instanceId,
          destino: cleanPhone,
          mensagem: message,
        }
      },
      // Formato 4: POST /whatsapp/instancia/{id}/mensagem
      {
        name: 'POST /whatsapp/instancia/{id}/mensagem',
        url: `${APIFACIL_BASE_URL}/whatsapp/instancia/${cfg.instanceId}/mensagem`,
        method: 'POST',
        payload: {
          numero_destino: cleanPhone,
          mensagem: message,
        }
      },
      // Formato 5: POST /whatsapp/instancia/{id}/mensagem/enviar
      {
        name: 'POST /whatsapp/instancia/{id}/mensagem/enviar',
        url: `${APIFACIL_BASE_URL}/whatsapp/instancia/${cfg.instanceId}/mensagem/enviar`,
        method: 'POST',
        payload: {
          destino: cleanPhone,
          texto: message,
        }
      },
      // Formato 6: PUT /whatsapp/configuracao/{id}
      {
        name: 'PUT /whatsapp/configuracao/{id}',
        url: `${APIFACIL_BASE_URL}/whatsapp/configuracao/${cfg.instanceId}`,
        method: 'PUT',
        payload: {
          mensagem: message,
          numero_destino: cleanPhone,
        }
      },
      // Formato 7: POST /whatsapp/enviar
      {
        name: 'POST /whatsapp/enviar',
        url: `${APIFACIL_BASE_URL}/whatsapp/enviar`,
        method: 'POST',
        payload: {
          instancia_id: cfg.instanceId,
          numero: cleanPhone,
          texto: message,
        }
      },
      // Formato 8: POST /whatsapp/send
      {
        name: 'POST /whatsapp/send',
        url: `${APIFACIL_BASE_URL}/whatsapp/send`,
        method: 'POST',
        payload: {
          instance_id: cfg.instanceId,
          to: cleanPhone,
          message: message,
        }
      },
    ]

    const results: any[] = []

    for (const testCase of testCases) {
      try {
        console.log(`\n🧪 [Test Send] Testando: ${testCase.name}`)
        console.log(`   URL: ${testCase.url}`)
        console.log(`   Payload:`, JSON.stringify(testCase.payload, null, 2))

        const response = await fetch(testCase.url, {
          method: testCase.method,
          headers: {
            'Authorization': cfg.token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testCase.payload),
        })

        const responseText = await response.text()
        let responseData: any = {}
        
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { raw: responseText.substring(0, 500) }
        }

        const result = {
          name: testCase.name,
          url: testCase.url,
          method: testCase.method,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          response: responseData,
        }

        results.push(result)

        console.log(`   Status: ${response.status} ${response.statusText}`)
        console.log(`   Response:`, JSON.stringify(responseData, null, 2))

        if (response.ok) {
          console.log(`   ✅ SUCESSO! Este endpoint funciona!`)
        } else {
          console.log(`   ❌ Falhou: ${response.status} ${response.statusText}`)
        }
      } catch (error: any) {
        console.error(`   ❌ Erro:`, error.message)
        results.push({
          name: testCase.name,
          url: testCase.url,
          method: testCase.method,
          error: error.message,
        })
      }
    }

    // Encontrar qual funcionou
    const successful = results.find(r => r.success)
    
    return NextResponse.json({
      success: !!successful,
      message: successful 
        ? `Endpoint correto encontrado: ${successful.name}` 
        : 'Nenhum endpoint funcionou. Verifique os resultados abaixo.',
      successfulEndpoint: successful,
      allResults: results,
    })
  } catch (error: any) {
    console.error('❌ [Test Send] Erro:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}











