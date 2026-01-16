import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/admin-middleware'

/**
 * GET - Obter valor de uma configuração global
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Parâmetro "key" é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Buscar configuração do banco de dados
    const { data, error } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      // Se não encontrou, retornar null (não é erro)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ value: null })
      }
      console.error('Erro ao buscar configuração:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar configuração' },
        { status: 500 }
      )
    }

    return NextResponse.json({ value: data?.value || null })
  } catch (error: any) {
    console.error('Erro ao obter configuração:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao obter configuração' },
      { status: 500 }
    )
  }
}

/**
 * POST - Salvar/atualizar configuração global (apenas admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Campo "key" é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('platform_config')
      .select('id')
      .eq('key', key)
      .single()

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from('platform_config')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)

      if (error) {
        console.error('Erro ao atualizar configuração:', error)
        return NextResponse.json(
          { error: 'Erro ao atualizar configuração' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'Configuração atualizada' })
    } else {
      // Criar novo
      const { error } = await supabase
        .from('platform_config')
        .insert({ key, value })

      if (error) {
        console.error('Erro ao criar configuração:', error)
        return NextResponse.json(
          { error: 'Erro ao criar configuração' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'Configuração criada' })
    }
  } catch (error: any) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar configuração' },
      { status: 500 }
    )
  }
}

