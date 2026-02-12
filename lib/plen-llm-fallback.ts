/**
 * Fallback com LLM (OpenAI) para o assistente PLEN/Plenipay.
 * Usado quando a mensagem não é interpretada como comando: gera resposta natural,
 * amigável e restrita apenas a assuntos da Plenipay (finanças, gastos, entradas, relatórios).
 */

const SYSTEM_PROMPT = `Você é o PLEN, o assistente da Plenipay. Sua função é ajudar o usuário apenas com controle financeiro pessoal dentro da plataforma Plenipay.

REGRAS OBRIGATÓRIAS:
1. Responda SOMENTE sobre assuntos relacionados à Plenipay: registrar gastos e entradas, ver relatórios, dívidas, saldo, salário, consultas financeiras.
2. Seja sempre amigável, educado e use um tom natural (como um amigo que ajuda com as finanças).
3. Se o usuário pedir algo FORA do escopo (receitas de bolo, notícias, outro assunto), responda com gentileza que você só pode ajudar com o que a Plenipay oferece: registrar e consultar finanças. Exemplo: "Eu adoraria ajudar, mas aqui eu só consigo falar sobre suas finanças na Plenipay. Quer registrar um gasto ou ver seu resumo?"
4. Se parecer que o usuário quer REGISTRAR um valor (ganho, gasto, entrada) mas disse de um jeito que o sistema não reconheceu, sugira frases que funcionam, de forma amigável. Exemplos que funcionam: "Ganhei 40 reais", "Recebi 100", "Gastei 30 no mercado", "Novos ganhos de 50".
5. Mantenha respostas curtas e claras (ideal para WhatsApp). Use emojis com moderação (1-2 por resposta).
6. Não invente dados nem valores. Para relatórios ou saldos, diga que o usuário pode pedir "me mostre o relatório" ou "quanto gastei na semana?" para ver no app.
7. Não use markdown pesado; evite listas longas a menos que seja uma lista de sugestões de comandos.`

/** Prompt para dúvidas sobre o produto (preços, planos, como funciona) — usuário ainda não logado. */
const PRODUCT_SYSTEM_PROMPT = `Você é a Plen, assistente da PleniPay. O usuário está conhecendo o produto (ainda não logou). Responda de forma amigável e natural sobre a PleniPay.

INFORMAÇÕES REAIS DO PRODUTO:
- Planos: Gratuito (R$ 0), Básico (R$ 19,90/mês, 7 dias grátis), Premium (R$ 49,90/mês, 7 dias grátis), Anual (R$ 197/ano).
- Funciona pelo WhatsApp: registrar gastos, receitas, dívidas, ver relatórios, metas. Pode enviar mensagem, áudio, foto de comprovante.
- Cadastro: site plenipay.com. Depois de cadastrar, o usuário envia o e-mail aqui no WhatsApp para liberar.

REGRAS:
1. Seja natural e calorosa, como uma amiga. Use emojis com moderação.
2. Respostas curtas (ideal para WhatsApp). Se precisar de lista, use poucos itens.
3. Se perguntarem preço/valor/quanto custa: mencione os planos e que pode começar grátis.
4. Se perguntarem como funciona: explique que é pelo WhatsApp, que registra gastos e receitas e mostra relatórios.
5. Se alguém disser que "fulano vai me pagar X" ou "fulano me deve X": diga que depois de criar a conta e conectar pelo WhatsApp ela pode registrar isso direto por mensagem.
6. Sempre incentive a criar a conta (plenipay.com) e dizer que depois pode mandar o e-mail ali para liberar.
7. Não invente dados. Links: use apenas plenipay.com (sem colocar https para evitar preview no WhatsApp, ou use com zero-width space no final).`

export type PlenLLMFallbackOptions = {
  userMessage: string
  /** Contexto opcional, ex: "O usuário enviou uma mensagem que não foi reconhecida como comando." */
  context?: string
  /** Se true, usa prompt de produto (preços, planos, como funciona) para quem ainda não é usuário. */
  productMode?: boolean
}

/** Payload igual para Groq e OpenAI (API compatível). */
const buildChatPayload = (systemPrompt: string, prompt: string) => ({
  model: 'gpt-4o-mini', // usado só para OpenAI; Groq usa o próprio model
  messages: [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: prompt },
  ],
  temperature: 0.6,
  max_tokens: 320,
})

/**
 * Chama Groq (gratuito) ou OpenAI para gerar resposta do assistente PLEN.
 * Ordem: 1) Groq se GROQ_API_KEY estiver definida; 2) OpenAI se OPENAI_API_KEY estiver definida.
 * Retorna null se nenhuma chave estiver configurada ou em caso de erro.
 */
export async function getPlenLLMResponse(options: PlenLLMFallbackOptions): Promise<string | null> {
  const { userMessage, context, productMode } = options
  const systemPrompt = productMode ? PRODUCT_SYSTEM_PROMPT : SYSTEM_PROMPT
  const prompt = context
    ? `${context}\n\nMensagem do usuário: "${userMessage}"\n\nResponda de forma amigável (uma mensagem curta para WhatsApp).`
    : `Mensagem do usuário: "${userMessage}"\n\nResponda de forma amigável (uma mensagem curta para WhatsApp).`

  const body = buildChatPayload(systemPrompt, prompt)

  // 1) Tentar Groq (gratuito) — API compatível com OpenAI
  const groqKey = process.env.GROQ_API_KEY?.trim()
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          ...body,
          model: 'llama-3.1-8b-instant', // modelo rápido e gratuito no Groq
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content?.trim()
        if (text) return text
      } else {
        console.warn('[PLEN LLM] Groq respondeu com status:', res.status)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('[PLEN LLM] Erro ao chamar Groq:', msg)
    }
  }

  // 2) Fallback: OpenAI
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (!openaiKey) return null

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.warn('[PLEN LLM] OpenAI respondeu com status:', res.status)
      return null
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[PLEN LLM] Erro ao chamar OpenAI:', msg)
    return null
  }
}
