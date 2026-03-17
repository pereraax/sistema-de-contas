import { createAdminClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/mailer'

function maskEmail(email?: string | null) {
  const e = (email || '').trim()
  if (!e.includes('@')) return '(sem-email)'
  const [user, domain] = e.split('@')
  const safeUser = (user || '').slice(0, 2) + '***'
  return `${safeUser}@${domain}`
}

export async function ativarPlanoPremiumEEnviarEmail(params: {
  userId: string
  fonte: string
  referenceId?: string | null
}): Promise<{ ok: boolean; alreadyActive?: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    if (!admin) return { ok: false, error: 'Admin client indisponível' }

    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, nome, plano_status')
      .eq('id', params.userId)
      .single()

    const alreadyActive = profile?.plano_status === 'ativo'

    await admin
      .from('profiles')
      .update({
        plano: 'premium',
        plano_status: 'ativo',
        plano_data_inicio: new Date().toISOString(),
      })
      .eq('id', params.userId)

    console.log('[ativar-plano] ok', {
      fonte: params.fonte,
      referenceId: params.referenceId ?? null,
      userId: params.userId.slice(0, 8) + '...',
      email: maskEmail(profile?.email),
      alreadyActive,
    })

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
        console.log('[ativar-plano] email enviado', {
          fonte: params.fonte,
          referenceId: params.referenceId ?? null,
          email: maskEmail(profile.email),
        })
      } catch (err: any) {
        console.error('[ativar-plano] erro email:', err?.message)
      }
    }

    return { ok: true, alreadyActive }
  } catch (err: any) {
    console.error('[ativar-plano] erro:', err?.message ?? err)
    return { ok: false, error: err?.message }
  }
}

