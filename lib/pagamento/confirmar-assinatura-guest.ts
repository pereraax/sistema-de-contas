/**
 * Checkout guest (sem criar cadastro antes do pagamento).
 *
 * Fluxo desejado:
 * 1) checkout-guest cria assinatura no Asaas (sem criar Supabase user/profile)
 * 2) Asaas confirma pagamento (webhook ou polling)
 * 3) aqui registramos a confirmação por `subscriptionId` e por `email` e enviamos e-mail imediato
 * 4) quando o usuário cadastrar no `/cadastro`, o signUp ativa automaticamente o plano básico
 */
import { createAdminClient } from '@/lib/supabase/server'
import { buscarAssinaturaAsaas, buscarPagamentoAsaas, buscarCustomerAsaas } from '@/lib/asaas'
import { sendMail } from '@/lib/mailer'

function maskEmail(email?: string | null) {
  const e = (email || '').trim()
  if (!e.includes('@')) return '(sem-email)'
  const [user, domain] = e.split('@')
  const safeUser = (user || '').slice(0, 2) + '***'
  return `${safeUser}@${domain}`
}

function isEmailLike(v: unknown): v is string {
  return typeof v === 'string' && v.includes('@') && v.includes('.')
}

function baseUrlForLinks() {
  // Para testes locais, NEXT_PUBLIC_SITE_URL já fica em localhost.
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://plenipay.com'
}

const PLANO_GUEST_KEY: 'basico' = 'basico'

/**
 * Checkout guest só com cobrança PIX avulsa (id `pay_...`, sem assinatura Asaas).
 */
export async function confirmarPagamentoPixGuest(
  paymentId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const payment = await buscarPagamentoAsaas(paymentId)
    let email: string | null = null
    const ref = payment?.externalReference
    if (isEmailLike(ref)) {
      email = String(ref).trim().toLowerCase()
    }
    if (!email && payment?.customer) {
      try {
        const cust = await buscarCustomerAsaas(String(payment.customer))
        const em = cust?.email
        if (typeof em === 'string' && em.includes('@')) email = em.trim().toLowerCase()
      } catch {
        // ignora
      }
    }
    if (!email) {
      return { ok: false, error: 'Não foi possível obter email da cobrança PIX' }
    }

    const admin = createAdminClient()
    if (!admin) return { ok: false, error: 'Admin client indisponível' }

    const nome = 'Assinante'
    let alreadyActive = false

    // Cache de confirmação (não deve bloquear o e-mail).
    // A migration atual pode não ter colunas `email/plano`, então tentamos com mais campos e
    // caímos para o mínimo sem impedir o fluxo.
    try {
      try {
        await admin.from('pagamento_webhook_confirmations').upsert(
          {
            subscription_id: paymentId,
            confirmed_at: new Date().toISOString(),
            email,
            plano: PLANO_GUEST_KEY,
          } as any,
          { onConflict: 'subscription_id' },
        )
      } catch (err: any) {
        // Fallback para schema minimalista (apenas subscription_id + confirmed_at).
        console.warn('[confirmar-pagamento-pix-guest] upsert cache fallback', {
          paymentId,
          error: err?.message ?? String(err),
        })
        await admin.from('pagamento_webhook_confirmations').upsert(
          { subscription_id: paymentId, confirmed_at: new Date().toISOString() },
          { onConflict: 'subscription_id' },
        )
      }
    } catch (err: any) {
      // Não bloqueia envio de e-mail.
      console.warn('[confirmar-pagamento-pix-guest] Falha ao gravar cache de confirmação', {
        paymentId,
        error: err?.message ?? String(err),
      })
    }

    try {
      const { data: profileByEmail } = await admin
        .from('profiles')
        .select('id, email, nome, plano_status')
        .eq('email', email)
        .maybeSingle()

      if (profileByEmail?.id) {
        const already = profileByEmail.plano_status === 'ativo'
        alreadyActive = already
        if (!already) {
          await admin
            .from('profiles')
            .update({
              plano: PLANO_GUEST_KEY,
              plano_status: 'ativo',
              asaas_subscription_id: paymentId,
              plano_data_inicio: new Date().toISOString(),
            })
            .eq('id', profileByEmail.id)
        }
      }
    } catch {
      // não bloqueia e-mail
    }

    try {
      const siteUrl = baseUrlForLinks()
      const cadastroUrl = `${siteUrl}/cadastro?plano=${PLANO_GUEST_KEY}&email=${encodeURIComponent(email)}`

      const html = `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Pagamento confirmado – Bem-vindo(a) ao Plenipay!</h2>
          <p>Olá, <strong>${nome}</strong>!</p>
          <p>Recebemos seu pagamento com sucesso. Seu acesso será liberado em instantes.</p>
          <p style="margin: 16px 0;">
            <a href="${cadastroUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Criar/ativar minha conta
            </a>
          </p>
          <p style="color:#64748b; font-size:14px;">
            Use o e-mail <strong>${email}</strong> para cadastrar/login.
          </p>
          <p>Se precisar, fale com a gente no suporte. Bom uso! 🎉</p>
        </div>
      `

      await sendMail({
        to: email,
        subject: 'Pagamento confirmado – Acesse sua conta no Plenipay',
        html,
      })
      console.log('[confirmar-pagamento-pix-guest] email enviado', {
        paymentId,
        email: maskEmail(email),
      })
    } catch (err: any) {
      console.error('[confirmar-pagamento-pix-guest] Erro preparando email:', err?.message ?? err)
    }

    console.log('[confirmar-pagamento-pix-guest] confirmado', {
      paymentId,
      email: maskEmail(email),
      alreadyActive,
    })

    return { ok: true }
  } catch (err: any) {
    console.error('[confirmar-pagamento-pix-guest] Erro:', err?.message ?? err)
    return { ok: false, error: err?.message ?? err }
  }
}

