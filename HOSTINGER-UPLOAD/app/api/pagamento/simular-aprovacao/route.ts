import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Rota para simular aprovação de pagamento PIX (apenas para desenvolvimento/testes)
 * ATENÇÃO: Remover ou proteger esta rota em produção!
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { subscriptionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json({ error: 'ID da assinatura não fornecido' }, { status: 400 })
    }

    // Buscar perfil do usuário para obter o plano da assinatura
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plano, asaas_subscription_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a subscriptionId corresponde ao usuário
    if (profile.asaas_subscription_id !== subscriptionId) {
      return NextResponse.json(
        { error: 'Assinatura não pertence a este usuário' },
        { status: 403 }
      )
    }

    // Obter o plano da assinatura (pode estar no perfil ou precisar buscar)
    const plano = profile.plano || 'basico' // Se não tiver, assume básico

    // Calcular datas
    const dataInicio = new Date()
    const dataFim = new Date()
    dataFim.setMonth(dataFim.getMonth() + 1) // 1 mês a partir de agora

    // Atualizar perfil com plano ativo
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plano: plano,
        plano_status: 'ativo',
        plano_data_inicio: dataInicio.toISOString(),
        plano_data_fim: dataFim.toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Pagamento simulado com sucesso:', {
      userId: user.id,
      subscriptionId,
      plano,
      status: 'ativo',
      dataFim: dataFim.toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Pagamento aprovado! Plano ${plano} ativado com sucesso!`,
      plano: plano,
      plano_status: 'ativo',
      data_fim: dataFim.toISOString(),
    })
  } catch (error: any) {
    console.error('Erro ao simular aprovação de pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao simular aprovação de pagamento' },
      { status: 500 }
    )
  }
}

