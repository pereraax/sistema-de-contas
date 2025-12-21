import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// API pública para buscar banners ativos
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [API /api/banners] Iniciando busca de banners...')
    
    // Tentar usar admin client primeiro (bypassa RLS), senão usa client normal
    let supabase
    const adminClient = createAdminClient()
    
    if (adminClient) {
      supabase = adminClient
      console.log('🔑 [API /api/banners] Usando cliente Admin (bypassa RLS)')
    } else {
      supabase = await createClient()
      console.log('🔑 [API /api/banners] Usando cliente Normal')
    }
    
    if (!supabase) {
      console.error('❌ [API /api/banners] Nenhum cliente Supabase disponível')
      return NextResponse.json({
        banners: [],
      })
    }
    
    // Buscar banners ativos ordenados por ordem
    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true })

    // Se a tabela não existir ou houver erro, retornar array vazio (não quebrar a página)
    if (error) {
      // Se for erro de tabela não encontrada, retornar vazio sem erro
      if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === '42P01') {
        console.log('⚠️ [API /api/banners] Tabela banners não existe ainda. Retornando array vazio.')
        return NextResponse.json({
          banners: [],
        })
      }
      console.error('❌ [API /api/banners] Erro ao buscar banners:', error)
      return NextResponse.json(
        { error: error.message, banners: [] },
        { status: 200 } // Retornar 200 mesmo com erro para não quebrar a página
      )
    }

    console.log('✅ [API /api/banners] Banners encontrados:', banners?.length || 0, banners)
    return NextResponse.json({
      banners: banners || [],
    })
  } catch (error: any) {
    // Em caso de qualquer erro, retornar array vazio para não quebrar a página
    console.error('❌ [API /api/banners] Erro ao buscar banners:', error)
    return NextResponse.json({
      banners: [],
    })
  }
}

