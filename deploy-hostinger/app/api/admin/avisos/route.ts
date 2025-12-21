import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Buscar avisos ativos
    const { data: avisos, error: avisosError } = await supabase
      .from('admin_avisos')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (avisosError) {
      return NextResponse.json(
        { error: avisosError.message, avisos: [] },
        { status: 500 }
      )
    }

    // Buscar quais avisos o usuário já viu
    const { data: avisosVistos } = await supabase
      .from('avisos_vistos')
      .select('aviso_id')
      .eq('user_id', userId)

    const avisosVistosIds = new Set(avisosVistos?.map(a => a.aviso_id) || [])

    // Filtrar avisos não vistos
    const avisosNaoVistos = avisos?.filter(a => !avisosVistosIds.has(a.id)) || []

    return NextResponse.json({
      avisos: avisosNaoVistos,
    })
  } catch (error: any) {
    console.error('Erro ao buscar avisos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', avisos: [] },
      { status: 500 }
    )
  }
}





