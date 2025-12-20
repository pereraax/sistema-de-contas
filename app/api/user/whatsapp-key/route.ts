/**
 * API para gerenciar chave WhatsApp do usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * GET - Obter chave WhatsApp do usuário
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('whatsapp_key')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar chave WhatsApp:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar chave' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      whatsapp_key: profile?.whatsapp_key || null,
      has_key: !!profile?.whatsapp_key,
    })
  } catch (error: any) {
    console.error('Erro ao obter chave WhatsApp:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Gerar ou regenerar chave WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Gerar chave única (formato: xxxxx-xxxxx-xxxxx)
    const generateKey = () => {
      const part1 = crypto.randomBytes(3).toString('hex').toUpperCase()
      const part2 = crypto.randomBytes(3).toString('hex').toUpperCase()
      const part3 = crypto.randomBytes(3).toString('hex').toUpperCase()
      return `${part1}-${part2}-${part3}`
    }

    let newKey = generateKey()
    
    // Garantir que a chave é única (verificar se já existe)
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('whatsapp_key', newKey)
        .single()
      
      if (!existing) break
      
      newKey = generateKey()
      attempts++
    }

    // Atualizar perfil com a nova chave
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ whatsapp_key: newKey })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao atualizar chave WhatsApp:', updateError)
      return NextResponse.json(
        { error: 'Erro ao gerar chave' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      whatsapp_key: newKey,
      message: 'Chave gerada com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao gerar chave WhatsApp:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remover chave WhatsApp
 */
export async function DELETE() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Remover chave
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ whatsapp_key: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erro ao remover chave WhatsApp:', updateError)
      return NextResponse.json(
        { error: 'Erro ao remover chave' },
        { status: 500 }
      )
    }

    // Remover sessões WhatsApp ativas
    await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('user_id', user.id)

    return NextResponse.json({
      success: true,
      message: 'Chave removida com sucesso',
    })
  } catch (error: any) {
    console.error('Erro ao remover chave WhatsApp:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}








