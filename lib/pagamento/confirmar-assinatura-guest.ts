/**
 * Ativa o plano e envia e-mail de boas-vindas para assinatura guest (checkout sem login).
 * Usado por status-guest (polling) e webhook Asaas (PAYMENT_RECEIVED).
 */
import { createAdminClient } from '@/lib/supabase/server'
import { buscarAssinaturaAsaas } from '@/lib/asaas'
import { sendMail } from '@/lib/mailer'

export async function confirmarAssinaturaGuest(subscriptionId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const subscription = await buscarAssinaturaAsaas(subscriptionId)
    const userId = subscription?.externalReference
    if (!userId) {
      return { ok: false, error: 'Assinatura sem externalReference' }
    }

    const admin = createAdminClient()
    if (!admin) {
      return { ok: false, error: 'Admin client indisponível' }
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, nome, plano_status')
      .eq('id', userId)
      .single()

    const alreadyActive = profile?.plano_status === 'ativo'

    await admin
      .from('profiles')
      .update({
        plano: 'premium',
        plano_status: 'ativo',
        asaas_subscription_id: subscriptionId,
        plano_data_inicio: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profile?.email && !alreadyActive) {
      try {
        const nome = (profile.nome || '').trim() || 'Assinante'
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
            <p>Qualquer dúvida, estamos à disposição. Bom uso! 🎉</p>
          </div>
        `
        await sendMail({
          to: profile.email,
          subject: 'Pagamento concluído – Acesse sua conta no Plenipay',
          html,
        })
      } catch (err: any) {
        console.error('[confirmar-assinatura-guest] Erro ao enviar email:', err?.message)
      }
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[confirmar-assinatura-guest] Erro:', err?.message)
    return { ok: false, error: err?.message }
  }
}
