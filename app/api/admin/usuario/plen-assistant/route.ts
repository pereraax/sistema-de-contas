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

    // 1) Status por sessão WhatsApp (qualquer sessão com esse user_id e plen_activated = true)
    const { data: sessions } = await supabase
      .from('whatsapp_sessions')
      .select('plen_activated')
      .eq('user_id', userId)

    const algumaAtiva = Array.isArray(sessions) && sessions.some((s: { plen_activated?: boolean }) => s?.plen_activated === true)
    if (algumaAtiva) {
      const { data: profilePause } = await supabase
        .from('profiles')
        .select('assistente_pausada')
        .eq('id', userId)
        .maybeSingle()
      return NextResponse.json({
        success: true,
        plenActivated: true,
        assistentePausada: profilePause?.assistente_pausada === true,
      })
    }

    // 2) Status por ativação do admin (profiles.plen_activated_by_admin) e assistente_pausada
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plen_activated_by_admin, assistente_pausada')
      .eq('id', userId)
      .maybeSingle()

    if (profileError && (profileError.message?.includes('plen_activated_by_admin') || (profileError as any).code === '42703')) {
      return NextResponse.json({ success: true, plenActivated: false, assistentePausada: false })
    }
    const byAdmin = profile?.plen_activated_by_admin === true
    const assistentePausada = profile?.assistente_pausada === true
    return NextResponse.json({ success: true, plenActivated: byAdmin, assistentePausada })
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
    const activated = body?.activated
    const paused = body?.paused

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Serviço indisponível' }, { status: 503 })
    }

    // Atualizar activated e/ou paused conforme enviado
    const updates: Record<string, boolean> = {}
    if (typeof activated === 'boolean') updates.plen_activated_by_admin = activated
    if (typeof paused === 'boolean') updates.assistente_pausada = paused

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'Envie activated e/ou paused no body' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      // Coluna pode não existir ainda (migração não rodou)
      if (error.message?.includes('plen_activated_by_admin') || error.message?.includes('assistente_pausada') || error.code === '42703') {
        return NextResponse.json({
          success: false,
          error: 'Execute os SQL ADICIONAR-PLEN-ACTIVATED-BY-ADMIN.sql e ADICIONAR-ASSISTENTE-PAUSADA.sql no Supabase.',
        }, { status: 500 })
      }
      console.error('[admin/plen-assistant POST]', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Se ativou e o usuário tem telefone/whatsapp, criar/atualizar whatsapp_sessions para esse número
    // para que a próxima mensagem já encontre a sessão
    if (typeof activated === 'boolean' && activated) {
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
    } else if (typeof activated === 'boolean' && !activated) {
      // Desativar: remover plen_activated das sessões desse usuário
      await supabase
        .from('whatsapp_sessions')
        .update({ plen_activated: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    }

    const msgParts: string[] = []
    if (typeof activated === 'boolean') {
      msgParts.push(activated ? 'Assistente PLEN ativada.' : 'Assistente PLEN desativada.')
    }
    if (typeof paused === 'boolean') {
      msgParts.push(paused ? 'Assistente pausada — humano pode atender no WhatsApp.' : 'Assistente despausada — voltará a responder.')
    }
    return NextResponse.json({
      success: true,
      plenActivated: typeof activated === 'boolean' ? activated : undefined,
      assistentePausada: typeof paused === 'boolean' ? paused : undefined,
      message: msgParts.join(' ') || 'Atualizado.',
    })
  } catch (e) {
    console.error('[admin/plen-assistant POST]', e)
    return NextResponse.json({ success: false, error: 'Erro ao alterar status' }, { status: 500 })
  }
}
