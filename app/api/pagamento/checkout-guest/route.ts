import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  criarCustomerAsaas,
  criarAssinaturaAsaas,
  buscarPagamentosAssinatura,
  buscarPixQrCode,
} from '@/lib/asaas'
import crypto from 'crypto'

// Plano oferta quiz: anual a R$ 29,90
const PLANO_GUEST = {
  valor: 29.9,
  ciclo: 'YEARLY' as const,
  descricao: 'Plano Anual',
  trialDias: 0,
}

function getNextDueDate(cycle: 'YEARLY', trialDias: number): string {
  const d = new Date()
  if (trialDias > 0) d.setDate(d.getDate() + trialDias)
  else d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nome,
      email,
      celular,
      cpf,
      metodoPagamento,
    } = body as {
      nome?: string
      email?: string
      celular?: string
      cpf?: string
      metodoPagamento?: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
    }

    const emailNorm = (email || '').trim().toLowerCase()
    const nomeTrim = (nome || '').trim()
    const cpfLimpo = (cpf || '').replace(/\D/g, '')
    const celularLimpo = (celular || '').replace(/\D/g, '')

    if (!emailNorm) {
      return NextResponse.json(
        { success: false, error: 'E-mail é obrigatório.' },
        { status: 400 }
      )
    }
    if (!nomeTrim) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório.' },
        { status: 400 }
      )
    }
    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'CPF inválido ou não informado.' },
        { status: 400 }
      )
    }

    const billingType = metodoPagamento === 'CREDIT_CARD' ? 'CREDIT_CARD' : metodoPagamento === 'BOLETO' ? 'BOLETO' : 'PIX'

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Serviço temporariamente indisponível.' },
        { status: 503 }
      )
    }

    let userId: string

    const { data: profileByEmail } = await admin
      .from('profiles')
      .select('id')
      .eq('email', emailNorm)
      .maybeSingle()

    if (profileByEmail?.id) {
      userId = profileByEmail.id
      await admin
        .from('profiles')
        .update({
          nome: nomeTrim,
          cpf: cpfLimpo,
          ...(celularLimpo.length >= 10 && { whatsapp: celularLimpo }),
        })
        .eq('id', userId)
    } else {
      const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
      const existingAuth = usersData?.users?.find((u) => (u.email ?? '').toLowerCase() === emailNorm)
      if (existingAuth?.id) {
        userId = existingAuth.id
        await admin
          .from('profiles')
          .upsert(
            {
              id: userId,
              email: emailNorm,
              nome: nomeTrim,
              cpf: cpfLimpo,
              ...(celularLimpo.length >= 10 && { whatsapp: celularLimpo }),
            },
            { onConflict: 'id' }
          )
      } else {
        const tempPassword = crypto.randomBytes(24).toString('hex')
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: emailNorm,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: nomeTrim },
        })
        if (createError || !newUser?.id) {
          console.error('[checkout-guest] createUser:', createError)
          return NextResponse.json(
            { success: false, error: createError?.message || 'Não foi possível criar sua conta.' },
            { status: 400 }
          )
        }
        userId = newUser.id
        await admin
          .from('profiles')
          .upsert(
            {
              id: userId,
              email: emailNorm,
              nome: nomeTrim,
              cpf: cpfLimpo,
              ...(celularLimpo.length >= 10 && { whatsapp: celularLimpo }),
            },
            { onConflict: 'id' }
          )
      }
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('id, nome, email, cpf, asaas_customer_id')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado.' },
        { status: 400 }
      )
    }

    const nomeFinal = (profile.nome || nomeTrim).trim()
    const emailFinal = profile.email || emailNorm
    const cpfFinal = (profile.cpf || cpfLimpo).replace(/\D/g, '')

    let customerId = profile.asaas_customer_id
    if (!customerId) {
      const customer = await criarCustomerAsaas({
        name: nomeFinal,
        email: emailFinal,
        cpfCnpj: cpfFinal,
        externalReference: userId,
      })
      customerId = customer.id
      await admin
        .from('profiles')
        .update({ asaas_customer_id: customerId })
        .eq('id', userId)
    }

    const nextDue = getNextDueDate(PLANO_GUEST.ciclo, PLANO_GUEST.trialDias)
    const subscription = await criarAssinaturaAsaas({
      customer: customerId,
      billingType,
      value: PLANO_GUEST.valor,
      nextDueDate: nextDue,
      cycle: PLANO_GUEST.ciclo,
      description: PLANO_GUEST.descricao,
      externalReference: userId,
    })

    const subscriptionId = subscription.id

    let pixQrCode: string | undefined
    let pixCopyPaste: string | undefined
    let paymentUrl: string | undefined

    // Asaas cria o primeiro pagamento da assinatura de forma assíncrona; é necessário retry com delay
    if (billingType === 'PIX') {
      const maxAttempts = 5
      const delayMs = 1500
      let firstPayment: any = null
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const payments = await buscarPagamentosAssinatura(subscriptionId)
        firstPayment = payments.find((p: any) => p.status === 'PENDING' || p.status === 'AWAITING_RISK_ANALYSIS')
        if (firstPayment) break
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, delayMs))
      }
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
      plano: 'anual',
    })
  } catch (error: any) {
    console.error('❌ [checkout-guest] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao processar pagamento.',
      },
      { status: 500 }
    )
  }
}
