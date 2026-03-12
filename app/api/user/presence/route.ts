import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** Atualiza last_seen_at do usuário logado. Chamado periodicamente pelo app para presença "online". */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      // Coluna last_seen_at pode não existir se a migration não foi aplicada; não quebra o app
      if (process.env.NODE_ENV === 'development') {
        console.warn('[presence] update last_seen_at:', updateError.message)
      }
      return NextResponse.json({ ok: false }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[presence]', e)
    }
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
