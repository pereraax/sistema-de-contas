/**
 * Testar diferentes formatos que o apifacil.dev pode enviar
 */

import { NextRequest, NextResponse } from 'next/server'
import { addWebhookLog, getWebhookLogs } from '@/lib/webhook-logs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    // Formatos possíveis do apifacil.dev
    const formatos = [
      // Formato 1: Baseado na documentação comum
      {
        nome: 'Formato 1: whatsapp_insert com tipo_envio',
        body: {
          event: 'whatsapp_insert',
          tipo_envio: 'MENSAGEM_RECEBIDA',
          origem: '5511999999999@s.whatsapp.net',
          mensagem: 'oi',
          remote_jid: '5511999999999@s.whatsapp.net',
        }
      },
      // Formato 2: Formato simples
      {
        nome: 'Formato 2: Formato simples',
        body: {
          from: '5511999999999@s.whatsapp.net',
          text: 'oi',
          message: 'oi',
        }
      },
      // Formato 3: Com data aninhada
      {
        nome: 'Formato 3: Com data aninhada',
        body: {
          tipo: 'whatsapp_insert',
          data: {
            from: '5511999999999@s.whatsapp.net',
            text: 'oi',
            message: {
              conversation: 'oi',
            }
          }
        }
      },
      // Formato 4: Formato do body recebido
      {
        nome: 'Formato 4: Formato do body recebido',
        body: body,
      }
    ]
    
    const resultados: Array<{ formato: string; status?: number; success?: boolean; response?: any; error?: string }> = []
    
    for (const formato of formatos) {
      try {
        // Registrar log
        addWebhookLog({
          timestamp: new Date().toISOString(),
          method: 'POST',
          body: formato.body,
          response: { status: 'test', formato: formato.nome },
        })
        
        // Fazer requisição para o webhook real
        const webhookUrl = `${request.nextUrl.protocol}//${request.headers.get('host')}/api/whatsapp/apifacil/webhook`
        
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formato.body),
        })
        
        const responseData = await response.json().catch(() => ({}))
        
        resultados.push({
          formato: formato.nome,
          status: response.status,
          success: response.ok,
          response: responseData,
        })
      } catch (error: any) {
        resultados.push({
          formato: formato.nome,
          error: error.message,
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Teste de formatos executado',
      formatosTestados: formatos.length,
      resultados,
      logs: {
        total: getWebhookLogs().length,
        ultimos: getWebhookLogs().slice(0, 5),
      },
      instrucoes: {
        passo1: 'Acesse: http://localhost:3000/whatsapp/logs-completos',
        passo2: 'Você deve ver logs de teste aparecer',
        passo3: 'Compare os formatos para ver qual funciona',
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de teste de formatos do apifacil.dev',
    instrucoes: {
      metodo: 'POST',
      endpoint: '/api/whatsapp/apifacil/testar-formato-apifacil',
      descricao: 'Testa diferentes formatos que o apifacil.dev pode enviar',
    },
  })
}








