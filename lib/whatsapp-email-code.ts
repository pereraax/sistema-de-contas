/**
 * Confirmação de email por código no cadastro via WhatsApp.
 * Usuário recebe um código de 6 dígitos por email e digita na conversa; o sistema verifica e marca o email como confirmado.
 * O site continua usando o link de confirmação normal (signUp + link no email).
 */

import { createAdminClient } from '@/lib/supabase/server'
import { sendMail, isSmtpConfigured, isResendConfigured } from '@/lib/mailer'
import { randomInt } from 'crypto'

const CODE_LENGTH = 6
const CODE_EXPIRY_MINUTES = 15

function normalizarPhone(phone: string): string {
  const limpo = String(phone ?? '').replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}

/** Gera código numérico de 6 dígitos. */
function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(CODE_LENGTH, '0')
}

/**
 * Gera um código, salva na tabela email_confirm_codes e envia por email.
 * Usado após criar o usuário via Admin API (cadastro WhatsApp).
 */
export async function generateAndSendEmailCode(
  userId: string,
  email: string,
  phone: string,
  nome: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  if (!supabase) return { success: false, error: 'Serviço indisponível.' }

  const phoneNorm = normalizarPhone(phone)
  if (phoneNorm.length < 10) return { success: false, error: 'Telefone inválido.' }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

  const { error: insertError } = await supabase.from('email_confirm_codes').insert({
    user_id: userId,
    code,
    phone: phoneNorm,
    expires_at: expiresAt.toISOString(),
  })

  if (insertError) {
    console.error('[whatsapp-email-code] Erro ao salvar código:', insertError.message)
    return { success: false, error: 'Erro ao gerar código.' }
  }

  const hasMail = isSmtpConfigured() || isResendConfigured()
  if (!hasMail) {
    console.warn('[whatsapp-email-code] SMTP/Resend não configurado — código não enviado:', code)
    return { success: true } // código salvo; envio falhou por config
  }

  const nomeExibir = (nome || '').trim().slice(0, 50) || 'usuário'
  const subject = 'Seu código de confirmação Plenipay'
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 16px;">
  <p>Olá, ${nomeExibir}!</p>
  <p>Use o código abaixo para confirmar seu e-mail no cadastro feito pelo WhatsApp:</p>
  <p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; margin: 24px 0;">${code}</p>
  <p style="color: #666;">Digite esse código na conversa do WhatsApp que a Plen vai confirmar sua conta.</p>
  <p style="color: #666;">O código vale por ${CODE_EXPIRY_MINUTES} minutos. Se não foi você quem pediu, ignore este e-mail.</p>
  <p>— Equipe Plenipay</p>
</body>
</html>`

  try {
    await sendMail({ to: email, subject, html })
    return { success: true }
  } catch (err: any) {
    console.error('[whatsapp-email-code] Erro ao enviar email:', err?.message)
    return { success: false, error: err?.message || 'Erro ao enviar email.' }
  }
}

/**
 * Verifica o código digitado pelo usuário no WhatsApp.
 * Se válido e não expirado, marca o email como confirmado no Supabase e remove o código.
 */
export async function verifyEmailCode(
  phone: string,
  codeRaw: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = createAdminClient()
  if (!supabase) return { success: false, error: 'Serviço indisponível.' }

  const phoneNorm = normalizarPhone(phone)
  const code = String(codeRaw ?? '').replace(/\D/g, '').slice(0, CODE_LENGTH)
  if (code.length !== CODE_LENGTH) return { success: false, error: 'Código deve ter 6 dígitos.' }

  const { data: row, error: selectError } = await supabase
    .from('email_confirm_codes')
    .select('id, user_id, expires_at')
    .eq('code', code)
    .eq('phone', phoneNorm)
    .maybeSingle()

  if (selectError || !row) {
    return { success: false, error: 'Código inválido ou expirado.' }
  }

  const expiresAt = new Date((row as { expires_at: string }).expires_at)
  if (expiresAt <= new Date()) {
    await supabase.from('email_confirm_codes').delete().eq('id', (row as { id: string }).id)
    return { success: false, error: 'Código expirado. Peça um novo código.' }
  }

  const userId = (row as { user_id: string }).user_id

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })

  if (updateError) {
    console.error('[whatsapp-email-code] Erro ao confirmar email:', updateError.message)
    return { success: false, error: 'Erro ao confirmar. Tente de novo.' }
  }

  await supabase.from('email_confirm_codes').delete().eq('id', (row as { id: string }).id)
  return { success: true, userId }
}
