/**
 * POST: gera a instrução do bloco IA a partir de um prompt em linguagem natural.
 * O usuário descreve o que a IA deve fazer; a LLM devolve uma instrução clara para o bloco.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getPlenLLMResponse } from '@/lib/plen-llm-fallback'

const SYSTEM_CONTEXT = `Você é um assistente que cria instruções para um bloco de IA em um chatbot (WhatsApp).
O usuário vai descrever o que quer que a IA faça (ex.: "quando o usuário disser olá, oi ou 'Quero utilizar a Plenipay', identifique e responda com boas-vindas").
Sua resposta deve ser APENAS o texto da instrução em português: claro, direto e em uma ou poucas frases, para ser usado como "Instrução para a IA" no fluxo.
Não inclua explicações, títulos ou aspas. Apenas a instrução que o sistema vai usar.`

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) {
      return NextResponse.json({ error: 'Envie um prompt (campo "prompt")' }, { status: 400 })
    }

    const instruction = await getPlenLLMResponse({
      userMessage: prompt,
      context: SYSTEM_CONTEXT,
    })

    if (!instruction) {
      return NextResponse.json(
        { error: 'Não foi possível gerar a instrução. Verifique as chaves de IA (GROQ_API_KEY, OPENAI_API_KEY ou XAI_API_KEY).' },
        { status: 503 }
      )
    }

    return NextResponse.json({ instruction: instruction.trim() })
  } catch (e) {
    console.error('[generate-ia-instruction]', e)
    return NextResponse.json({ error: 'Erro ao gerar instrução' }, { status: 500 })
  }
}
