import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  criarCustomerAsaas,
  criarAssinaturaAsaas,
  buscarPagamentosAssinatura,
  buscarPixQrCode,
} from '@/lib/asaas'

const PLANOS = {
  basico: { valor: 29.9, ciclo: 'MONTHLY' as const, descricao: 'Plano Básico' },
  premium: { valor: 49.9, ciclo: 'MONTHLY' as const, descricao: 'Plano Premium' },
  anual: { valor: 197, ciclo: 'YEARLY' as const, descricao: 'Plano Anual' },
}

function getNextDueDate(cycle: 'MONTHLY' | 'YEARLY'): string {
  const d = new Date()
  if (cycle === 'MONTHLY') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setFullYear(d.getFullYear() + 1)
  }
  return d.toISOString().slice(0, 10)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plano, metodoPagamento } = body as {
      plano?: 'basico' | 'premium' | 'anual'
      metodoPagamento?: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
    }

    if (!plano || !['basico', 'premium', 'anual'].includes(plano)) {
      return NextResponse.json(
        { success: false, error: 'Plano inválido' },
        { status: 400 }
      )
    }

    const billingType = metodoPagamento === 'CREDIT_CARD' ? 'CREDIT_CARD' : metodoPagamento === 'BOLETO' ? 'BOLETO' : 'PIX'

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, nome, email, cpf, asaas_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado' },
        { status: 400 }
      )
    }

    const nome = (profile.nome || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente').trim()
    const email = profile.email || user.email || ''
    const cpf = (profile.cpf || '').replace(/\D/g, '')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    if (cpf.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'CPF inválido ou não informado' },
        { status: 400 }
      )
    }

    let customerId = profile.asaas_customer_id

    if (!customerId) {
      const customer = await criarCustomerAsaas({
        name: nome,
        email,
        cpfCnpj: cpf,
        externalReference: user.id,
      })
      customerId = customer.id

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ asaas_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        console.warn('[checkout] Não foi possível salvar asaas_customer_id:', updateError.message)
        // Continua - próxima compra pode criar outro customer se coluna não existir
      }
    }

    const config = PLANOS[plano]
    const subscription = await criarAssinaturaAsaas({
      customer: customerId,
      billingType,
      value: config.valor,
      nextDueDate: getNextDueDate(config.ciclo),
      cycle: config.ciclo,
      description: config.descricao,
      externalReference: user.id,
    })

    const subscriptionId = subscription.id

    let pixQrCode: string | undefined
    let pixCopyPaste: string | undefined
    let paymentUrl: string | undefined

    if (billingType === 'PIX') {
      const payments = await buscarPagamentosAssinatura(subscriptionId)
      const firstPayment = payments.find((p: any) => p.status === 'PENDING' || p.status === 'AWAITING_RISK_ANALYSIS')
      if (firstPayment) {
        const pixData = await buscarPixQrCode(firstPayment.id)
        pixQrCode = pixData.encodedImage
        pixCopyPaste = pixData.payload
      }
    } else if (subscription.invoiceUrl) {
      paymentUrl = subscription.invoiceUrl
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      pixQrCode,
      pixCopyPaste,
      paymentUrl,
      metodoPagamento: billingType,
      plano,
    })
  } catch (error: any) {
    console.error('❌ [checkout] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao processar checkout',
      },
      { status: 500 }
    )
  }
}
