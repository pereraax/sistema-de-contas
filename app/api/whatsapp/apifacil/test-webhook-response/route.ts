/**
 * Testar se o apifacil.dev aceita resposta no webhook
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Tentar diferentes formatos de resposta que o apifacil.dev pode aceitar
    const responseFormats = [
      // Formato 1: Resposta direta no campo "resposta"
      {
        success: true,
        resposta: 'Teste de resposta via webhook',
        message: 'Mensagem recebida',
      },
      // Formato 2: Resposta no campo "response"
      {
        success: true,
        response: 'Teste de resposta via webhook',
        message: 'Mensagem recebida',
      },
      // Formato 3: Resposta no campo "text"
      {
        success: true,
        text: 'Teste de resposta via webhook',
        message: 'Mensagem recebida',
      },
      // Formato 4: Resposta no campo "message"
      {
        success: true,
        message: 'Teste de resposta via webhook',
      },
    ]
    
    // Retornar primeiro formato (mais comum)
    return NextResponse.json(responseFormats[0], { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}








