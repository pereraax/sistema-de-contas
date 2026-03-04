/**
 * Fluxo de criação de conta pelo WhatsApp: estado (Qual seu nome? -> Qual seu e-mail? -> criar conta).
 */

import { createAdminClient } from '@/lib/supabase/server'

const TABLE = 'whatsapp_signup_pending'

function normalizarPhone(phone: string): string {
  const limpo = String(phone || '').replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}

export type SignupPending = {
  phone: string
  step: 'nome' | 'email'
  nome: string | null
  email: string | null
  created_at: string
  updated_at: string
}

/** Retorna o estado atual do cadastro pelo WhatsApp para este número, ou null se não estiver no fluxo. */
export async function getSignupPending(phone: string): Promise<SignupPending | null> {
  const supabase = createAdminClient()
  if (!supabase) return null
  const p = normalizarPhone(phone)
  if (p.length < 10) return null
  const { data, error } = await supabase
    .from(TABLE)
    .select('phone, step, nome, email, created_at, updated_at')
    .eq('phone', p)
    .maybeSingle()
  if (error || !data) return null
  return data as SignupPending
}

/** Inicia o fluxo: aguardando nome. */
export async function setSignupStepNome(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    { phone: p, step: 'nome', nome: null, email: null, updated_at: now },
    { onConflict: 'phone' }
  )
}

/** Avança para aguardar e-mail; salva o nome. */
export async function setSignupStepEmail(phone: string, nome: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  const nomeTrim = (nome || '').trim().slice(0, 200)
  const now = new Date().toISOString()
  await supabase.from(TABLE).upsert(
    { phone: p, step: 'email', nome: nomeTrim, email: null, updated_at: now },
    { onConflict: 'phone' }
  )
}

/** Remove o estado (após criar conta ou cancelar). */
export async function clearSignupPending(phone: string): Promise<void> {
  const supabase = createAdminClient()
  if (!supabase) return
  const p = normalizarPhone(phone)
  if (p.length < 10) return
  await supabase.from(TABLE).delete().eq('phone', p)
}

/** TLDs comuns válidos (extensões de domínio). */
const TLD_VALIDOS = new Set([
  'com', 'com.br', 'br', 'net', 'org', 'io', 'co', 'app', 'dev', 'edu', 'gov',
  'info', 'biz', 'me', 'tv', 'cc', 'ws', 'online', 'digital', 'tech', 'cloud'
])

/** Erros comuns de digitação no final do email (domínio). */
const TYPOS_TLD: Record<string, string> = {
  'come': 'com',
  'con': 'com',
  'cpm': 'com',
  'comm': 'com',
  'comn': 'com',
  'coom': 'com',
  'vom': 'com',
  'cok': 'com',
  'combr': 'com.br',
  'comr': 'com.br',
  'com.bt': 'com.br',
  'gmial': 'gmail',
  'gmal': 'gmail',
  'gmai': 'gmail',
  'gmailcom': 'gmail.com',
  'hotmal': 'hotmail',
  'hotmial': 'hotmail',
  'hotmai': 'hotmail',
  'yahooo': 'yahoo',
  'yaho': 'yahoo',
}

/** Valida formato básico de e-mail. */
export function isValidEmail(email: string): boolean {
  const trimmed = (email || '').trim().toLowerCase()
  if (trimmed.length < 5) return false
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false
  const parts = trimmed.split('@')
  const domain = parts[1] || ''
  const tld = domain.split('.').pop()?.toLowerCase() || ''
  const secondLevel = domain.split('.').slice(-2)[0]?.toLowerCase() || ''
  const fullTld = secondLevel && tld ? `${secondLevel}.${tld}` : tld
  if (TLD_VALIDOS.has(tld) || TLD_VALIDOS.has(fullTld)) return true
  return !Object.keys(TYPOS_TLD).some((typo) => domain.endsWith(typo) || domain.includes('.' + typo))
}

export type EmailValidationResult = { valid: true } | { valid: false; hint: string }

/**
 * Verifica se o email parece correto. Se detectar erro comum (ex: .come em vez de .com),
 * retorna valid: false e uma dica para o usuário corrigir.
 */
export function validateEmailWithHint(email: string): EmailValidationResult {
  const trimmed = (email || '').trim().toLowerCase()
  if (trimmed.length < 5) {
    return { valid: false, hint: 'Email muito curto. Exemplo: seu@email.com' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, hint: 'Formato inválido. Use algo como: nome@email.com' }
  }
  const parts = trimmed.split('@')
  const domain = (parts[1] || '').toLowerCase()
  const tld = domain.split('.').pop() || ''
  const secondLevel = domain.split('.').slice(-2)[0] || ''

  // Detectar typo conhecido no TLD ou no domínio
  for (const [typo, correto] of Object.entries(TYPOS_TLD)) {
    if (domain.endsWith('.' + typo) || domain === typo) {
      const sugestao = domain.replace(new RegExp(typo + '$'), correto)
      return {
        valid: false,
        hint: `Parece que há um erro no email (ex: "${typo}" em vez de "${correto}"). Verifique e me envie de novo. Ex: ${parts[0]}@${sugestao}`,
      }
    }
    if (domain.includes('.' + typo + '.') || domain.endsWith(typo)) {
      const sugestao = domain.replace(typo, correto)
      return {
        valid: false,
        hint: `Parece que há um erro no email. Verifique (ex: "${typo}" → "${correto}"). Ex: ${parts[0]}@${sugestao}`,
      }
    }
  }

  // TLD inexistente ou muito estranho
  const fullTld = secondLevel && tld ? `${secondLevel}.${tld}` : tld
  if (!TLD_VALIDOS.has(tld) && !TLD_VALIDOS.has(fullTld)) {
    const sugestaoTld = tld === 'come' ? 'com' : TYPOS_TLD[tld] || 'com'
    return {
      valid: false,
      hint: `O final do email (".${tld}") parece incorreto. Talvez seja ".${sugestaoTld}"? Ex: seu@email.${sugestaoTld}`,
    }
  }

  return { valid: true }
}

/** Valida nome (mínimo 2 caracteres; letras, espaços, acentos, hífen, apóstrofo). */
export function isValidNome(nome: string): boolean {
  const trimmed = (nome || '').trim()
  if (trimmed.length < 2) return false
  return /^[a-záàâãéêíóôõúç\s\-']+$/i.test(trimmed)
}
