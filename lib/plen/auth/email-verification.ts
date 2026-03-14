/**
 * PLEN — Criação de usuário e envio de código por email (cadastro via WhatsApp)
 *
 * Dois modos:
 * 1) SMTP do app configurado (SMTP_HOST, etc.): criamos o usuário com admin (sem enviar email),
 *    geramos código, guardamos em plen_email_otp e enviamos pelo nosso mailer. Na verificação
 *    confirmamos o email via admin.updateUserById.
 * 2) SMTP do app não configurado: usamos signUp/resend do Supabase (o email é enviado pelo
 *    Supabase — só funciona para qualquer destinatário se o SMTP estiver configurado no
 *    Dashboard do Supabase: Authentication → SMTP). Ver docs/CONFIGURAR-EMAIL-CODIGO-SUPABASE.md
 */

import { createPublicClient, createAdminClient } from '@/lib/supabase/server'
import { isSmtpConfigured, sendMail } from '@/lib/mailer'

const OTP_EXPIRY_MINUTES = 15
const OTP_LENGTH = 6

function randomPassword(): string {
  return `Plen${Date.now()}${Math.random().toString(36).slice(2, 14)}!`
}

function generateOtpCode(): string {
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * digits.length)]
  }
  return code
}

function otpExpiresAt(): Date {
  const d = new Date()
  d.setMinutes(d.getMinutes() + OTP_EXPIRY_MINUTES)
  return d
}

/** Mensagem genérica para o usuário quando o envio de email falha (nunca expor erro técnico SMTP no WhatsApp). */
const EMAIL_ENVIO_FALHOU_MSG =
  'Não foi possível enviar o email agora. Tente novamente em alguns minutos ou verifique se o email está correto. 💙'

/** Envia o código por email usando o SMTP do app. */
async function sendOtpEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendMail({
      to: email.trim().toLowerCase(),
      subject: 'Seu código de confirmação Plenipay',
      html: `
        <h2>Seu código de confirmação Plenipay</h2>
        <p>Use o código abaixo para confirmar seu e-mail no cadastro feito pelo WhatsApp:</p>
        <p style="font-size: 24px; letter-spacing: 4px;"><strong>${code}</strong></p>
        <p>Digite esse código na conversa do WhatsApp para a Plen confirmar sua conta.</p>
        <p>Este código expira em ${OTP_EXPIRY_MINUTES} minutos.</p>
      `.trim(),
    })
    return { success: true }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    const code = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : ''
    console.warn('[plen/email] Falha SMTP:', err, code ? `(código: ${code})` : '')
    return { success: false, error: EMAIL_ENVIO_FALHOU_MSG }
  }
}

/**
 * Cria usuário no Supabase Auth e envia código por email.
 * Se o app tiver SMTP configurado, o email é enviado pelo app (garantido). Caso contrário, usa Supabase (requer SMTP no Dashboard).
 */
export type CreateUserAndSendCodeResult = {
  success: boolean
  error?: string
  /** true quando o email já existe mas não estava confirmado; reenviamos o código e o fluxo deve pedir o código. */
  alreadyRegisteredNotConfirmed?: boolean
}

