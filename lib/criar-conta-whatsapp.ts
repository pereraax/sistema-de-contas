/**
 * Lógica compartilhada para criar conta a partir do fluxo WhatsApp (nome + email).
 * Usado pela API /api/auth/criar-conta-whatsapp e pelo webhook Z-API.
 */

import { signUp } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

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

  const password = randomBytes(32).toString('hex')

  const result = await signUp(
    emailTrim,
    password,
    nomeTrim,
    phoneNorm,
    phoneNorm,
    'teste'
  )

  if (result.error) {
    const msg = result.error.toLowerCase()
    const emailJaCadastrado =
      msg.includes('já está cadastrado') ||
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      msg.includes('email already')

    if (emailJaCadastrado) {
      // Vincular o WhatsApp à conta existente para o assistente poder avisar quando o email for confirmado
      const supabaseAdmin = createAdminClient()
      if (supabaseAdmin) {
        try {
          const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
          const existingUser = usersData?.users?.find((u: { email?: string }) => (u.email ?? '').toLowerCase() === emailTrim)
          if (existingUser?.id) {
            await supabaseAdmin.from('whatsapp_sessions').upsert(
              {
                phone_number: phoneNorm,
                user_id: existingUser.id,
                plen_activated: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'phone_number' }
            )
            await supabaseAdmin.from('profiles').update({
              whatsapp: phoneNorm,
              telefone: phoneNorm,
              nome: nomeTrim,
              updated_at: new Date().toISOString(),
            }).eq('id', existingUser.id)
            return { success: true, emailEnviado: false }
          }
        } catch (e) {
          console.warn('[criar-conta-whatsapp] Erro ao vincular WhatsApp a conta existente:', e)
        }
      }
      return { success: false, error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' }
    }
    return { success: false, error: result.error || 'Erro ao criar conta.' }
  }

  const userId = result.data?.user?.id
  if (!userId) {
    return { success: false, error: 'Conta criada mas não foi possível vincular o WhatsApp. Entre em contato com o suporte.' }
  }

  const supabaseAdmin = createAdminClient()
  if (supabaseAdmin) {
    await supabaseAdmin.from('whatsapp_sessions').upsert(
      {
        phone_number: phoneNorm,
        user_id: userId,
        plen_activated: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone_number' }
    )
    // Garantir que o perfil existe com a flag (upsert: cria se não existir, atualiza se existir)
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
  }

  return { success: true, emailEnviado: result.emailEnviado ?? true }
}
