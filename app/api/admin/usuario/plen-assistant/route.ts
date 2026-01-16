import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminToken } from '@/lib/admin-middleware'

/**
 * GET - Buscar status do assistente PLEN para um usuário
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Parâmetro userId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Buscar sessão WhatsApp do usuário
    const { data: session, error } = await supabase
      .from('whatsapp_sessions')
      .select('plen_activated, phone_number')
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar sessão:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar status do assistente' },
        { status: 500 }
      )
    }

    // Se não tem sessão, retornar false (não ativado)
    const isActivated = session?.plen_activated === true

    return NextResponse.json({
      success: true,
      plenActivated: isActivated,
      hasWhatsAppSession: !!session,
      phoneNumber: session?.phone_number || null,
    })
  } catch (error: any) {
    console.error('Erro ao buscar status do assistente PLEN:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar status do assistente' },
      { status: 500 }
    )
  }
}

/**
 * POST - Ativar ou desativar assistente PLEN para um usuário
 */
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
    const { userId, activated } = body

    if (!userId || typeof activated !== 'boolean') {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. userId e activated (boolean) são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Buscar sessão WhatsApp do usuário
    const { data: existingSession, error: fetchError } = await supabase
      .from('whatsapp_sessions')
      .select('id, phone_number')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erro ao buscar sessão:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao buscar sessão WhatsApp do usuário' },
        { status: 500 }
      )
    }

    if (!existingSession) {
      // Se não tem sessão WhatsApp, retornar erro
      return NextResponse.json(
        { error: 'Usuário não possui sessão WhatsApp ativa. O usuário precisa autenticar via WhatsApp primeiro.' },
        { status: 400 }
      )
    }

    // Atualizar ou criar sessão com status de ativação
    const { error: updateError } = await supabase
      .from('whatsapp_sessions')
      .update({ 
        plen_activated: activated,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Erro ao atualizar status do assistente:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar status do assistente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Assistente PLEN ${activated ? 'ativado' : 'desativado'} com sucesso!`,
      plenActivated: activated,
    })
  } catch (error: any) {
    console.error('Erro ao alterar status do assistente PLEN:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao alterar status do assistente' },
      { status: 500 }
    )
  }
}

