/**
 * PLEN — Criação de usuário e envio de código por email (cadastro via WhatsApp)
 * Usa Supabase Auth: signUp envia email com código (template Magic Link com {{ .Token }}).
 */

import { createPublicClient } from '@/lib/supabase/server'

function randomPassword(): string {
  return `Plen${Date.now()}${Math.random().toString(36).slice(2, 14)}!`
}

/**
 * Cria usuário no Supabase Auth com email e envia código por email.
 * Supabase envia o email (template Magic Link com {{ .Token }} = 6 dígitos).
 * Retorna { success: true } ou { success: false, error: string }.
 */
export async function createUserAndSendCode(
  email: string,
  nome: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createPublicClient()
  const password = randomPassword()

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { nome: nome.trim(), origem: 'whatsapp_plen' },
      emailRedirectTo: undefined,
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes('already') ||
      msg.includes('already registered') ||
      msg.includes('duplicate') ||
      msg.includes('já está')
    ) {
      return { success: false, error: 'Este email já está cadastrado. Faça login ou use outro email.' }
    }
    return { success: false, error: error.message }
  }

  if (!data?.user) {
    return { success: false, error: 'Não foi possível criar a conta.' }
  }

  return { success: true }
}

/**
 * Verifica código OTP (6 dígitos) para o email.
 * Retorna { success: true } ou { success: false, error: string }.
 */
export async function verifyCodeForPlen(
  code: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const cleaned = code.replace(/\D/g, '').trim().slice(0, 6)
  if (cleaned.length !== 6) {
    return { success: false, error: 'Código deve ter 6 dígitos.' }
  }

  const supabase = createPublicClient()

  const types: ('signup' | 'email')[] = ['signup', 'email']
  for (const type of types) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: cleaned,
      type,
    })
    if (!error && data?.user) return { success: true }
  }

  return { success: false, error: 'Código inválido ou expirado. Verifique e tente novamente.' }
}
