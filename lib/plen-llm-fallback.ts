/** Resposta quando a assistente não sabe ou está fora do escopo — sugere suporte humano. */
export const RESPOSTA_NAO_SEI = `Ops, parece que você precisa de mais suporte 💙⚠️

Se quiser falar com o suporte humano, basta enviar:

"Parar assistente Plen"

que já chamo meus especialistas para tirar suas dúvidas com mais clareza 😊`

/** Resposta sobre Open Finance (em produção). */
export const RESPOSTA_OPEN_FINANCE = `O Open Finance está em produção e em breve estará disponível! 🚀

Assim que liberarmos, você poderá conectar seus bancos e ter tudo ainda mais organizado. Fique de olho em plenipay.com para novidades 😊`

/** Mensagem dinâmica sobre planos — sem valor real, estratégica ("por X por dia"). */
export function getRespostaPlanos(): string {
  return `Que bom que você quer ter um assistente a seu favor! 💙

Por apenas poucos centavos por dia você consegue ter a Plen cuidando das suas finanças pelo WhatsApp: registrar gastos, receitas, dívidas e ver relatórios quando quiser.

Você pode começar grátis e testar. Cadastre em plenipay.com e depois envie seu e-mail aqui no WhatsApp para ativar. 😊`
}

/**
 * Fallback com LLM (OpenAI) para o assistente PLEN/Plenipay.
 * Usado quando a mensagem não é interpretada como comando: gera resposta natural,
 * amigável e restrita apenas a assuntos da Plenipay (finanças, gastos, entradas, relatórios).
 */

const PLATAFORMA_PLENIPAY = `
O que a Plenipay oferece (use isso para responder com clareza):
- Registrar gastos: "gastei 50 no mercado", "paguei 30 de Uber", "paguei 150,00 de luz"
- Registrar entradas: "recebi 1000", "ganhei 50", "meu salário é 3000"
- Registrar dívidas: "tenho uma dívida de 200 no cartão", "devo 500 para o João"
- Lembretes: "me lembre de pagar conta amanhã", "lembrete para pagar conta de luz dia 7 de março", "pagar conta de água dia 07 de março", "lembrete: comprar remédio dia 15" (não confundir com dívida; dívida tem valor em reais)
- Consultar: "quanto gastei na semana?", "quanto gastei no mês?", "quais são minhas dívidas?", "quanto tenho de saldo?", "me mostre o relatório"
- Metas e relatórios na conta (plenipay.com)
- Múltiplas pessoas na conta (Configurações → Usuários)
- Cadastro e ativação pelo WhatsApp (enviar e-mail após cadastro no site)
Valores aceitos: com ponto ou vírgula (ex.: 1.500,00 ou 50,00). Use apenas "plenipay.com" em links (nunca URL completa).
Open Finance: NÃO está disponível ainda; está em produção e em breve estará disponível.`

const SYSTEM_PROMPT = `Você é o PLEN, o assistente da Plenipay. Sua função é ajudar o usuário com controle financeiro pessoal dentro da plataforma Plenipay.
${PLATAFORMA_PLENIPAY}

REGRAS OBRIGATÓRIAS:
1. Responda SOMENTE sobre assuntos relacionados à Plenipay: registrar gastos, entradas, dívidas, lembretes, ver relatórios, saldo, salário, consultas financeiras, como usar, cadastro.
2. Seja sempre amigável, educado e use um tom natural (como um amigo que ajuda com as finanças).
3. Se o usuário pedir algo FORA do escopo (receitas, notícias, outro assunto) ou você não souber responder, responda EXATAMENTE com esta mensagem (copie e cole, sem alterar): "Ops, parece que você precisa de mais suporte 💙⚠️\n\nSe quiser falar com o suporte humano, basta enviar:\n\n\"Parar assistente Plen\"\n\nque já chamo meus especialistas para tirar suas dúvidas com mais clareza 😊"
4. Se o usuário quiser REGISTRAR DÍVIDA mas não deu detalhes, pergunte de forma amigável: "Sobre o que é essa dívida? Qual o valor? Quando será paga? Quer adicionar alguma observação?" e sugira que depois pode mandar por exemplo: "tenho uma dívida de 200 reais no cartão".
5. Se parecer que quer REGISTRAR gasto/entrada mas disse de um jeito que o sistema pode não reconhecer, sugira frases que funcionam: "Gastei 50 no mercado", "Recebi 100", "Ganhei 40 reais", "Tenho uma dívida de 200 no cartão". Valores podem ser com vírgula ou ponto (ex.: 1.500,00).
6. Mantenha respostas curtas e claras (ideal para WhatsApp). Use emojis com moderação (1-2 por resposta).
7. Não invente dados nem valores. Para relatórios ou saldos, sugira "me mostre o relatório" ou "quanto gastei na semana?".
8. Links: use apenas "plenipay.com" (nunca https:// ou URL completa).
9. Se perguntarem sobre Open Finance, Open Banking ou conectar banco: diga que está em produção e em breve estará disponível.
10. NUNCA confunda LEMBRETE com DÍVIDA. Frases como "pagar conta de luz dia 7 de março", "me lembre de pagar conta dia 07" são PEDIDOS DE LEMBRETE (para lembrar de pagar naquela data), NÃO são registro de dívida. Dívida sempre tem valor em reais (ex.: "tenho uma dívida de 200 reais"). Se o usuário não mencionou valor em reais, não sugira que é dívida.`