export async function createUserAndSendCode(
  email: string,
  nome: string
): Promise<CreateUserAndSendCodeResult> {
  const emailNorm = email.trim().toLowerCase()
  const password = randomPassword()

  if (isSmtpConfigured()) {
    const admin = createAdminClient()
    if (!admin) {
      console.error('[plen/email] SMTP configurado mas SUPABASE_SERVICE_ROLE_KEY ausente. Defina no painel da hospedagem (Railway/Vercel) para o email de confirmação ser enviado.')
      return { success: false, error: EMAIL_ENVIO_FALHOU_MSG }
    }
    {
      const now = new Date().toISOString()
      const { data: existingOtp } = await admin
        .from('plen_email_otp')
        .select('expires_at')
        .eq('email', emailNorm)
        .gt('expires_at', now)
        .maybeSingle()
      if (existingOtp) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[plen/email] Já existe código válido para', emailNorm, '— não envia outro email.')
        }
        return { success: true }
      }

      const { data: userData, error: createError } = await admin.auth.admin.createUser({
        email: emailNorm,
        password,
        email_confirm: false,
        user_metadata: { nome: nome.trim(), origem: 'whatsapp_plen' },
      })
      if (createError) {
        const msg = createError.message.toLowerCase()
        if (msg.includes('already') || msg.includes('registered') || msg.includes('duplicate') || msg.includes('já está')) {
          const { data: existingOtpRow } = await admin
            .from('plen_email_otp')
            .select('expires_at')
            .eq('email', emailNorm)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()
          if (existingOtpRow) {
            return { success: true }
          }
          // Email já cadastrado: verificar se foi confirmado; se não, reenviar código e informar
          const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
          const existingUser = list?.users?.find((u) => (u.email ?? '').toLowerCase() === emailNorm)
          if (existingUser && !existingUser.email_confirmed_at) {
            const userId = existingUser.id
            const code = generateOtpCode()
            const expiresAt = otpExpiresAt().toISOString()
            const { error: upsertErr } = await admin
              .from('plen_email_otp')
              .upsert({ email: emailNorm, code, user_id: userId, expires_at: expiresAt }, { onConflict: 'email' })
            if (upsertErr) {
              console.error('[plen/email] Erro ao salvar OTP (cadastrado não confirmado):', upsertErr.message)
              return { success: false, error: 'Erro ao gerar código. Tente novamente.' }
            }
            const sendResult = await sendOtpEmail(emailNorm, code)
            if (!sendResult.success) {
              return { success: false, error: sendResult.error ?? EMAIL_ENVIO_FALHOU_MSG }
            }
            if (process.env.NODE_ENV === 'development') {
              console.log('[plen/email] Email já cadastrado mas não confirmado — código reenviado para', emailNorm)
            }
            return { success: true, alreadyRegisteredNotConfirmed: true }
          }
          return { success: false, error: 'Este email já está cadastrado. Faça login ou use outro email.' }
        }
        return { success: false, error: createError.message }
      }
      const userId = userData?.user?.id
      if (!userId) return { success: false, error: 'Não foi possível criar a conta.' }

      const code = generateOtpCode()
      const expiresAt = otpExpiresAt().toISOString()
      const { error: insertError } = await admin
        .from('plen_email_otp')
        .upsert({ email: emailNorm, code, user_id: userId, expires_at: expiresAt }, { onConflict: 'email' })
      if (insertError) {
        console.error('[plen/email] Erro ao salvar OTP:', insertError.message)
        return { success: false, error: 'Erro ao gerar código. Tente novamente.' }
      }

      // Evitar enviar 2+ emails em requisições concorrentes: só envia se o código no DB ainda for o nosso
      const { data: rowAposUpsert } = await admin
        .from('plen_email_otp')
        .select('code')
        .eq('email', emailNorm)
        .maybeSingle()
      if (rowAposUpsert && String(rowAposUpsert.code).trim() !== String(code).trim()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[plen/email] Outra requisição já enviou código para', emailNorm, '— não envia outro.')
        }
        return { success: true }
      }

      const sendResult = await sendOtpEmail(emailNorm, code)
      if (!sendResult.success) {
        return { success: false, error: sendResult.error ?? EMAIL_ENVIO_FALHOU_MSG }
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('[plen/email] Código enviado via SMTP do app para', emailNorm)
      }
      return { success: true }
    }
  }

  const supabase = createPublicClient()
  const redirectTo =
    typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' && process.env.NEXT_PUBLIC_SITE_URL.trim()
      ? process.env.NEXT_PUBLIC_SITE_URL.trim()
      : typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL.trim()
        ? process.env.NEXT_PUBLIC_APP_URL.trim()
        : undefined

  const { data, error } = await supabase.auth.signUp({
    email: emailNorm,
    password,
    options: {
      data: { nome: nome.trim(), origem: 'whatsapp_plen' },
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already') || msg.includes('already registered') || msg.includes('duplicate') || msg.includes('já está')) {
      return { success: false, error: 'Este email já está cadastrado. Faça login ou use outro email.' }
    }
    return { success: false, error: error.message }
  }
  if (!data?.user) return { success: false, error: 'Não foi possível criar a conta.' }
  if (process.env.NODE_ENV === 'development') {
    console.log('[plen/email] signUp ok para', emailNorm, '— Se o lead NÃO receber, configure SMTP no Supabase ou no app (SMTP_*).')
  }
  return { success: true }
}

/**
 * Verifica código OTP (6 dígitos) para o email.
 * Primeiro tenta o código enviado pelo app (plen_email_otp); depois Supabase verifyOtp.
 * Em caso de sucesso, retorna user_id para permitir upsert do profile (email, nome, telefone) no painel admin.
 */
