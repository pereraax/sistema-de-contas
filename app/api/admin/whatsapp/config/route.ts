import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET - Obter configuração salva
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Buscar configuração do banco de dados
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar configuração:', error)
    }

    // Se não encontrou no banco, usar variáveis de ambiente (fallback)
    const config = data ? {
      apiUrl: data.evolution_api_url,
      apiKey: data.evolution_api_key,
      instanceName: data.evolution_instance_name,
    } : {
      apiUrl: process.env.EVOLUTION_API_URL || '',
      apiKey: process.env.EVOLUTION_API_KEY || '',
      instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'plenipay',
    }

    return NextResponse.json({ config })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao obter configuração' },
      { status: 500 }
    )
  }
}

/**
 * POST - Salvar configuração
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = body

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'URL e API Key são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Desativar configurações antigas
    await supabase
      .from('whatsapp_config')
      .update({ is_active: false })
      .eq('is_active', true)

    // Criar nova configuração
    const { data, error } = await supabase
      .from('whatsapp_config')
      .insert({
        evolution_api_url: apiUrl,
        evolution_api_key: apiKey,
        evolution_instance_name: instanceName || 'plenipay',
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar configuração:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar configuração no banco de dados' },
        { status: 500 }
      )
    }

    // Atualizar variáveis de ambiente também (para compatibilidade)
    process.env.EVOLUTION_API_URL = apiUrl
    process.env.EVOLUTION_API_KEY = apiKey
    process.env.EVOLUTION_INSTANCE_NAME = instanceName || 'plenipay'

    return NextResponse.json({
      success: true,
      message: 'Configuração salva com sucesso!',
      data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar configuração' },
      { status: 500 }
    )
  }
}