/** Prompt para dúvidas sobre o produto (preços, planos, como funciona) — usuário ainda não logado. */
const PRODUCT_SYSTEM_PROMPT = `Você é a Plen, assistente da PleniPay. O usuário está conhecendo o produto (ainda não logou). Responda de forma amigável e natural sobre a PleniPay.

FUNCIONALIDADES: Registrar gastos, receitas e dívidas pelo WhatsApp; ver relatórios, metas; múltiplas pessoas na conta; cadastro em plenipay.com e ativação enviando o e-mail aqui.
PLANOS: Quando perguntarem preço/valor/quanto custa, responda de forma ESTRATÉGICA e DINÂMICA: diga que por apenas "poucos centavos por dia" ou "menos de um real por dia" eles conseguem ter um assistente a favor deles, que pode começar grátis e testar. NÃO mencione valores reais em reais (R$). Incentive a cadastrar em plenipay.com.
Links: use apenas "plenipay.com" (nunca URL completa).
Open Finance: está em produção, em breve disponível.`

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

/**
 * Desambigua valor quando a transcrição veio errada (2 ou 20 em vez de 200/300).
 * Usa o CONTEXTO da frase: "com roupas", "no mercado" → normalmente 200-500 reais.
 */
function parseNumFromLLM(text: string, valorMin: number): number | null {
  const cleaned = text.trim().replace(/\s/g, '').replace(/[^\d.,]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return Number.isFinite(num) && num >= valorMin && num <= 500_000 ? num : null
}

export async function desambiguarValorDoisTranscricao(frase: string, valorSuspeito: number = 2): Promise<number | null> {
  if (!frase || frase.trim().length > 200) return null
  const valorMin = valorSuspeito === 20 ? 50 : 3
  const f = frase.trim().toLowerCase()
  const temRoupas = /\broupas?\b/.test(f)
  const dicaRoupas = temRoupas ? ' A frase menciona ROUPAS (clothes): o valor mais comum é 300 reais. Responda 300.' : ''
  const dicaContexto = `Use o CONTEXTO: "com roupas" = normalmente 300 reais; "no mercado" = 100-300; "restaurante" = 50-150. Não devolva 20 nem 2 se o contexto indica gasto com roupas/mercado.${dicaRoupas}`
  const prompt = valorSuspeito === 20
    ? `Transcrição de áudio (gasto em reais): "${frase.trim()}"

A transcrição saiu com valor 20, mas quando a pessoa fala "com roupas", "no mercado", o valor é 200-400 (não 20). ${dicaContexto}

Responda APENAS um número: o valor em reais que a pessoa disse. Um número só. Prefira 300 se a frase tem "roupas".`
    : `Transcrição de áudio (gasto em reais): "${frase.trim()}"

O valor na transcrição é 2 - é ERRO. "Dois" é confundido com "trezentos" (300), "duzentos" (200). ${dicaContexto}

Responda APENAS um número. Se a frase tem "roupas", responda 300. Caso contrário 200 ou 300. Um número só.`

  // 1) Groq (gratuito)
  const groqKey = process.env.GROQ_API_KEY?.trim()
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.2,
          max_tokens: 15,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content ?? ''
        const num = parseNumFromLLM(content, valorMin)
        if (num != null) return num
      }
    } catch (_) {}
  }
  // 2) OpenAI (fallback quando Groq falha)
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.2,
          max_tokens: 15,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content ?? ''
        const num = parseNumFromLLM(text, valorMin)
        if (num != null) return num
      }
    } catch (_) {}
  }
  return null
}

