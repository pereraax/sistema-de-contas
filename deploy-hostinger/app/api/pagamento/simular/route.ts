import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Rota para simular pagamento aprovado (apenas para desenvolvimento/testes)
 * ATENÇÃO: Remover ou proteger esta rota em produção!
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { plano } = await request.json()

    if (!['basico', 'premium'].includes(plano)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

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
      plano,
      status: 'ativo',
      dataFim: dataFim.toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Plano ${plano} ativado com sucesso!`,
      plano: plano,
      plano_status: 'ativo',
      data_fim: dataFim.toISOString(),
    })
  } catch (error: any) {
    console.error('Erro ao simular pagamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao simular pagamento' },
      { status: 500 }
    )
  }
}

