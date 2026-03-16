import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { buscarPagamentosAssinatura, buscarAssinaturaAsaas } from '@/lib/asaas'
import { sendMail } from '@/lib/mailer'

const STATUS_PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']

export async function GET(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId')
    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId é obrigatório' },
        { status: 400 }
      )
    }

    const subscription = await buscarAssinaturaAsaas(subscriptionId)
    const userId = subscription.externalReference
    if (!userId) {
      return NextResponse.json({ success: false, pago: false })
    }

    const payments = await buscarPagamentosAssinatura(subscriptionId)
    const paymentPago = payments.find((p: any) =>
      STATUS_PAGO.includes(String(p.status || '').toUpperCase())
    )

    if (!paymentPago) {
      return NextResponse.json({ success: true, pago: false })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ success: true, pago: true })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, nome, plano_status')
      .eq('id', userId)
      .single()

    const alreadyActive = profile?.plano_status === 'ativo'
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        plano: 'premium',
        plano_status: 'ativo',
        asaas_subscription_id: subscriptionId,
        plano_data_inicio: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[status-guest] Erro ao ativar plano:', updateError)
    }

    if (profile?.email && !alreadyActive) {
      try {
        const nome = (profile.nome || '').trim() || 'Assinante'
        // Link do email sempre plenipay.com (nunca localhost)
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
        console.error('[status-guest] Erro ao enviar email de boas-vindas:', err?.message)
      }
    }

    return NextResponse.json({
      success: true,
      pago: true,
      plano: 'premium',
    })
  } catch (error: any) {
    console.error('❌ [status-guest] Erro:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
