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

export type PlenLLMFallbackOptions = {
  userMessage: string
  /** Contexto opcional, ex: "O usuário enviou uma mensagem que não foi reconhecida como comando." */
  context?: string
}

/**
 * Chama a OpenAI para gerar uma resposta amigável e restrita à Plenipay.
 * Retorna null se OPENAI_API_KEY não estiver definida ou em caso de erro.
 */
export async function getPlenLLMResponse(options: PlenLLMFallbackOptions): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey?.trim()) return null

  const { userMessage, context } = options
  const prompt = context
    ? `${context}\n\nMensagem do usuário: "${userMessage}"\n\nResponda de forma amigável e restrita à Plenipay (uma mensagem curta).`
    : `Mensagem do usuário: "${userMessage}"\n\nResponda de forma amigável e restrita à Plenipay (uma mensagem curta).`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 280,
      }),
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