const PROMPT_REGISTRO_COMPLETO = `Esta frase é de alguém registrando um GASTO (gastei, paguei) ou uma ENTRADA (ganhei, recebi) em reais. Pode ser transcrição de áudio.
Extraia EXATAMENTE o que a pessoa disse:
1) TIPO: "gasto" se gastou/pagou; "entrada" se recebeu/ganhou.
2) VALOR: o número em reais que a pessoa disse (qualquer valor: 30, 80, 150, 450, 1200, etc.).
3) NOME: a descrição/categoria — use o que vier na frase: "com X" (ex.: com roupas, com eletrônicos), "no X" (no mercado, no posto), "em X" (em conta de luz), "de X" (de mãe). Se não tiver descrição, use "Gasto" ou "Entrada".
Não invente valor nem descrição. "Gastei 450 com roupas" → valor 450, nome Roupas. "Paguei 80 no mercado" → 80, Mercado. "Recebi 200 de João" → 200, João.
Responda EXATAMENTE: TIPO: gasto ou entrada | VALOR: (número) | NOME: (descrição)
Frase: `

/** Parseia resposta no formato TIPO / VALOR / NOME (várias variações de regex). */
function parseRespostaRegistroCompleto(text: string): { tipo: 'entrada' | 'saida'; valor: number; nome: string } | null {
  const raw = (text ?? '').replace(/```/g, '').trim()
  const tipoMatch = raw.match(/(?:TIPO|tipo)\s*:\s*(gasto|entrada)/i) || raw.match(/\b(gasto|entrada)\s*[:\|]/i)
  const valorMatch = raw.match(/(?:VALOR|valor)\s*:\s*([\d.,\s]+)/i) || raw.match(/\b(\d[\d.,]*)\s*(?:reais?|r\$)?/i)
  const nomeMatch = raw.match(/(?:NOME|nome)\s*:\s*(.+?)(?:\n|$|\||\s+TIPO)/is) || raw.match(/(?:NOME|nome)\s*:\s*(.+)/i)
  const tipoStr = (tipoMatch?.[1] ?? '').toLowerCase()
  const valorStr = (valorMatch?.[1] ?? '').replace(/\s/g, '').replace(',', '.')
  const valor = valorStr ? parseFloat(valorStr) : NaN
  const nomeRaw = (nomeMatch?.[1] ?? '').trim().replace(/\n/g, ' ').substring(0, 100)
  if (
    (tipoStr === 'gasto' || tipoStr === 'entrada') &&
    Number.isFinite(valor) &&
    valor >= 1 &&
    valor <= 500_000
  ) {
    const tipo: 'entrada' | 'saida' = tipoStr === 'entrada' ? 'entrada' : 'saida'
    const nome =
      nomeRaw.length >= 2
        ? nomeRaw.charAt(0).toUpperCase() + nomeRaw.slice(1).toLowerCase()
        : nomeRaw || (tipo === 'saida' ? 'Gasto' : 'Entrada')
    return { tipo, valor, nome }
  }
  return null
}

/**
 * Extrai tipo (gasto/entrada), valor e nome de QUALQUER frase (áudio transcrita ou mensagem).
 * Usado para: "ganhei 500 de mãe", "gastei 400 com roupas". Só gratuito: Groq primeiro, Gemini fallback.
 */
export async function extrairRegistroCompletoComGemini(
  frase: string
): Promise<{ tipo: 'entrada' | 'saida'; valor: number; nome: string } | null> {
  if (!frase || frase.trim().length < 5 || frase.trim().length > 250) return null
  const trimmed = frase.trim()
  const prompt = PROMPT_REGISTRO_COMPLETO + `"${trimmed}"`

  // 1) Groq (gratuito) — principal
  const groqKey = process.env.GROQ_API_KEY?.trim()
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.1,
          max_tokens: 80,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim()
        const parsed = parseRespostaRegistroCompleto(text)
        if (parsed) return parsed
      }
    } catch (_) {}
  }

  // 3) OpenAI (fallback quando Groq falha)
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.1,
          max_tokens: 100,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim()
        const parsed = parseRespostaRegistroCompleto(text)
        if (parsed) return parsed
      }
    } catch (_) {}
  }
  return null
}

const PROMPT_VALOR_NOME_GASTO = `Esta frase é de alguém registrando um gasto em reais (pode ser áudio transcrito).
Extraia EXATAMENTE o que a pessoa disse: VALOR (qualquer número: 30, 80, 450, 1200) e NOME (a descrição: "com X", "no X", "em X" — roupas, mercado, eletrônicos, conta de luz, etc.). Não invente valor nem descrição.
Responda EXATAMENTE: VALOR: (apenas o número) | NOME: (descrição em poucas palavras)
Frase: `

function parseValorENomeGasto(text: string): { valor: number; nome: string } | null {
  const raw = (text ?? '').replace(/```/g, '').trim()
  const valorMatch = raw.match(/(?:VALOR|valor)\s*:\s*([\d.,\s]+)/i)
  const nomeMatch = raw.match(/(?:NOME|nome)\s*:\s*(.+?)(?:\n|$|\||\s+VALOR)/i)
  const valorStr = (valorMatch?.[1] ?? '').replace(/\s/g, '').replace(',', '.')
  const valor = valorStr ? parseFloat(valorStr) : NaN
  const nome = (nomeMatch?.[1] ?? '').trim().replace(/\n/g, ' ').substring(0, 100)
  if (Number.isFinite(valor) && valor >= 1 && valor <= 500_000 && nome.length >= 2) {
    const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase()
    return { valor, nome: nomeFormatado }
  }
  return null
}

