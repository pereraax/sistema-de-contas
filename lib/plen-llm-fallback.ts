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
- Lembretes: "me lembre de pagar conta amanhã", "lembrete: comprar remédio dia 15"
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
9. Se perguntarem sobre Open Finance, Open Banking ou conectar banco: diga que está em produção e em breve estará disponível.`

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
