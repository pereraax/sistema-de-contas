import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buscarPagamentosAssinatura } from '@/lib/asaas'

// Status do Asaas que indicam pagamento concluído
const STATUS_PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']

function planoCheckoutParaPlanoProfiles(plano: string): 'basico' | 'premium' {
  if (plano === 'premium' || plano === 'anual') return 'premium'
  return 'basico'
}

export async function GET(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId')
    const planoParam = request.nextUrl.searchParams.get('plano') || 'basico'

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const payments = await buscarPagamentosAssinatura(subscriptionId)
    const paymentPago = payments.find((p: any) =>
      STATUS_PAGO.includes(String(p.status || '').toUpperCase())
    )

    if (paymentPago) {
      const planoAtivar = planoCheckoutParaPlanoProfiles(planoParam)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plano: planoAtivar,
          plano_status: 'ativo',
          asaas_subscription_id: subscriptionId,
          plano_data_inicio: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('[pagamento/status] Erro ao ativar plano:', updateError)
      } else {
        revalidatePath('/home')
        revalidatePath('/configuracoes')
      }

      return NextResponse.json({
        success: true,
        pago: true,
        plano: planoAtivar,
      })
    }

    return NextResponse.json({
      success: true,
      pago: false,
    })
  } catch (error: any) {
    console.error('❌ [pagamento/status] Erro:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao verificar status do pagamento',
      },
      { status: 500 }
    )
  }
}
