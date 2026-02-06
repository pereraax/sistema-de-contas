import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { marcarAvisoComoVisto } from '@/lib/admin-actions'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const avisoId = body?.avisoId ?? body?.aviso_id

    if (!avisoId || typeof avisoId !== 'string') {
      return NextResponse.json({ error: 'avisoId obrigatório' }, { status: 400 })
    }

    const { success, error } = await marcarAvisoComoVisto(avisoId, user.id)

    if (!success) {
      return NextResponse.json({ error: error || 'Erro ao marcar como visto' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[user/avisos/marcar-visto] Erro:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao marcar como visto' },
      { status: 500 }
    )
  }
}
