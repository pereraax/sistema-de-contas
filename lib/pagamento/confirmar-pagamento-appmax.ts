import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/mailer'

function maskEmail(email?: string | null) {
  const e = (email || '').trim()
  if (!e.includes('@')) return '(sem-email)'
  const [user, domain] = e.split('@')
  const safeUser = (user || '').slice(0, 2) + '***'
  return `${safeUser}@${domain}`
}

/**
 * Ativa o plano e envia e-mail de boas-vindas para pagamento via Appmax (checkout externo).
 * Usa o e-mail do pedido para localizar/criar vínculo com o profile.
 */
export async function confirmarPagamentoAppmax(params: {
  email: string
  nome?: string | null
  orderId: string
  paymentMethod?: string | null
  status?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const emailNorm = (params.email || '').trim().toLowerCase()
    if (!emailNorm) return { ok: false, error: 'Email obrigatório' }

    const admin = createAdminClient()
    if (!admin) return { ok: false, error: 'Admin client indisponível' }

    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, nome, plano_status')
      .eq('email', emailNorm)
      .maybeSingle()

    if (!profile?.id) {
      return { ok: false, error: 'Perfil não encontrado para email' }
    }

    const alreadyActive = profile.plano_status === 'ativo'
    console.log('[confirmar-pagamento-appmax] ativando plano', {
      orderId: params.orderId,
      email: maskEmail(emailNorm),
      alreadyActive,
      status: params.status ?? null,
      paymentMethod: params.paymentMethod ?? null,
    })

    await admin
      .from('profiles')
      .update({
        plano: 'premium',
        plano_status: 'ativo',
        plano_data_inicio: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (profile.email && !alreadyActive) {
      try {
        console.log('[confirmar-pagamento-appmax] enviando email de boas-vindas', {
          orderId: params.orderId,
          email: maskEmail(profile.email),
        })
        const nome = (profile.nome || params.nome || '').trim() || 'Assinante'
        const siteUrl = 'https://plenipay.com'
        const loginUrl = `${siteUrl}/auth/login`
        const html = `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #0f172a;">Pagamento concluído – Bem-vindo(a) ao Plenipay!</h2>
            <p>Olá, <strong>${nome}</strong>!</p>
            <p>Seu pagamento foi confirmado. Sua conta já está ativa e você pode usar todos os benefícios do assistente financeiro.</p>
            <p><strong>Acesse sua conta:</strong></p>
            <p style="margin: 16px 0;">
              <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Acessar plenipay.com</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">Ou acesse diretamente: <a href="${loginUrl}">${siteUrl}</a></p>
            <p>Use o e-mail <strong>${profile.email}</strong> para entrar. Se ainda não definiu uma senha, use "Esqueci minha senha" na tela de login.</p>
          </div>
        `
        await sendMail({
          to: profile.email,
          subject: 'Pagamento concluído – Acesse sua conta no Plenipay',
          html,
        })
        console.log('[confirmar-pagamento-appmax] email enviado', {
          orderId: params.orderId,
          email: maskEmail(profile.email),
        })
      } catch (err: any) {
        console.error('[confirmar-pagamento-appmax] Erro ao enviar email:', err?.message)
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[confirmar-pagamento-appmax] Erro:', err?.message ?? err)
    return { ok: false, error: err?.message }
  }
}

