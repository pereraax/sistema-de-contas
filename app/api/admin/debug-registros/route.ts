import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Endpoint de debug para verificar registros de um usuário
 * Acesse: /api/admin/debug-registros?email=usuario@email.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório. Use: /api/admin/debug-registros?email=usuario@email.com' },
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

    // Buscar perfil pelo email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, nome, plano')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: `Usuário não encontrado com email: ${email}`, details: profileError?.message },
        { status: 404 }
      )
    }

    const accountOwnerId = profile.id

    // Buscar usuários (users) que pertencem a este account_owner_id
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('users')
      .select('id, nome, account_owner_id, created_at')
      .eq('account_owner_id', accountOwnerId)

    if (usuariosError) {
      return NextResponse.json(
        { error: 'Erro ao buscar usuários', details: usuariosError.message },
        { status: 500 }
      )
    }

    const userIds = usuarios && usuarios.length > 0 ? usuarios.map((u: any) => u.id) : []

    // Buscar todos os registros
    let registrosTodos = []
    if (userIds.length > 0) {
      const { data: registros, error: registrosError } = await supabaseAdmin
        .from('registros')
        .select('id, user_id, nome, tipo, valor, data_registro, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!registrosError && registros) {
        registrosTodos = registros
      }
    }

    // Calcular contagens
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0)
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999)

    const registrosMesAtual = registrosTodos.filter((r: any) => {
      const dataCriacao = r.created_at ? new Date(r.created_at) : new Date(r.data_registro)
      return dataCriacao >= inicioMes && dataCriacao <= fimMes
    })

    const totalRegistros = registrosTodos.length
    const registrosMes = registrosMesAtual.length
    const registrosEntrada = registrosTodos.filter((r: any) => r.tipo === 'entrada').length
    const registrosSaida = registrosTodos.filter((r: any) => r.tipo === 'saida').length
    const registrosDivida = registrosTodos.filter((r: any) => r.tipo === 'divida').length

    return NextResponse.json({
      perfil: {
        id: profile.id,
        email: profile.email,
        nome: profile.nome,
        plano: profile.plano,
      },
      usuarios: usuarios?.map((u: any) => ({
        id: u.id,
        nome: u.nome,
        account_owner_id: u.account_owner_id,
        created_at: u.created_at,
      })) || [],
      contagens: {
        totalRegistros,
        registrosMes,
        registrosEntrada,
        registrosSaida,
        registrosDivida,
      },
      periodo: {
        inicioMes: inicioMes.toISOString(),
        fimMes: fimMes.toISOString(),
      },
      registrosDoMes: registrosMesAtual.slice(0, 10).map((r: any) => ({
        id: r.id,
        nome: r.nome,
        tipo: r.tipo,
        valor: r.valor,
        created_at: r.created_at,
        data_registro: r.data_registro,
      })),
      debug: {
        totalUsuarios: usuarios?.length || 0,
        userIds: userIds,
        totalRegistrosEncontrados: registrosTodos.length,
      }
    })
  } catch (error: any) {
    console.error('Erro ao buscar informações de debug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

