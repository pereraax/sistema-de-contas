import { NextRequest, NextResponse } from 'next/server'
import {
  criarCustomerAsaas,
  criarAssinaturaAsaas,
  buscarPagamentosAssinatura,
  buscarPixQrCode,
} from '@/lib/asaas'
import { selectPendingPixPayment } from '@/lib/pagamento/pix-helpers'

// Plano oferta quiz: anual a R$ 29,90
const PLANO_GUEST = {
  valor: 29.9,
  ciclo: 'YEARLY' as const,
  descricao: 'Plano Básico',
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
    // Fluxo novo: NÃO criamos cadastro no Supabase aqui.
    // Só usamos o e-mail para identificar a compra.
    const nomeFinal = nomeTrim
    const emailFinal = emailNorm
    const cpfFinal = cpfLimpo
    const phoneFinal = celularLimpo.length >= 10 ? celularLimpo : undefined

    const customer = await criarCustomerAsaas({
      name: nomeFinal,
      email: emailFinal,
      cpfCnpj: cpfFinal,
      phone: phoneFinal,
      externalReference: emailFinal,
    })
    const customerId = customer.id

    const nextDue = getNextDueDate(PLANO_GUEST.ciclo, PLANO_GUEST.trialDias)
    const subscription = await criarAssinaturaAsaas({
      customer: customerId,
      billingType,
      value: PLANO_GUEST.valor,
      nextDueDate: nextDue,
      cycle: PLANO_GUEST.ciclo,
      description: PLANO_GUEST.descricao,
      // externalReference = email (para confirmar pagamento sem depender de cadastro prévio)
      externalReference: emailFinal,
    })

    const subscriptionId = subscription.id

    let pixQrCode: string | undefined
    let pixCopyPaste: string | undefined
    let paymentUrl: string | undefined
    let paymentId: string | undefined

    // Asaas cria o primeiro pagamento da assinatura de forma assíncrona; é necessário retry com delay
    if (billingType === 'PIX') {
      const maxAttempts = 10
      const delayMs = 1500
      let firstPayment: any = null
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const payments = await buscarPagamentosAssinatura(subscriptionId)
        firstPayment = selectPendingPixPayment(payments)
        if (firstPayment) break
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, delayMs))
      }
      if (firstPayment) {
        paymentId = firstPayment.id as string
        const pixData = await buscarPixQrCode(paymentId)
        pixQrCode = pixData.encodedImage
        pixCopyPaste = pixData.payload
      }
    } else if (subscription.invoiceUrl) {
      paymentUrl = subscription.invoiceUrl
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      paymentId,
      pixQrCode,
      pixCopyPaste,
      paymentUrl,
      metodoPagamento: billingType,
      plano: 'basico',
    })
  } catch (error: any) {
    const message = error?.message || 'Erro ao processar pagamento.'
    console.error('❌ [checkout-guest] Erro:', message, error)
    const isInvalidKey = /inválida|invalid|não está configurada|API key/i.test(message)
    return NextResponse.json(
      {
        success: false,
        error: isInvalidKey
          ? `${message} Verifique no Railway: ASAAS_API_KEY e ASAAS_API_URL (produção: https://api.asaas.com/v3 · sandbox: https://api-sandbox.asaas.com/v3).`
          : message,
      },
      { status: 500 }
    )
  }
}
