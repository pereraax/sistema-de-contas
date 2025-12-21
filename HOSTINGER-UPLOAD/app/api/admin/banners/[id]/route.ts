import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/admin-middleware'

// PUT - Atualizar banner (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { imagem_url, ordem, ativo, tempo_transicao } = body

    // Usar admin client se disponível (bypassa RLS), senão usa client normal
    const adminClient = createAdminClient()
    const supabase = adminClient || await createClient()
    
    // Atualizar banner
    const updateData: any = {}
    if (imagem_url !== undefined) updateData.imagem_url = imagem_url
    if (ordem !== undefined) updateData.ordem = ordem
    if (ativo !== undefined) updateData.ativo = ativo
    if (tempo_transicao !== undefined) updateData.tempo_transicao = tempo_transicao

    const { data: banner, error } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!banner) {
      return NextResponse.json(
        { error: 'Banner não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      banner,
    })
  } catch (error: any) {
    console.error('Erro ao atualizar banner:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar banner (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminToken()
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Usar admin client se disponível (bypassa RLS), senão usa client normal
    const adminClient = createAdminClient()
    const supabase = adminClient || await createClient()
    
    // Deletar banner
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Erro ao deletar banner:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

