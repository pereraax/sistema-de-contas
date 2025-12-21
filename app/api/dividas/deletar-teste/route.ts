import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Deletar TODAS as dívidas de teste
    const { data, error } = await supabase
      .from('registros')
      .delete()
      .eq('tipo', 'divida')
      .eq('nome', 'Dívida de Teste - Tutorial')
      .select()

    if (error) {
      console.error('Erro ao deletar dívidas de teste:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Deletadas ${data?.length || 0} dívida(s) de teste`)

    revalidatePath('/dividas')
    revalidatePath('/home')

    return NextResponse.json({ 
      success: true, 
      deleted: data?.length || 0,
      data 
    })
  } catch (error: any) {
    console.error('Erro ao deletar dívidas de teste:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar dívidas de teste' },
      { status: 500 }
    )
  }
}

















