/**
 * PLEN — Respostas customizadas por mensagem do lead
 * Lê pares "possíveis mensagens do lead" → "resposta" de platform_config e faz match na mensagem.
 */

import { createAdminClient } from '@/lib/supabase/server'

const KEY = 'plen_lead_responses'

export interface LeadResponsePair {
  id?: string
  leadPhrases: string[]
  response: string
}

function normalize(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Verifica se a mensagem do usuário bate com alguma das frases do par (contém ou é contida). */
function matches(messageNorm: string, phraseNorm: string): boolean {
  if (!phraseNorm) return false
  return messageNorm.includes(phraseNorm) || phraseNorm.includes(messageNorm)
}

/**
 * Retorna a primeira resposta configurada cujo par tenha alguma frase que bata com a mensagem.
 * Aplica substituição {nome} na resposta.
 */
export async function getCustomLeadResponse(userMessage: string, nome: string): Promise<string | null> {
  const supabase = createAdminClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('platform_config')
    .select('value')
    .eq('key', KEY)
    .maybeSingle()

  if (error || !data?.value) return null

  let pairs: LeadResponsePair[]
  try {
    pairs = JSON.parse(data.value as string) as LeadResponsePair[]
  } catch {
    return null
  }

  if (!Array.isArray(pairs) || pairs.length === 0) return null

  const msgNorm = normalize(userMessage)
  for (const p of pairs) {
    const phrases = Array.isArray(p.leadPhrases) ? p.leadPhrases : []
    const response = typeof p.response === 'string' ? p.response.trim() : ''
    if (!response) continue
    const matched = phrases.some((phrase) => matches(msgNorm, normalize(phrase)))
    if (matched) {
      return response.replace(/\{nome\}/g, nome || '')
    }
  }
  return null
}