/**
 * Extrai valor e nome de uma frase de GASTO. Só gratuito: Groq primeiro, Gemini fallback.
 */
export async function extrairValorENomeComGemini(frase: string): Promise<{ valor: number; nome: string } | null> {
  if (!frase || frase.trim().length < 5 || frase.trim().length > 250) return null
  const prompt = PROMPT_VALOR_NOME_GASTO + `"${frase.trim()}"`

  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.1,
          max_tokens: 80,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim()
        const parsed = parseValorENomeGasto(text)
        if (parsed) return parsed
      }
    } catch (_) {}
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.1,
          max_tokens: 80,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim()
        const parsed = parseValorENomeGasto(text)
        if (parsed) return parsed
      }
    } catch (_) {}
  }
  return null
}

/**
 * Extrai o valor em reais de uma frase via LLM. Só gratuito: Groq, depois Gemini.
 * @param allowShortFrase se true, aceita frase curta (ex.: transcrição "gastei 2" + hint)
 */
export async function extrairValorReaisComLLM(frase: string, allowShortFrase?: boolean): Promise<number | null> {
  const trimmed = (frase || '').trim()
  const minLen = allowShortFrase ? 5 : 10
  if (!trimmed || trimmed.length < minLen) return null
  const prompt = `Desta frase, qual o valor em reais que a pessoa mencionou? Responda APENAS um número (ex.: 50, 80, 200, 350, 450). Não invente; use o valor que está na frase ou o mais provável no contexto.
Frase: ${trimmed.slice(0, 500)}`
  const groqKey = process.env.GROQ_API_KEY?.trim()
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.1,
          max_tokens: 20,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim().replace(/\s/g, '')
        const num = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'))
        if (Number.isFinite(num) && num >= 1 && num <= 500_000) return num
      }
    } catch (_) {}
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.1,
          max_tokens: 20,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim().replace(/\s/g, '')
        const num = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'))
        if (Number.isFinite(num) && num >= 1 && num <= 500_000) return num
      }
    } catch (_) {}
  }
  return null
}

/**
 * Quando a transcrição de um gasto está incerta ("gastei 2", "gastei"), infere valor provável.
 * Usa o contexto da frase; não prioriza um valor fixo.
 */
export async function inferirValorGastoTranscricaoIncerteza(frase: string): Promise<number | null> {
  const trimmed = (frase || '').trim()
  if (!trimmed || trimmed.length < 3) return null
  const prompt = `Transcrição de áudio de alguém dizendo que GASTOU (pode estar incompleta ou errada). Dado o texto: "${trimmed.slice(0, 200)}". Qual valor em reais a pessoa provavelmente disse? Responda APENAS um número (ex.: 50, 80, 100, 150, 200, 300, 400).`
  const groqKey = process.env.GROQ_API_KEY?.trim()
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.1,
          max_tokens: 20,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim().replace(/\s/g, '')
        const num = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'))
        if (Number.isFinite(num) && num >= 50 && num <= 500) return num
      }
    } catch (_) {}
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user' as const, content: prompt }],
          temperature: 0.1,
          max_tokens: 20,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim().replace(/\s/g, '')
        const num = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'))
        if (Number.isFinite(num) && num >= 50 && num <= 500) return num
      }
    } catch (_) {}
  }
  return null
}

