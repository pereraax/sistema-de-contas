import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem 0/O, 1/I/L para evitar confusão

function gerarChave(): string {
  const segment = () => {
    let s = ''
    for (let i = 0; i < 5; i++) {
      s += CHARS[Math.floor(Math.random() * CHARS.length)]
    }
    return s
  }
  return `${segment()}-${segment()}-${segment()}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('whatsapp_key')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[whatsapp-key GET] Erro ao buscar perfil:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      whatsapp_key: profile?.whatsapp_key ?? null,
    })
  } catch (err: unknown) {
    console.error('[whatsapp-key GET] Erro:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao obter chave' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const novaChave = gerarChave()
    const admin = createAdminClient()

    if (!admin) {
      return NextResponse.json({ success: false, error: 'Serviço indisponível' }, { status: 503 })
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update({ whatsapp_key: novaChave })
      .eq('id', user.id)

    if (updateError) {
      console.error('[whatsapp-key POST] Erro ao atualizar perfil:', updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      whatsapp_key: novaChave,
    })
  } catch (err: unknown) {
    console.error('[whatsapp-key POST] Erro:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao gerar chave' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const admin = createAdminClient()

    if (!admin) {
      return NextResponse.json({ success: false, error: 'Serviço indisponível' }, { status: 503 })
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update({ whatsapp_key: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('[whatsapp-key DELETE] Erro ao remover chave:', updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[whatsapp-key DELETE] Erro:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao remover chave' },
      { status: 500 }
    )
  }
}
