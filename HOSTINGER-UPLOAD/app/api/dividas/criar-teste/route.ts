import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Verificar se já existe uma dívida de teste (usar maybeSingle para evitar erro se houver múltiplas)
    const { data: dividasTeste, error: erroBusca } = await supabase
      .from('registros')
      .select('id')
      .eq('tipo', 'divida')
      .eq('nome', 'Dívida de Teste - Tutorial')

    if (erroBusca) {
      console.error('Erro ao verificar dívidas de teste:', erroBusca)
      return NextResponse.json({ error: erroBusca.message }, { status: 500 })
    }

    // Se já existir QUALQUER dívida de teste, não criar novamente
    if (dividasTeste && dividasTeste.length > 0) {
      console.log(`⚠️ Já existem ${dividasTeste.length} dívida(s) de teste. Não criando nova.`)
      return NextResponse.json({ data: null, alreadyExists: true })
    }

    // Buscar o primeiro usuário disponível
    const { data: usuarios } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    const user_id = usuarios && usuarios.length > 0 ? usuarios[0].id : user.id

    // Criar dívida de teste
    const dividaTesteData = {
      user_id: user_id,
      nome: 'Dívida de Teste - Tutorial',
      observacao: 'Esta é uma dívida de exemplo criada automaticamente para o tutorial. Você pode editá-la ou excluí-la.',
      tipo: 'divida',
      valor: 500.00,
      categoria: 'Outros',
      etiquetas: ['tutorial', 'teste'],
      parcelas_totais: 3,
      parcelas_pagas: 0,
      data_registro: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('registros')
      .insert([dividaTesteData])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar dívida de teste:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidatePath('/dividas')
    revalidatePath('/home')

    return NextResponse.json({ data, alreadyExists: false })
  } catch (error: any) {
    console.error('Erro ao criar dívida de teste:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar dívida de teste' },
      { status: 500 }
    )
  }
}

