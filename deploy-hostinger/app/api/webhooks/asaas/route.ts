import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN!

/**
 * Verifica a assinatura do webhook do Asaas
 */
function verificarWebhook(body: string, token: string): boolean {
  if (!WEBHOOK_TOKEN || !token) {
    return false
  }
  
  // Asaas envia o token no header 'asaas-access-token'
  // Comparar diretamente
  return token === WEBHOOK_TOKEN
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const token = request.headers.get('asaas-access-token') || ''

    // Verificar assinatura do webhook
    if (!verificarWebhook(body, token)) {
      console.error('Webhook signature inválida')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const supabase = await createClient()

    console.log('📥 Webhook recebido:', event.event, event.payment || event.subscription)

    // Eventos de pagamento confirmado
    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
      const payment = event.payment

      if (!payment || !payment.customer) {
        return NextResponse.json({ error: 'Dados de pagamento inválidos' }, { status: 400 })
      }

      // Buscar usuário pelo customer ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('asaas_customer_id', payment.customer)
        .single()

      if (profileError || !profile) {
        console.error('Perfil não encontrado para customer:', payment.customer)
        return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
      }

      // Calcular data de fim (1 mês a partir de agora)
      const dataFim = new Date()
      dataFim.setMonth(dataFim.getMonth() + 1)

      // Atualizar status do plano para ativo
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plano_status: 'ativo',
          plano_data_fim: dataFim.toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) {
        console.error('Erro ao atualizar plano:', updateError)
      } else {
        console.log('✅ Plano ativado para usuário:', profile.id)
      }

      // Registrar pagamento
      const { error: paymentError } = await supabase
        .from('pagamentos')
        .insert({
          user_id: profile.id,
          plano: profile.plano,
          valor: payment.value,
          status: 'pago',
          asaas_payment_id: payment.id,
          asaas_subscription_id: payment.subscription,
          metodo_pagamento: payment.billingType,
          data_pagamento: payment.confirmedDate || payment.dueDate || new Date().toISOString(),
        })

      if (paymentError) {
        console.error('Erro ao registrar pagamento:', paymentError)
      }
    }

    // Evento de assinatura cancelada
    if (event.event === 'SUBSCRIPTION_DELETED' || event.event === 'SUBSCRIPTION_CANCELLED') {
      const subscription = event.subscription

      if (!subscription || !subscription.id) {
        return NextResponse.json({ error: 'Dados de assinatura inválidos' }, { status: 400 })
      }

      // Buscar perfil pela subscription ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('asaas_subscription_id', subscription.id)
        .single()

      if (profileError || !profile) {
        console.error('Perfil não encontrado para subscription:', subscription.id)
        return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
      }

      // Atualizar para plano teste e status cancelado
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plano_status: 'cancelado',
          plano: 'teste',
          plano_data_fim: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) {
        console.error('Erro ao cancelar plano:', updateError)
      } else {
        console.log('✅ Plano cancelado para usuário:', profile.id)
      }
    }

    // Evento de pagamento pendente (para PIX/Boleto)
    if (event.event === 'PAYMENT_CREATED') {
      const payment = event.payment

      if (payment && payment.customer) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('asaas_customer_id', payment.customer)
          .single()

        if (profile) {
          // Registrar pagamento pendente
          await supabase
            .from('pagamentos')
            .insert({
              user_id: profile.id,
              plano: profile.plano || 'basico',
              valor: payment.value,
              status: 'pendente',
              asaas_payment_id: payment.id,
              asaas_subscription_id: payment.subscription,
              metodo_pagamento: payment.billingType,
            })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}




