import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

/** GET: retorna se a assistente PLEN está ativa para o usuário (sessão WhatsApp ou ativação por admin). */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Serviço indisponível' }, { status: 503 })
    }

    // 1) Status por sessão WhatsApp (qualquer sessão com esse user_id e plen_activated)
    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('plen_activated')
      .eq('user_id', userId)
      .maybeSingle()

    if (session?.plen_activated === true) {
      return NextResponse.json({ success: true, plenActivated: true })
    }

    // 2) Status por ativação do admin (profiles.plen_activated_by_admin)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plen_activated_by_admin')
      .eq('id', userId)
      .maybeSingle()

    if (profileError && (profileError.message?.includes('plen_activated_by_admin') || (profileError as any).code === '42703')) {
      return NextResponse.json({ success: true, plenActivated: false })
    }
    const byAdmin = profile?.plen_activated_by_admin === true
    return NextResponse.json({ success: true, plenActivated: byAdmin })
  } catch (e) {
    console.error('[admin/plen-assistant GET]', e)
    return NextResponse.json({ success: false, error: 'Erro ao consultar status' }, { status: 500 })
  }
}

/** POST: ativa ou desativa a assistente PLEN para o usuário (ativação por admin). */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const userId = body?.userId
    const activated = body?.activated === true

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Serviço indisponível' }, { status: 503 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ plen_activated_by_admin: activated })
      .eq('id', userId)

    if (error) {
      // Coluna pode não existir ainda (migração não rodou)
      if (error.message?.includes('plen_activated_by_admin') || error.code === '42703') {
        return NextResponse.json({
          success: false,
          error: 'Execute o SQL ADICIONAR-PLEN-ACTIVATED-BY-ADMIN.sql no Supabase para habilitar ativação pelo admin.',
        }, { status: 500 })
      }
      console.error('[admin/plen-assistant POST]', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Se ativou e o usuário tem telefone/whatsapp, criar/atualizar whatsapp_sessions para esse número
    // para que a próxima mensagem já encontre a sessão
    if (activated) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, telefone, whatsapp')
        .eq('id', userId)
        .maybeSingle()

      const rawPhone = profile?.telefone || profile?.whatsapp
      if (rawPhone && typeof rawPhone === 'string') {
        const digits = rawPhone.replace(/\D/g, '')
        const phoneNumber = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits.startsWith('55') ? digits : `55${digits}`
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 365) // 1 ano para ativação admin

        await supabase.from('whatsapp_sessions').upsert({
          phone_number: phoneNumber,
          user_id: userId,
          plen_activated: true,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'phone_number' })
      }
    } else {
      // Desativar: remover plen_activated das sessões desse usuário
      await supabase
        .from('whatsapp_sessions')
        .update({ plen_activated: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    }

    return NextResponse.json({
      success: true,
      plenActivated: activated,
      message: activated ? 'Assistente PLEN ativada para este usuário. Quando ele enviar mensagem do número cadastrado, será atendido normalmente.' : 'Assistente PLEN desativada para este usuário.',
    })
  } catch (e) {
    console.error('[admin/plen-assistant POST]', e)
    return NextResponse.json({ success: false, error: 'Erro ao alterar status' }, { status: 500 })
  }
}
