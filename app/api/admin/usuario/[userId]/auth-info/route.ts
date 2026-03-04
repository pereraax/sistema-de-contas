import { NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-middleware'
import { createAdminClient } from '@/lib/supabase/server'

/** Retorna last_sign_in_at do auth para exibir no modal de detalhes (último acesso / online). */
export async function GET(
  _request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const admin = await verifyAdminToken()
    if (!admin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { userId } = params
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })
    }

    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)

    if (error) {
      return NextResponse.json({ last_sign_in_at: null })
    }

    return NextResponse.json({
      last_sign_in_at: user?.last_sign_in_at ?? null,
    })
  } catch {
    return NextResponse.json({ last_sign_in_at: null })
  }
}
