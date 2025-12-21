import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { avisoId, userId } = await request.json()

    if (!avisoId || !userId) {
      return NextResponse.json(
        { error: 'Aviso ID e User ID são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { error } = await supabase
      .from('avisos_vistos')
      .insert({
        aviso_id: avisoId,
        user_id: userId
      })
      .select()
      .single()

    if (error && !error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Erro ao marcar aviso como visto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', success: false },
      { status: 500 }
    )
  }
}





