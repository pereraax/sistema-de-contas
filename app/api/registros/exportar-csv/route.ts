import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Obter parâmetro de dias
    const searchParams = request.nextUrl.searchParams
    const diasParam = searchParams.get('dias')
    const dias = diasParam ? parseInt(diasParam, 10) : 0

    // CRÍTICO: Buscar todos os usuários da tabela users que pertencem a este account_owner
    // e então buscar registros desses usuários (mesma lógica de obterRegistros)
    const { data: usuarios, error: usuariosError } = await supabase
      .from('users')
      .select('id')
      .eq('account_owner_id', user.id)
    
    if (usuariosError) {
      console.error('Erro ao buscar usuários:', usuariosError)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }
    
    // Se não há usuários, retornar vazio
    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum registro encontrado' },
        { status: 404 }
      )
    }
    
    // Extrair IDs dos usuários
    const userIds = usuarios.map(u => u.id)

    // Calcular data de início baseado no período
    let dataInicio: Date | null = null
    if (dias > 0) {
      dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - dias)
      dataInicio.setHours(0, 0, 0, 0)
    }

    // Buscar registros de todos os usuários do account_owner
    let query = supabase
      .from('registros')
      .select(`
        id,
        nome,
        tipo,
        valor,
        categoria,
        data_registro,
        observacao,
        etiquetas,
        parcelas_totais,
        parcelas_pagas,
        user_id,
        created_at
      `)
      .in('user_id', userIds)
      .order('data_registro', { ascending: false })

    // Aplicar filtro de data se necessário
    if (dataInicio) {
      query = query.gte('data_registro', dataInicio.toISOString())
    }

    const { data: registros, error } = await query

    if (error) {
      console.error('Erro ao buscar registros:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar registros' },
        { status: 500 }
      )
    }

    if (!registros || registros.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum registro encontrado para o período selecionado' },
        { status: 404 }
      )
    }

    // Buscar nomes dos usuários
    const registroUserIds = Array.from(new Set(registros.map(r => r.user_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome')
      .in('id', registroUserIds)

    const usuariosMap = new Map(profiles?.map(u => [u.id, u.nome]) || [])
    
    // Se não encontrar no profiles, buscar na tabela users
    if (registroUserIds.length > usuariosMap.size) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, nome')
        .in('id', registroUserIds)
      
      usersData?.forEach(u => {
        if (!usuariosMap.has(u.id) && u.nome) {
          usuariosMap.set(u.id, u.nome)
        }
      })
    }

    // Mapear tipos
    const tipoLabels: Record<string, string> = {
      entrada: 'Entrada',
      saida: 'Saída',
      divida: 'Dívida',
    }

    // Mapear categorias
    const categoriaNomes: Record<string, string> = {
      alimentacao: 'Alimentação',
      transporte: 'Transporte',
      moradia: 'Moradia',
      compras: 'Compras',
      saude: 'Saúde',
      educacao: 'Educação',
      trabalho: 'Trabalho',
      entretenimento: 'Entretenimento',
      fitness: 'Fitness',
      viagem: 'Viagem',
      outros: 'Outros',
    }

    // Criar CSV
    const headers = [
      'Data',
      'Nome',
      'Tipo',
      'Valor (R$)',
      'Categoria',
      'Usuário',
      'Parcelas',
      'Etiquetas',
      'Observação',
    ]

    const rows = registros.map(registro => {
      const dataFormatada = format(new Date(registro.data_registro), 'dd/MM/yyyy', { locale: ptBR })
      const tipo = tipoLabels[registro.tipo] || registro.tipo
      const valor = registro.valor.toFixed(2).replace('.', ',')
      const categoria = registro.categoria ? (categoriaNomes[registro.categoria] || registro.categoria) : ''
      const usuario = usuariosMap.get(registro.user_id) || 'N/A'
      const parcelas = registro.parcelas_totais > 1 
        ? `${registro.parcelas_pagas}/${registro.parcelas_totais}`
        : '1/1'
      const etiquetas = Array.isArray(registro.etiquetas) 
        ? registro.etiquetas.join('; ')
        : (registro.etiquetas || '')
      const observacao = (registro.observacao || '').replace(/"/g, '""').replace(/\n/g, ' ')

      return [
        dataFormatada,
        `"${(registro.nome || '').replace(/"/g, '""')}"`,
        tipo,
        valor,
        categoria,
        `"${usuario.replace(/"/g, '""')}"`,
        parcelas,
        `"${etiquetas.replace(/"/g, '""')}"`,
        `"${observacao}"`,
      ]
    })

    // Combinar headers e rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Adicionar BOM para Excel reconhecer UTF-8
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    // Retornar como arquivo CSV
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="registros-${dias > 0 ? `${dias}-dias` : 'todos'}-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Erro ao exportar registros:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao exportar registros' },
      { status: 500 }
    )
  }
}

