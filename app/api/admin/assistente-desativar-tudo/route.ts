import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { setAssistenteGlobalPausada } from '@/lib/assistente-global-pausada'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST: para e desativa toda automação da assistente no WhatsApp.
 * - Pausa global (assistente não responde a ninguém)
 * - Desativa assistente em todas as sessões WhatsApp (plen_activated = false)
 * - Desativa por admin e pausa em todos os perfis (plen_activated_by_admin = false, assistente_pausada = true)
 */
export async function POST() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Serviço indisponível' }, { status: 503 })
    }

    // 1) Pausar assistente globalmente
    const okGlobal = await setAssistenteGlobalPausada(true)
    if (!okGlobal) {
      console.warn('[assistente-desativar-tudo] Falha ao setar assistente_global_pausada (tabela platform_config pode não existir)')
    }

    // 2) Desativar assistente em todas as sessões WhatsApp
    let sessionsDone = 0
    try {
      const { data, error } = await supabase
        .from('whatsapp_sessions')
        .update({ plen_activated: false, updated_at: new Date().toISOString() })
        .select('id')
      if (!error && data) sessionsDone = data.length
    } catch {
      // Tabela/coluna pode não existir
    }

    // 3) Desativar em todos os perfis (colunas podem não existir)
    let profilesDone = 0
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          plen_activated_by_admin: false,
          assistente_pausada: true,
          updated_at: new Date().toISOString(),
        })
        .select('id')
      if (!error && data) profilesDone = data.length
    } catch {
      // Colunas plen_activated_by_admin ou assistente_pausada podem não existir
    }

    return NextResponse.json({
      success: true,
      message: 'Automação da assistente no WhatsApp parada e desativada.',
      pausadaGlobal: okGlobal,
      sessoesWhatsAppDesativadas: sessionsDone,
      perfisDesativados: profilesDone,
    })
  } catch (e) {
    console.error('[assistente-desativar-tudo]', e)
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST para parar e desativar toda automação da assistente no WhatsApp.',
  })
}
