/**
 * Verificar se o webhook está acessível e funcionando
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const protocol = url.protocol || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  
  const webhookUrl = `${protocol}//${host}/api/whatsapp/apifacil/webhook`
  
  return NextResponse.json({
    success: true,
    message: 'Verificação do webhook',
    webhookUrl: webhookUrl,
    instrucoes: {
      passo1: 'Copie a URL acima',
      passo2: 'Vá no painel do apifacil.dev',
      passo3: 'Cole a URL no campo "Webhook URL"',
      passo4: 'IMPORTANTE: Se estiver usando túnel (localtunnel), use a URL do túnel',
      passo5: 'URL do túnel deve ser: https://seu-tunel.loca.lt/api/whatsapp/apifacil/webhook',
    },
    verificacoes: {
      servidorRodando: 'Verifique se npm run dev está rodando',
      tunelRodando: 'Verifique se npm run tunnel está rodando',
      urlCorreta: 'URL deve terminar com /api/whatsapp/apifacil/webhook',
      https: 'URL do túnel deve usar HTTPS (não HTTP)',
    },
    teste: {
      endpoint: webhookUrl,
      metodo: 'POST',
      exemplo: 'O apifacil.dev deve fazer POST para este endpoint',
    }
  })
}

export async function POST(request: NextRequest) {
  // Simular recebimento de webhook para teste
  const body = await request.json().catch(() => ({}))
  
  return NextResponse.json({
    success: true,
    message: 'Webhook recebido com sucesso!',
    timestamp: new Date().toISOString(),
    body: body,
    info: 'Se você vê esta mensagem, o endpoint está funcionando',
  })
}








