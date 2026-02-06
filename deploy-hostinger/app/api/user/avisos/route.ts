import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { obterAvisosParaUsuario } from '@/lib/admin-actions'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: avisos, error } = await obterAvisosParaUsuario(user.id)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ avisos: avisos || [] })
  } catch (err: unknown) {
    console.error('[user/avisos] Erro:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao carregar avisos' },
      { status: 500 }
    )
  }
}
