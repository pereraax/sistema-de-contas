/**
 * Validação de nome no cadastro WhatsApp com OpenAI.
 * Usado quando as regras (isValidNome) rejeitam: tenta extrair nome de frases como "Meu nome é João" ou rejeitar "Ss", "sim".
 * Requer OPENAI_API_KEY no ambiente. Modelo: gpt-4o-mini (barato).
 */

const MODEL = 'gpt-4o-mini'
const MAX_TOKENS = 50

/**
 * Chama a OpenAI para extrair um nome de pessoa da mensagem do usuário (pergunta "Qual seu nome?").
 * Retorna o nome extraído (só texto) ou null se a resposta não for um nome (ex.: "sim", "ss", pergunta).
 * Retorna null também se OPENAI_API_KEY não estiver configurada ou em caso de erro.
 */
export async function extrairNomeComOpenAI(mensagem: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key || !mensagem || typeof mensagem !== 'string') return null

  const texto = mensagem.trim().slice(0, 300)
  const prompt = `O usuário está em um cadastro e foi perguntado "Qual seu nome?". Resposta dele: "${texto}"

Se a mensagem contém claramente um NOME DE PESSOA (ex: Maria, João Silva, Meu nome é Ana), responda APENAS com esse nome, sem aspas, sem ponto, sem explicação. Máximo 80 caracteres.
Se for confirmação (sim, ss, ok), pergunta ou não tiver nome, responda exatamente: NAO`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: MAX_TOKENS,
        temperature: 0.1,
      }),
    })

    if (!res.ok) {
      console.warn('[OpenAI Nome] Status:', res.status, await res.text().catch(() => ''))
      return null
    }

    const data = await res.json()
    const content = (data.choices?.[0]?.message?.content ?? '').trim()

    if (!content || content.toUpperCase() === 'NAO') return null
    const nome = content.slice(0, 80).trim()
    if (nome.length < 2) return null
    return nome
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[OpenAI Nome] Erro:', msg)
    return null
  }
}
