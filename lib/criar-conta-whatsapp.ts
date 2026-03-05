/**
 * Lógica compartilhada para criar conta a partir do fluxo WhatsApp (nome + email).
 * Usado pela API /api/auth/criar-conta-whatsapp e pelo webhook Z-API.
 *
 * Cadastro pelo WhatsApp: envio de CÓDIGO de 6 dígitos por email; usuário digita o código na conversa para confirmar.
 * Cadastro pelo site: continua com link de confirmação normal (signUp em auth.ts).
 */

import { createAdminClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { generateAndSendEmailCode } from '@/lib/whatsapp-email-code'

function normalizarPhone(phone: string): string {
  const limpo = String(phone || '').replace(/\D/g, '')
  return limpo.length >= 10 ? (limpo.startsWith('55') ? limpo : `55${limpo}`) : limpo
}

export type CriarContaWhatsAppResult =
  | { success: true; emailEnviado?: boolean }
  | { success: false; error: string }

export async function criarContaFromWhatsApp(
  nome: string,
  email: string,
  phone: string
): Promise<CriarContaWhatsAppResult> {
  const nomeTrim = (nome ?? '').trim()
  const emailTrim = (email ?? '').trim().toLowerCase()
  const phoneNorm = normalizarPhone(phone ?? '')

  if (!nomeTrim || nomeTrim.length < 2) {
    return { success: false, error: 'Nome inválido.' }
  }
  if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
    return { success: false, error: 'E-mail inválido.' }
  }
  if (phoneNorm.length < 10) {
    return { success: false, error: 'Número de WhatsApp inválido.' }
  }

  const supabaseAdmin = createAdminClient()
  if (!supabaseAdmin) {
    return { success: false, error: 'Serviço indisponível. Tente mais tarde.' }
  }

  const password = randomBytes(32).toString('hex')

  // Verificar se já existe usuário com este email
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = usersData?.users?.find((u: { email?: string }) => (u.email ?? '').toLowerCase() === emailTrim)

  let userId: string | undefined

  if (existingUser) {
    if ((existingUser as { email_confirmed_at?: string | null }).email_confirmed_at) {
      return { success: false, error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' }
    }
    userId = existingUser.id
  } else {
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailTrim,
      password,
      email_confirm: false,
      user_metadata: {
        nome: nomeTrim,
        telefone: phoneNorm,
        whatsapp: phoneNorm,
        plano: 'teste',
        email: emailTrim,
      },
    })

    if (createError) {
      const msg = (createError.message || '').toLowerCase()
      if (
        msg.includes('already') ||
        msg.includes('exists') ||
        msg.includes('registered') ||
        msg.includes('duplicate')
      ) {
        const { data: listAgain } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const again = listAgain?.users?.find((u: { email?: string }) => (u.email ?? '').toLowerCase() === emailTrim)
        if (again && !(again as { email_confirmed_at?: string | null }).email_confirmed_at) {
          userId = again.id
        } else if (again?.id) {
          return { success: false, error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' }
        } else {
          return { success: false, error: createError.message || 'Erro ao criar conta.' }
        }
      } else {
        console.error('[criar-conta-whatsapp] createUser falhou:', createError.message)
        return { success: false, error: createError.message || 'Erro ao criar conta.' }
      }
    } else if (createData?.user?.id) {
      userId = createData.user.id
    } else {
      return { success: false, error: 'Conta não foi criada. Tente novamente.' }
    }
  }

  if (!userId) {
    return { success: false, error: 'Conta criada mas não foi possível vincular o WhatsApp. Entre em contato com o suporte.' }
  }

  await supabaseAdmin.from('whatsapp_sessions').upsert(
    {
      phone_number: phoneNorm,
      user_id: userId,
      plen_activated: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone_number' }
  )
  await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email: emailTrim,
      nome: nomeTrim,
      telefone: phoneNorm,
      whatsapp: phoneNorm,
      plano: 'teste',
      precisa_definir_senha: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  const codeResult = await generateAndSendEmailCode(userId, emailTrim, phoneNorm, nomeTrim)
  return {
    success: true,
    emailEnviado: codeResult.success,
  }
}
