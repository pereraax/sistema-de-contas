import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [API] ========== ALTERAR PLANO - INÍCIO ==========')
    
    // Verificar se é admin
    console.log('🔐 [API] Verificando autenticação admin...')
    const admin = await verifyAdminToken()
    if (!admin) {
      console.error('❌ [API] Não autorizado - admin não encontrado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    console.log('✅ [API] Admin autenticado:', admin.email)

    const requestBody = await request.json()
    const { userId, plano, planoStatus } = requestBody
    console.log('📥 [API] Dados recebidos:', {
      userId,
      plano,
      planoStatus,
      requestBody
    })

    if (!userId || !plano) {
      console.error('❌ [API] Validação falhou:', { userId, plano })
      return NextResponse.json(
        { error: 'userId e plano são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['teste', 'basico', 'premium'].includes(plano)) {
      console.error('❌ [API] Plano inválido:', plano)
      return NextResponse.json(
        { error: 'Plano inválido. Use: teste, basico ou premium' },
        { status: 400 }
      )
    }

    console.log('✅ [API] Validações passaram')

    // Usar service role key para bypass RLS
    const supabaseAdmin = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      : null

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // Calcular datas se for plano pago
    let dataInicio: Date | null = null
    let dataFim: Date | null = null
    let status = planoStatus || 'trial'

    console.log('📅 [API] Calculando datas e status...')
    console.log('📅 [API] Plano:', plano)
    console.log('📅 [API] PlanoStatus recebido:', planoStatus)

    if (plano === 'basico' || plano === 'premium') {
      dataInicio = new Date()
      dataFim = new Date()
      dataFim.setMonth(dataFim.getMonth() + 1) // 1 mês a partir de agora
      status = planoStatus || 'ativo'
      console.log('📅 [API] Plano pago - datas calculadas:', {
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
        status
      })
    } else {
      // Plano teste não tem data de fim
      status = 'trial'
      console.log('📅 [API] Plano teste - status:', status)
    }

    // Atualizar perfil do usuário
    console.log('💾 [API] Atualizando perfil no banco...')
    console.log('💾 [API] Update payload:', {
      plano,
      plano_status: status,
      plano_data_inicio: dataInicio ? dataInicio.toISOString() : null,
      plano_data_fim: dataFim ? dataFim.toISOString() : null,
      userId
    })

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        plano: plano,
        plano_status: status,
        plano_data_inicio: dataInicio ? dataInicio.toISOString() : null,
        plano_data_fim: dataFim ? dataFim.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ [API] Erro ao atualizar plano:', error)
      console.error('❌ [API] Detalhes do erro:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { error: 'Erro ao atualizar plano: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ [API] Perfil atualizado com sucesso:', data)

    console.log('✅ Plano alterado com sucesso:', {
      userId,
      plano,
      status,
      adminId: admin.id,
      adminEmail: admin.email,
    })

    return NextResponse.json({
      success: true,
      message: `Plano alterado para ${plano} com sucesso!`,
      usuario: {
        id: data.id,
        plano: data.plano,
        plano_status: data.plano_status,
      },
    })
  } catch (error: any) {
    console.error('Erro ao alterar plano:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao alterar plano' },
      { status: 500 }
    )
  }
}