export async function verifyCodeForPlen(
  code: string,
  email: string
): Promise<{ success: boolean; error?: string; user_id?: string }> {
  const cleaned = code.replace(/\D/g, '').trim().slice(0, 6)
  if (cleaned.length !== 6) {
    return { success: false, error: 'Código deve ter 6 dígitos.' }
  }
  const emailNorm = email.trim().toLowerCase()

  const admin = createAdminClient()
  if (admin) {
    const { data: row, error: fetchError } = await admin
      .from('plen_email_otp')
      .select('user_id')
      .eq('email', emailNorm)
      .eq('code', cleaned)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (!fetchError && row?.user_id) {
      const { error: updateError } = await admin.auth.admin.updateUserById(row.user_id, { email_confirm: true })
      if (updateError) return { success: false, error: updateError.message }
      await admin.from('plen_email_otp').delete().eq('email', emailNorm)
      return { success: true, user_id: row.user_id }
    }
  }

  const supabase = createPublicClient()
  const types: ('signup' | 'email')[] = ['signup', 'email']
  for (const type of types) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: emailNorm,
      token: cleaned,
      type,
    })
    if (!error && data?.user) return { success: true, user_id: data.user.id }
  }
  return { success: false, error: 'Código inválido ou expirado. Verifique e tente novamente.' }
}

/**
 * Atualiza o profile do usuário (auth) com email, nome e telefone do contato CRM.
 * Assim o painel admin mostra email e contato para quem se cadastrou via WhatsApp.
 */
export async function upsertProfileFromPlenContact(
  userId: string,
  data: { email: string; nome: string | null; telefone: string }
): Promise<{ error?: string }> {
  const admin = createAdminClient()
  if (!admin) return { error: 'Admin client indisponível' }
  const email = data.email.trim().toLowerCase()
  const nome = (data.nome ?? '').trim() || null
  const telefone = (data.telefone ?? '').replace(/\D/g, '').trim() || null
  const { error } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: email || null,
        nome: nome || null,
        telefone: telefone || null,
        whatsapp: telefone || null,
        plano: 'teste',
        precisa_definir_senha: true,
      },
      { onConflict: 'id' }
    )
  if (error) return { error: error.message }
  return {}
}

/**
 * Reenvia o email com código.
 * Se o app tiver SMTP: atualiza/cria registro em plen_email_otp e envia pelo mailer. Caso contrário, usa Supabase resend.
 */
export async function resendCodeForPlen(email: string): Promise<{ success: boolean; error?: string }> {
  const emailNorm = email.trim().toLowerCase()

  if (isSmtpConfigured()) {
    const admin = createAdminClient()
    if (!admin) {
      console.error('[plen/email] SMTP configurado mas SUPABASE_SERVICE_ROLE_KEY ausente — reenvio não disponível.')
      return { success: false, error: EMAIL_ENVIO_FALHOU_MSG }
    }
    {
      const { data: existing } = await admin.from('plen_email_otp').select('user_id').eq('email', emailNorm).maybeSingle()
      let userId: string | null = existing?.user_id ?? null
      if (!userId) {
        const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
        const user = list?.users?.find((u) => (u.email ?? '').toLowerCase() === emailNorm)
        userId = user?.id ?? null
      }
      if (!userId) {
        return { success: false, error: 'Email não encontrado. Informe o mesmo email usado no cadastro.' }
      }
      const code = generateOtpCode()
      const expiresAt = otpExpiresAt().toISOString()
      const { error: upsertError } = await admin
        .from('plen_email_otp')
        .upsert({ email: emailNorm, code, user_id: userId, expires_at: expiresAt }, { onConflict: 'email' })
      if (upsertError) return { success: false, error: 'Erro ao gerar novo código.' }
      const sendResult = await sendOtpEmail(emailNorm, code)
      if (!sendResult.success) {
        console.warn('[plen/email] Falha ao reenviar código SMTP:', emailNorm)
        return { success: false, error: EMAIL_ENVIO_FALHOU_MSG }
      }
      if (process.env.NODE_ENV === 'development') console.log('[plen/email] Código reenviado via SMTP para', emailNorm)
      return { success: true }
    }
  }

  const supabase = createPublicClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email: emailNorm })
  if (error) {
    console.warn('[plen/email] Falha resend Supabase:', emailNorm, error.message)
    return { success: false, error: error.message }
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('[plen/email] resend (Supabase) ok para', emailNorm)
  }
  return { success: true }
}