export async function confirmarAssinaturaGuest(
  subscriptionId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const subscription = await buscarAssinaturaAsaas(subscriptionId)
    const externalReference = subscription?.externalReference

    const admin = createAdminClient()
    if (!admin) return { ok: false, error: 'Admin client indisponível' }

    // Novo fluxo: externalReference é o email.
    // Compat: se externalReference vier como UUID (fluxo antigo), tratamos como userId.
    const hasEmailRef = isEmailLike(externalReference)
    const emailFromRef = hasEmailRef ? String(externalReference).trim().toLowerCase() : null
    const userIdFromRef = !hasEmailRef && externalReference ? String(externalReference) : null

    let email: string | null = emailFromRef
    let nome = 'Assinante'
    let alreadyActive = false

    let profileByIdOrEmail:
      | { id: string; email: string; nome: string | null; plano_status: string | null }
      | null = null

    // Se temos userId (fluxo antigo), buscamos profile.
    if (userIdFromRef) {
      const { data: p } = await admin
        .from('profiles')
        .select('id, email, nome, plano_status')
        .eq('id', userIdFromRef)
        .single()
      profileByIdOrEmail = p ?? null
      email = p?.email ? String(p.email).trim().toLowerCase() : email
      nome = (p?.nome || '').trim() || nome
      alreadyActive = p?.plano_status === 'ativo'
    }

    // Se ainda não temos email (fluxo antigo), tentamos buscar por email vindo da subscription não é possível;
    // então precisamos de profile.
    if (!email) {
      return { ok: false, error: 'Não foi possível obter email para confirmar pagamento' }
    }

    // 1) Registrar confirmação (para o cadastro ativar automaticamente depois).
    try {
      await admin.from('pagamento_webhook_confirmations').upsert(
        {
          subscription_id: subscriptionId,
          confirmed_at: new Date().toISOString(),
          email,
          plano: PLANO_GUEST_KEY,
        } as any,
        { onConflict: 'subscription_id' },
      )
    } catch (e) {
      // Compat para quando a migration ainda não tiver sido aplicada (colunas email/plano).
      await admin.from('pagamento_webhook_confirmations').upsert(
        { subscription_id: subscriptionId, confirmed_at: new Date().toISOString() },
        { onConflict: 'subscription_id' },
      )
    }

    // 2) Se o usuário já existir (profile criado antes), ativamos agora também.
    try {
      const { data: profileByEmail } = await admin
        .from('profiles')
        .select('id, email, nome, plano_status')
        .eq('email', email)
        .maybeSingle()

      if (profileByEmail?.id) {
        const already = profileByEmail.plano_status === 'ativo'
        alreadyActive = already
        nome = (profileByEmail.nome || '').trim() || nome
        if (!already) {
          await admin.from('profiles').update({
            plano: PLANO_GUEST_KEY,
            plano_status: 'ativo',
            asaas_subscription_id: subscriptionId,
            plano_data_inicio: new Date().toISOString(),
          }).eq('id', profileByEmail.id)
        }
      }
    } catch {
      // Se falhar, não impede o envio do e-mail.
    }

    // 3) Enviar e-mail imediato (não bloqueante).
    // Mesmo se já estiver ativo, enviamos apenas 1x por subscription porque a confirmação é registrada.
    // Aqui evitamos duplicar pelo cache: o status-guest/webhook só chama quando a tabela ainda não tem a linha.
    try {
      const siteUrl = baseUrlForLinks()
      const cadastroUrl = `${siteUrl}/cadastro?plano=${PLANO_GUEST_KEY}&email=${encodeURIComponent(email)}`

      const html = `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Pagamento confirmado – Bem-vindo(a) ao Plenipay!</h2>
          <p>Olá, <strong>${nome || 'Assinante'}</strong>!</p>
          <p>Recebemos seu pagamento com sucesso. Seu acesso será liberado em instantes.</p>
          <p style="margin: 16px 0;">
            <a href="${cadastroUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Criar/ativar minha conta
            </a>
          </p>
          <p style="color:#64748b; font-size:14px;">
            Use o e-mail <strong>${email}</strong> para cadastrar/login.
          </p>
          <p>Se precisar, fale com a gente no suporte. Bom uso! 🎉</p>
        </div>
      `

      await sendMail({
        to: email,
        subject: 'Pagamento confirmado – Acesse sua conta no Plenipay',
        html,
      })
      console.log('[confirmar-assinatura-guest] email enviado', {
        subscriptionId,
        email: maskEmail(email),
      })
    } catch (err: any) {
      console.error('[confirmar-assinatura-guest] Erro preparando/mandando email:', err?.message ?? err)
    }

    console.log('[confirmar-assinatura-guest] confirmado', {
      subscriptionId,
      email: maskEmail(email),
      alreadyActive,
    })

    return { ok: true }
  } catch (err: any) {
    console.error('[confirmar-assinatura-guest] Erro:', err?.message ?? err)
    return { ok: false, error: err?.message ?? err }
  }
}
