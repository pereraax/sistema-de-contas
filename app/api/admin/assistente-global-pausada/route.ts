import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getAssistenteGlobalPausada, setAssistenteGlobalPausada } from '@/lib/assistente-global-pausada'

/** GET: retorna se a assistente está pausada globalmente. */
export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }
    const pausada = await getAssistenteGlobalPausada()
    return NextResponse.json({ success: true, pausada })
  } catch (e) {
    console.error('[admin/assistente-global-pausada GET]', e)
    return NextResponse.json({ success: false, error: 'Erro ao consultar' }, { status: 500 })
  }
}

/** POST: pausa ou retoma a assistente para todos. Body: { pausada: boolean } */
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const pausada = body?.pausada
    if (typeof pausada !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Envie { "pausada": true } ou { "pausada": false }' }, { status: 400 })
    }
    const ok = await setAssistenteGlobalPausada(pausada)
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Erro ao salvar. Verifique se a tabela platform_config existe e se executou ADICIONAR-ASSISTENTE-GLOBAL-PAUSADA-CONFIG.sql' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      pausada,
      message: pausada ? 'Assistente pausada para todos.' : 'Assistente retomada para todos.',
    })
  } catch (e) {
    console.error('[admin/assistente-global-pausada POST]', e)
    return NextResponse.json({ success: false, error: 'Erro ao alterar' }, { status: 500 })
  }
}
