'use server'

import { createClient } from './supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Processa dívidas recorrentes e cria novas instâncias quando necessário
 * Esta função deve ser chamada periodicamente (ex: via cron job ou ao acessar a página de dívidas)
 */
export async function processarRecorrencias() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Não autenticado' }
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Buscar todas as dívidas recorrentes ativas com próxima recorrência <= hoje
    const { data: dividasRecorrentes, error: fetchError } = await supabase
      .from('registros')
      .select('*')
      .eq('tipo', 'divida')
      .eq('is_recorrente', true)
      .eq('ativo', true)
      .lte('proxima_recorrencia', hoje.toISOString())

    if (fetchError) {
      console.error('Erro ao buscar dívidas recorrentes:', fetchError)
      return { error: fetchError.message }
    }

    if (!dividasRecorrentes || dividasRecorrentes.length === 0) {
      return { data: [], message: 'Nenhuma dívida recorrente para processar' }
    }

    const novasDividas: any[] = []

    for (const dividaOriginal of dividasRecorrentes) {
      // Calcular próxima data de recorrência
      const dataProxima = dividaOriginal.proxima_recorrencia 
        ? new Date(dividaOriginal.proxima_recorrencia)
        : new Date(dividaOriginal.data_registro)

      let proximaData = new Date(dataProxima)

      switch (dividaOriginal.recorrencia_tipo) {
        case 'diaria':
          proximaData.setDate(proximaData.getDate() + 1)
          break
        case 'semanal':
          const diaSemanaAtual = dataProxima.getDay()
          const diaSemanaDesejado = dividaOriginal.recorrencia_dia_semana || 1
          const diasParaProxima = (diaSemanaDesejado - diaSemanaAtual + 7) % 7 || 7
          proximaData.setDate(proximaData.getDate() + diasParaProxima)
          break
        case 'quinzenal':
          proximaData.setDate(proximaData.getDate() + 15)
          break
        case 'mensal':
          proximaData.setMonth(proximaData.getMonth() + 1)
          if (dividaOriginal.recorrencia_dia) {
            proximaData.setDate(dividaOriginal.recorrencia_dia)
          }
          break
        case 'bimestral':
          proximaData.setMonth(proximaData.getMonth() + 2)
          if (dividaOriginal.recorrencia_dia) {
            proximaData.setDate(dividaOriginal.recorrencia_dia)
          }
          break
        case 'trimestral':
          proximaData.setMonth(proximaData.getMonth() + 3)
          if (dividaOriginal.recorrencia_dia) {
            proximaData.setDate(dividaOriginal.recorrencia_dia)
          }
          break
        case 'semestral':
          proximaData.setMonth(proximaData.getMonth() + 6)
          if (dividaOriginal.recorrencia_dia) {
            proximaData.setDate(dividaOriginal.recorrencia_dia)
          }
          break
        case 'anual':
          proximaData.setFullYear(proximaData.getFullYear() + 1)
          if (dividaOriginal.recorrencia_dia) {
            proximaData.setDate(dividaOriginal.recorrencia_dia)
          }
          break
      }

      // Criar nova dívida baseada na original
      const novaDivida = {
        user_id: dividaOriginal.user_id,
        nome: dividaOriginal.nome,
        observacao: dividaOriginal.observacao || `Dívida recorrente criada automaticamente`,
        tipo: 'divida' as const,
        valor: dividaOriginal.valor,
        categoria: dividaOriginal.categoria,
        etiquetas: dividaOriginal.etiquetas || [],
        parcelas_totais: dividaOriginal.parcelas_totais,
        parcelas_pagas: 0,
        data_registro: dataProxima.toISOString(),
        // Campos de recorrência
        is_recorrente: true,
        recorrencia_tipo: dividaOriginal.recorrencia_tipo,
        recorrencia_dia: dividaOriginal.recorrencia_dia,
        recorrencia_dia_semana: dividaOriginal.recorrencia_dia_semana,
        divida_original_id: dividaOriginal.id, // Referência à dívida original
        proxima_recorrencia: proximaData.toISOString(),
        ativo: true,
      }

      novasDividas.push(novaDivida)

      // Atualizar próxima recorrência da dívida original
      await supabase
        .from('registros')
        .update({ proxima_recorrencia: proximaData.toISOString() })
        .eq('id', dividaOriginal.id)
    }

    // Inserir todas as novas dívidas de uma vez
    if (novasDividas.length > 0) {
      const { data: dividasCriadas, error: insertError } = await supabase
        .from('registros')
        .insert(novasDividas)
        .select()

      if (insertError) {
        console.error('Erro ao criar dívidas recorrentes:', insertError)
        return { error: insertError.message }
      }

      revalidatePath('/dividas')
      revalidatePath('/home')
      revalidatePath('/calendario')

      return { 
        data: dividasCriadas, 
        message: `${novasDividas.length} dívida(s) recorrente(s) criada(s) com sucesso` 
      }
    }

    return { data: [], message: 'Nenhuma nova dívida criada' }
  } catch (error: any) {
    console.error('Erro ao processar recorrências:', error)
    return { error: error.message || 'Erro ao processar recorrências' }
  }
}

