import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { getUltimaRestricaoRegistrada, registrarRestricaoAgora } from '@/lib/whatsapp-restricao-registro'

/** GET: retorna a data da última restrição registrada. */
export async function GET() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }
    const data = await getUltimaRestricaoRegistrada()
    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('[admin/whatsapp-restricao-registro GET]', e)
    return NextResponse.json({ success: false, error: 'Erro ao consultar' }, { status: 500 })
  }
}

/** POST: registra "restrição agora" (salva data/hora atual). */
export async function POST() {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }
    const ok = await registrarRestricaoAgora()
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Erro ao salvar. Verifique a tabela platform_config.' }, { status: 500 })
    }
    const data = await getUltimaRestricaoRegistrada()
    return NextResponse.json({
      success: true,
      data,
      message: 'Restrição registrada com a data/hora atual.',
    })
  } catch (e) {
    console.error('[admin/whatsapp-restricao-registro POST]', e)
    return NextResponse.json({ success: false, error: 'Erro ao registrar' }, { status: 500 })
  }
}
