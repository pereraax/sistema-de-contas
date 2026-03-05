/**
 * Confirmação de email por código no cadastro via WhatsApp.
 * O código de 6 dígitos é enviado e verificado pelo SUPABASE AUTH (signInWithOtp + verifyOtp).
 * Nada de Resend nem SMTP no app: configure o SMTP no Dashboard do Supabase (Authentication → SMTP)
 * e use o template "Magic Link" com {{ .Token }} para mostrar o código no email.
 */

import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'

const CODE_LENGTH = 6

function normalizarPhone(phone: string): string {
  const limpo = String(phone ?? '').replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  return createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } })
}

/**
 * Pede ao Supabase Auth para enviar o código por email (OTP).
 * O email é enviado pelo Supabase (configure SMTP em Authentication → SMTP no Dashboard).
 * No template "Magic Link", use {{ .Token }} para exibir o código de 6 dígitos.
 */
export async function generateAndSendEmailCode(
  _userId: string,
  email: string,
  _phone: string,
  _nome: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseAuthClient()
  if (!supabase) return { success: false, error: 'Serviço indisponível.' }

  const emailTrim = (email ?? '').trim().toLowerCase()
  if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
    return { success: false, error: 'E-mail inválido.' }
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: emailTrim,
      options: { shouldCreateUser: false },
    })
    if (error) {
      console.error('[whatsapp-email-code] signInWithOtp falhou:', error.message)
      return { success: false, error: error.message }
    }
    console.log('[whatsapp-email-code] Código enviado pelo Supabase para', emailTrim)
    return { success: true }
  } catch (err: any) {
    console.error('[whatsapp-email-code] Erro ao enviar código:', err?.message)
    return { success: false, error: err?.message || 'Erro ao enviar código.' }
  }
}

/**
 * Verifica o código digitado pelo usuário no WhatsApp usando Supabase Auth (verifyOtp).
 * Marca o email como confirmado no Supabase.
 * Tenta várias variantes do token (primeiros 6, últimos 6, 8 dígitos) para cobrir códigos de 6 ou 8 dígitos.
 */
export async function verifyEmailCode(
  phone: string,
  codeRaw: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const admin = createAdminClient()
  if (!admin) return { success: false, error: 'Serviço indisponível.' }

  const phoneNorm = normalizarPhone(phone)
  const digits = String(codeRaw ?? '').replace(/\D/g, '')
  if (digits.length < 6) return { success: false, error: 'Código deve ter pelo menos 6 dígitos.' }

  // Variantes do token: Supabase envia 6 dígitos; usuário pode digitar 6 ou 8 (e-mail pode mostrar 8 em alguns casos)
  const tokensToTry: string[] = []
  if (digits.length >= 6) tokensToTry.push(digits.slice(0, 6))
  if (digits.length === 8) {
    tokensToTry.push(digits.slice(-6))
    tokensToTry.push(digits)
  }

  // Obter email do usuário pelo phone (whatsapp_sessions → user_id → auth.users)
  const { data: session } = await admin.from('whatsapp_sessions').select('user_id').eq('phone_number', phoneNorm).maybeSingle()
  if (!session?.user_id) return { success: false, error: 'Código inválido ou expirado.' }

  const { data: userData } = await admin.auth.admin.getUserById(session.user_id)
  const email = (userData?.user?.email ?? '').trim()
  if (!email) return { success: false, error: 'Código inválido ou expirado.' }

  const supabase = getSupabaseAuthClient()
  if (!supabase) return { success: false, error: 'Serviço indisponível.' }

  const tryVerify = async (token: string, type: 'email' | 'signup') => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type })
    return { data, error }
  }

  let lastError: string | null = null
  for (const token of tokensToTry) {
    for (const otpType of ['email', 'signup'] as const) {
      try {
        const { data, error } = await tryVerify(token, otpType)
        if (!error && data?.user) {
          await admin.auth.admin.updateUserById(session.user_id, { email_confirm: true }).catch(() => {})
          return { success: true, userId: session.user_id }
        }
        if (error) lastError = error.message
      } catch (err: any) {
        lastError = err?.message ?? null
      }
    }
  }

  console.warn('[whatsapp-email-code] verifyOtp falhou para todos os tokens. Último erro:', lastError, 'email:', email, 'tokens tentados:', tokensToTry.length)

  const msgExpired = lastError && /expir|otp_expired|invalid.*token|token.*expired/i.test(lastError)
  if (msgExpired) {
    return { success: false, error: 'O código expirou. Toque em "Reenviar código" para receber um novo no seu e-mail.' }
  }
  return {
    success: false,
    error: 'Código inválido. Use o código do e-mail mais recente (o último que você recebeu) ou toque em "Reenviar código" para receber um novo.',
  }
}
