import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Erro ao conectar com o banco de dados' },
        { status: 500 }
      )
    }

    console.log('🔍 [Admin Registros Count] ==========================================')
    console.log('🔍 [Admin Registros Count] Buscando registros para account_owner_id:', userId.substring(0, 8) + '...')
    
    // Buscar todos os usuários (users) que pertencem a este account_owner_id
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('users')
      .select('id, nome, account_owner_id')
      .eq('account_owner_id', userId)

    if (usuariosError) {
      console.error('❌ [Admin Registros Count] Erro ao buscar usuários:', usuariosError)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários', details: usuariosError.message },
        { status: 500 }
      )
    }

    const userIds = usuarios && usuarios.length > 0 ? usuarios.map((u: any) => u.id) : []
    
    console.log('👥 [Admin Registros Count] Usuários encontrados na tabela users:', usuarios?.length || 0)
    if (usuarios && usuarios.length > 0) {
      usuarios.forEach((u: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${u.id.substring(0, 8)}..., Nome: ${u.nome}`)
      })
    }

    // Se não há usuários, retornar 0
    if (userIds.length === 0) {
      console.log('⚠️ [Admin Registros Count] Nenhum usuário encontrado na tabela users para este account_owner_id')
      console.log('🔍 [Admin Registros Count] ==========================================')
      return NextResponse.json({
        totalRegistros: 0,
        registrosMes: 0,
        registrosEntrada: 0,
        registrosSaida: 0,
        registrosDivida: 0,
      })
    }

    // Buscar TODOS os registros para calcular total e contagens por tipo
    console.log('🔍 [Admin Registros Count] Buscando registros para user_ids:', userIds.length > 0 ? userIds.map((id: string) => id.substring(0, 8) + '...').join(', ') : 'NENHUM')
    
    const { data: registrosTodos, error: todosError } = await supabaseAdmin
      .from('registros')
      .select('id, tipo, created_at, data_registro, user_id')
      .in('user_id', userIds)

    if (todosError) {
      console.error('❌ [Admin Registros Count] Erro ao buscar todos os registros:', todosError)
      console.error('❌ [Admin Registros Count] Detalhes do erro:', {
        message: todosError.message,
        code: todosError.code,
        details: todosError.details,
        hint: todosError.hint,
      })
    } else {
      console.log('✅ [Admin Registros Count] Busca de registros concluída. Encontrados:', registrosTodos?.length || 0)
      if (registrosTodos && registrosTodos.length > 0) {
        console.log('📋 [Admin Registros Count] Primeiros 3 registros:')
        registrosTodos.slice(0, 3).forEach((r: any, index: number) => {
          console.log(`  ${index + 1}. ID: ${r.id.substring(0, 8)}..., user_id: ${r.user_id?.substring(0, 8)}..., created_at: ${r.created_at}, tipo: ${r.tipo}`)
        })
      } else {
        console.log('⚠️ [Admin Registros Count] NENHUM registro encontrado para os user_ids fornecidos')
      }
    }

    // Usar o tamanho do array em vez de count (mais confiável)
    const totalRegistros = registrosTodos?.length || 0

    // Buscar registros do mês atual
    // CRÍTICO: Usar created_at (data de criação) e não data_registro (data do evento)
    // Usar a MESMA LÓGICA do endpoint debug-registros que está funcionando!
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999)
    
    console.log('📅 [Admin Registros Count] Período do mês:', {
      inicioMes: inicioMes.toISOString(),
      fimMes: fimMes.toISOString(),
      inicioMesLocal: inicioMes.toLocaleString('pt-BR'),
      fimMesLocal: fimMes.toLocaleString('pt-BR'),
    })
    
    // Filtrar registros do mês atual usando created_at
    // MESMA LÓGICA do debug-registros que está funcionando
    const registrosMesFiltrados = (registrosTodos || []).filter((r: any) => {
      const dataCriacao = r.created_at ? new Date(r.created_at) : new Date(r.data_registro)
      return dataCriacao >= inicioMes && dataCriacao <= fimMes
    })
    
    const registrosMes = registrosMesFiltrados.length
    
    console.log('📅 [Admin Registros Count] Registros encontrados (total):', registrosTodos?.length || 0)
    console.log('📅 [Admin Registros Count] Registros do mês atual (filtrado):', registrosMes)
    console.log('📅 [Admin Registros Count] Período usado:', {
      inicioMes: inicioMes.toISOString(),
      fimMes: fimMes.toISOString(),
      inicioMesTimestamp: inicioMes.getTime(),
      fimMesTimestamp: fimMes.getTime(),
    })
    
    if (registrosMesFiltrados.length > 0) {
      console.log('✅ [Admin Registros Count] Detalhes dos registros do mês:')
      registrosMesFiltrados.slice(0, 5).forEach((r: any, index: number) => {
        const dataCriacao = r.created_at ? new Date(r.created_at) : new Date(r.data_registro)
        console.log(`  ${index + 1}. ID: ${r.id.substring(0, 8)}..., Tipo: ${r.tipo}, Created: ${r.created_at} (${dataCriacao.toLocaleString('pt-BR')})`)
      })
      if (registrosMesFiltrados.length > 5) {
        console.log(`  ... e mais ${registrosMesFiltrados.length - 5} registros`)
      }
    } else {
      console.log('⚠️ [Admin Registros Count] Nenhum registro do mês encontrado!')
      if (registrosTodos && registrosTodos.length > 0) {
        console.log('📋 [Admin Registros Count] Exemplo de registro encontrado (mas fora do mês):')
        const exemplo = registrosTodos[0]
        const dataExemplo = exemplo.created_at ? new Date(exemplo.created_at) : new Date(exemplo.data_registro)
        console.log(`  Created: ${exemplo.created_at} (${dataExemplo.toLocaleString('pt-BR')})`)
        console.log(`  Timestamp: ${dataExemplo.getTime()}, Início mês: ${inicioMes.getTime()}, Fim mês: ${fimMes.getTime()}`)
        console.log(`  Comparação: ${dataExemplo.getTime()} >= ${inicioMes.getTime()} = ${dataExemplo.getTime() >= inicioMes.getTime()}`)
        console.log(`  Comparação: ${dataExemplo.getTime()} <= ${fimMes.getTime()} = ${dataExemplo.getTime() <= fimMes.getTime()}`)
      } else {
        console.log('⚠️ [Admin Registros Count] NENHUM registro encontrado para os user_ids:', userIds)
      }
    }

    // Contar por tipo (TODOS os registros, não apenas do mês)
    const registrosEntrada = (registrosTodos || []).filter(r => r.tipo === 'entrada').length
    const registrosSaida = (registrosTodos || []).filter(r => r.tipo === 'saida').length
    const registrosDivida = (registrosTodos || []).filter(r => r.tipo === 'divida').length

    console.log('📊 [Admin Registros Count] RESUMO FINAL:')
    console.log('📊 [Admin Registros Count] Account Owner ID:', userId.substring(0, 8) + '...')
    console.log('📊 [Admin Registros Count] Usuários (users) encontrados:', userIds.length)
    console.log('📊 [Admin Registros Count] User IDs:', userIds.length > 0 ? userIds.map((id: string) => id.substring(0, 8) + '...').join(', ') : 'NENHUM')
    console.log('📊 [Admin Registros Count] Total de registros (array length):', totalRegistros)
    console.log('📊 [Admin Registros Count] Registros do mês atual (filtrado):', registrosMes)
    console.log('📊 [Admin Registros Count] Período:', inicioMes.toLocaleDateString('pt-BR'), 'até', fimMes.toLocaleDateString('pt-BR'))
    console.log('📊 [Admin Registros Count] Por tipo - Entradas:', registrosEntrada, 'Saídas:', registrosSaida, 'Dívidas:', registrosDivida)
    console.log('📊 [Admin Registros Count] ==========================================')

    // SEMPRE adicionar debug info para ajudar a diagnosticar
    const debugInfo: any = {
      accountOwnerId: userId.substring(0, 8) + '...',
      totalUsuariosEncontrados: usuarios?.length || 0,
      userIds: userIds.length > 0 ? userIds.map((id: string) => id.substring(0, 8) + '...') : [],
      registrosEncontrados: registrosTodos?.length || 0,
      periodo: {
        inicioMes: inicioMes.toISOString(),
        fimMes: fimMes.toISOString(),
      },
    }
    
    if (userIds.length === 0) {
      debugInfo.warning = 'NENHUM usuário encontrado na tabela users para este account_owner_id'
      debugInfo.sugestao = 'Verifique se há usuários na tabela users com account_owner_id = ' + userId.substring(0, 8) + '...'
    } else if (totalRegistros === 0) {
      debugInfo.warning = 'Usuários encontrados, mas NENHUM registro encontrado para esses user_ids'
      debugInfo.sugestao = 'Verifique se há registros na tabela registros com user_id em: ' + userIds.map((id: string) => id.substring(0, 8) + '...').join(', ')
    } else if (registrosMes === 0 && totalRegistros > 0) {
      debugInfo.warning = 'Registros encontrados, mas NENHUM do mês atual'
      if (registrosTodos && registrosTodos.length > 0) {
        debugInfo.exemploRegistro = {
          id: registrosTodos[0].id.substring(0, 8) + '...',
          created_at: registrosTodos[0].created_at,
          data_registro: registrosTodos[0].data_registro,
        }
      }
    }

    return NextResponse.json({
      totalRegistros: totalRegistros || 0,
      registrosMes: registrosMes || 0,
      registrosEntrada,
      registrosSaida,
      registrosDivida,
      debug: debugInfo, // SEMPRE incluir debug para diagnóstico
    })
  } catch (error: any) {
    console.error('Erro ao buscar contagem de registros:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

