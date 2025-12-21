import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/admin-middleware'

// GET - Buscar todos os banners (admin)
export async function GET(request: NextRequest) {
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
    
    // Buscar todos os banners ordenados por ordem
    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true })

    // Se a tabela não existir, retornar array vazio
    if (error) {
      if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === '42P01') {
        return NextResponse.json({
          banners: [],
        })
      }
      return NextResponse.json(
        { error: error.message, banners: [] },
        { status: 200 } // Retornar 200 para não quebrar a interface
      )
    }

    return NextResponse.json({
      banners: banners || [],
    })
  } catch (error: any) {
    console.error('Erro ao buscar banners:', error)
    return NextResponse.json({
      banners: [],
    })
  }
}

// POST - Criar novo banner (admin)
export async function POST(request: NextRequest) {
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

    if (!imagem_url) {
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      )
    }

    // Usar admin client se disponível (bypassa RLS), senão usa client normal
    const adminClient = createAdminClient()
    const supabase = adminClient || await createClient()
    
    // Inserir novo banner
    const { data: banner, error } = await supabase
      .from('banners')
      .insert({
        imagem_url,
        ordem: ordem || 0,
        ativo: ativo !== undefined ? ativo : true,
        tempo_transicao: tempo_transicao || 5,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      banner,
    })
  } catch (error: any) {
    console.error('Erro ao criar banner:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

